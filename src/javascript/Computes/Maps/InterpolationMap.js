import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { interpolationMap } from '../Programs/Interpolation/GPGPUInterpolationMap'
import { computeInterpolationMap } from '../Programs/Interpolation/GPGPUInterpolationMapPacked'
import { toHalfFloat } from '../Programs/Encoding/GPGPUToHalfFloat'
import { toHalfFloat as toHalfFloatPacked } from '../Programs/Encoding/GPGPUToHalfFloatPacked'
import readHalfFloatBits from '../Programs/Encoding/readHalfFloatBits'

/** Build and upload the voxel features shared by trilinear and corrected tricubic sampling. RGBA stores [Δxx F, Δyy F, Δzz F, F] in voxel units. */
export default class InterpolationMap
{
    /** @param {boolean} [unpacked] - Use the scalar feature and half-float encoding kernels. */
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.volumeMap = this.computes.volumeMap
        this.unpacked = unpacked
        this.computeInterpolation = unpacked ? interpolationMap : computeInterpolationMap
        this.toHalfFloat = unpacked ? toHalfFloat : toHalfFloatPacked
    }

    /** Derive features from the normalized scalar volume. Retain the tensor or split channels until their bounds and texture are built. */
    computeTensor()
    {
        console.time('computeTensor')

        const volume = this.volumeMap.tensor
        const maxTextureSize = tf.env().getNumber('WEBGL_MAX_TEXTURE_SIZE')
        // Keep every scalar feature in its own texture when the RGBA-sized
        // scalar tensor would exceed TensorFlow.js's 2D texture limit.
        this.tensor = this.unpacked && volume.size * 4 > maxTextureSize ** 2
            ? tf.tidy(() => [0, 1, 2, 3].map(channel => interpolationMap(volume, channel)))
            : this.computeInterpolation(volume)
        this.dimensions = new THREE.Vector3(...this.volumeMap.dimensions)

        console.timeEnd('computeTensor')
    }

    /** Read back binary16 features and create the linearly filtered RGBA16F 3D texture. Three.js uploads the result when the renderer uses it. */
    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 4
        this.texture.needsUpdate = true

        console.timeEnd('computeTexture')
    }

    /** Refresh the feature texture in place. Requires matching dimensions and a live source tensor. */
    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    /**
     * Read the feature tensor synchronously and interleave split channels in RGBA order.
     *
     * @returns {Uint16Array} X-fastest voxels with four consecutive binary16 words per voxel.
     */
    getTextureData()
    {
        if (!Array.isArray(this.tensor)) return readHalfFloatBits(this.tensor, this.toHalfFloat)

        const data = new Uint16Array(this.tensor[0].size * 4)
        this.tensor.forEach((channel, index) =>
        {
            const bits = readHalfFloatBits(channel, this.toHalfFloat)
            for (let i = 0; i < bits.length; i++) data[4 * i + index] = bits[i]
        })
        return data
    }

    /** Release the feature tensor or channel tensors and the map-owned Three.js texture. */
    dispose()
    {
        tf.dispose(this.tensor)
        this.texture?.dispose()
    }
}
