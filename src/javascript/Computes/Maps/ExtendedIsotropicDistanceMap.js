import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeExtendedIsotropicDistanceMap } from '../Programs/DistanceMaps/Isotropic/GPGPUExtendedIsotropicDistanceMap'
import { computeExtendedIsotropicDistanceMap as computeExtendedIsotropicDistanceMapPacked } from '../Programs/DistanceMaps/Isotropic/GPGPUExtendedIsotropicDistanceMapPacked'

/** Encode negative and positive XYZ skip extents in R and G respectively. Each word stores XYZ in bits 15–11, 10–6, and 5–1, with occupancy in bit 0. */
export default class ExtendedIsotropicDistanceMap
{
    /** @param {boolean} [unpacked] - Use scalar programs. Both modes produce the same packed words. */
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        this.computeDistance = unpacked ? computeExtendedIsotropicDistanceMap : computeExtendedIsotropicDistanceMapPacked
        this.maxDistance = 31
    }

    /** Build [z,y,x,2] words, with XYZ extents capped at 31 from the current occupancy tensor. tf.tidy releases unretained intermediates. The returned kernel tensor is stored on this map. */
    computeTensor()
    {
        console.time('computeTensor')

        this.tensor = tf.tidy(() => this.computeDistance(this.occupancyMap.tensor, this.maxDistance))
        this.dimensions = new THREE.Vector3(...this.occupancyMap.dimensions)

        console.timeEnd('computeTensor')
    }

    /** Create the nearest-filtered RG16UI 3D texture from a synchronous readback and queue its upload. */
    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGIntegerFormat
        this.texture.type = THREE.UnsignedShortType
        this.texture.internalFormat = 'RG16UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 2
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
     * @returns {Uint16Array} Two consecutive 5-5-5-1 words per block, negative then positive.
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
