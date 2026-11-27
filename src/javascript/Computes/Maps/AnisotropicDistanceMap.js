import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeAnisotropicDistanceMap } from '../Programs/DistanceMaps/Anisotropic/GPGPUAnisotropicDistanceMapFused'
import { computeAnisotropicDistanceMap as computeAnisotropicDistanceMapPacked } from '../Programs/DistanceMaps/Anisotropic/GPGPUAnisotropicDistanceMapFusedPacked'
import { computeAnisotropicDistanceMap as computeUnfusedDistanceMap } from '../Programs/DistanceMaps/Anisotropic/GPGPUAnisotropicDistanceMap'
import { computeAnisotropicDistanceMap as computeUnfusedDistanceMapPacked } from '../Programs/DistanceMaps/Anisotropic/GPGPUAnisotropicDistanceMapPacked'

/** Represent each radius in block units for one ray octant. Octant = xSign + 2*ySign + 4*zSign, where 1 is positive. */
export default class AnisotropicDistanceMap
{
    /**
     * @param {boolean} [unpacked] - Use scalar distance kernels.
     * @param {boolean} [fused=true] - Use fused passes. All variants use the same octant layout.
     */
    constructor(unpacked, fused = true)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        if (fused) this.computeDistance = unpacked ? computeAnisotropicDistanceMap : computeAnisotropicDistanceMapPacked
        else this.computeDistance = unpacked ? computeUnfusedDistanceMap : computeUnfusedDistanceMapPacked
        this.maxDistance = 127
    }

    /** Build [octant,z,y,x] distances to candidate blocks, capped at 127 from the current occupancy tensor. tf.tidy releases unretained intermediates. The returned kernel tensor is stored on this map. */
    computeTensor()
    {
        console.time('computeTensor')

        this.tensor = tf.tidy(() => this.computeDistance(this.occupancyMap.tensor, this.maxDistance))
        this.dimensions = new THREE.Vector3(...this.occupancyMap.dimensions)
        // The upload stacks octants along Z, so the shader uses z + octant*gridDepth.
        this.dimensions.z *= 8

        console.timeEnd('computeTensor')
    }

    /** Create the nearest-filtered R8UI 3D texture from a synchronous readback and queue its upload. */
    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RedIntegerFormat
        this.texture.type = THREE.UnsignedByteType
        this.texture.internalFormat = 'R8UI'
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
     * @returns {Uint8Array} One radius per block and octant, with zero marking occupancy.
     */
    getTextureData()
    {
        return new Uint8Array(this.tensor.dataSync())
    }

    /** Release the final distance tensor and the Three.js texture if present. */
    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
