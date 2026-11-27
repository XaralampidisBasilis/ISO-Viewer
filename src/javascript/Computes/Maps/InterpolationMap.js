import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { interpolationMap } from '../Programs/Interpolation/GPGPUInterpolationMap'
import { computeInterpolationMap } from '../Programs/Interpolation/GPGPUInterpolationMapPacked'
import { toHalfFloat } from '../Programs/Encoding/GPGPUToHalfFloat'
import { toHalfFloat as toHalfFloatPacked } from '../Programs/Encoding/GPGPUToHalfFloatPacked'
import readHalfFloatBits from '../Programs/Encoding/readHalfFloatBits'

export default class InterpolationMap
{
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.volumeMap = this.computes.volumeMap
        this.unpacked = unpacked
        this.computeInterpolation = unpacked ? interpolationMap : computeInterpolationMap
        this.toHalfFloat = unpacked ? toHalfFloat : toHalfFloatPacked
    }

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

    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

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

    dispose()
    {
        tf.dispose(this.tensor)
        this.texture?.dispose()
    }
}
