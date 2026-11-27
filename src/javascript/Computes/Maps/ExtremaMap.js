import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeExtremaMap } from '../Programs/Blocks/GPGPUExtremaMapFusedPacked'
import { toHalfFloat } from '../Programs/Encoding/GPGPUToHalfFloatPacked'
import readHalfFloatBits from '../Programs/Encoding/readHalfFloatBits'

export default class ExtremaMap
{
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.interpolationMap = this.computes.interpolationMap
        this.packed = !unpacked
    }

    computeTensor()
    {
        console.time('computeTensor')

        this.blockSize = this.configs.blockSize
        this.tensor = computeExtremaMap(this.interpolationMap.tensor, this.blockSize, this.packed)

        const shape = this.tensor.shape
        this.dimensions = new THREE.Vector3(...shape.slice(0,3).toReversed())

        console.timeEnd('computeTensor')
    }

    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
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
        return readHalfFloatBits(this.tensor, toHalfFloat)
    }

    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
