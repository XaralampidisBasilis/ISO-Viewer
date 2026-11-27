import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeIsotropicDistanceMap } from '../Programs/DistanceMaps/Isotropic/GPGPUIsotropicDistanceMap'
import { computeIsotropicDistanceMap as computeIsotropicDistanceMapPacked } from '../Programs/DistanceMaps/Isotropic/GPGPUIsotropicDistanceMapPacked'

/** Store the nearest occupied Chebyshev distance in block units, shared across all ray directions. */
export default class IsotropicDistanceMap
{
    /** @param {boolean} [unpacked] - Use the scalar transform. Both modes produce the same block layout. */
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        this.computeDistance = unpacked ? computeIsotropicDistanceMap : computeIsotropicDistanceMapPacked
        this.maxDistance = 255
    }

    /** Build [z,y,x] Chebyshev radii, capped at 255 from the current occupancy tensor. tf.tidy releases unretained intermediates. The returned kernel tensor is stored on this map. */
    computeTensor()
    {
        console.time('computeTensor')

        this.tensor = tf.tidy(() => this.computeDistance(this.occupancyMap.tensor, this.maxDistance))
        this.dimensions = new THREE.Vector3(...this.occupancyMap.dimensions)

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
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1

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
     * @returns {Uint8Array} One radius per block, with zero marking occupancy.
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
