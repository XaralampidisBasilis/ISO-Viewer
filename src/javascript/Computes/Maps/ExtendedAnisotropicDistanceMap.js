import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeExtendedAnisotropicDistanceMap } from '../Programs/DistanceMaps/Anisotropic/GPGPUExtendedAnisotropicDistanceMapFused'
import { computeExtendedAnisotropicDistanceMap as computeExtendedAnisotropicDistanceMapPacked } from '../Programs/DistanceMaps/Anisotropic/GPGPUExtendedAnisotropicDistanceMapFusedPacked'
import { computeExtendedAnisotropicDistanceMap as computeUnfusedDistanceMap } from '../Programs/DistanceMaps/Anisotropic/GPGPUExtendedAnisotropicDistanceMap'
import { computeExtendedAnisotropicDistanceMap as computeUnfusedDistanceMapPacked } from '../Programs/DistanceMaps/Anisotropic/GPGPUExtendedAnisotropicDistanceMapPacked'

/** Encode per-octant XYZ skip extents in bits 15–11, 10–6, and 5–1, with occupancy in bit 0. Octant = xSign + 2*ySign + 4*zSign, where 1 is positive. */
export default class ExtendedAnisotropicDistanceMap
{
    /**
     * @param {boolean} [unpacked] - Use scalar distance kernels.
     * @param {boolean} [fused=true] - Use fused passes. All variants produce the same packed words.
     */
    constructor(unpacked, fused = true)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        if (fused) this.computeDistance = unpacked ? computeExtendedAnisotropicDistanceMap : computeExtendedAnisotropicDistanceMapPacked
        else this.computeDistance = unpacked ? computeUnfusedDistanceMap : computeUnfusedDistanceMapPacked
        this.maxDistance = 31
    }

    /** Build [octant,z,y,x] words, with XYZ extents capped at 31 from the current occupancy tensor. tf.tidy releases unretained intermediates. The returned kernel tensor is stored on this map. */
    computeTensor()
    {
        console.time('computeTensor')

        this.tensor = tf.tidy(() => this.computeDistance(this.occupancyMap.tensor, this.maxDistance))
        this.dimensions = new THREE.Vector3(...this.occupancyMap.dimensions)
        // The upload stacks octants along Z, so the shader uses z + octant*gridDepth.
        this.dimensions.z *= 8

        console.timeEnd('computeTensor')
    }

    /** Create the nearest-filtered R16UI 3D texture from a synchronous readback and queue its upload. */
    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RedIntegerFormat
        this.texture.type = THREE.UnsignedShortType
        this.texture.internalFormat = 'R16UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 1
        this.texture.needsUpdate = true

        console.timeEnd('computeTexture')
    }

    /** Replace the bytes of a same-sized texture in place and queue an upload. */
    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    /**
     * Synchronously read the tensor in x-fastest spatial order.
     *
     * @returns {Uint16Array} One numeric 5-5-5-1 word per block and octant.
     */
    getTextureData()
    {
        return new Uint16Array(this.tensor.dataSync())
    }

    /** Release the final distance tensor and the Three.js texture if present. */
    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
