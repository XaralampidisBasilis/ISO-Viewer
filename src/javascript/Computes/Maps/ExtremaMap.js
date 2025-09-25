import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { computeExtremaMap, toHalfFloat } from '../Programs/GPGPUExtremaMapPacked'

export default class ExtremaMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.interpolationMap = this.computes.interpolationMap
        this.interpolationMethod = this.configs.interpolationMethod
        this.isosurfaceValue = this.configs.isosurfaceValue
    }

    compute()
    {
        this.tensor?.dispose()
        this.tensor = computeExtremaMap(this.interpolationMap.tensor, this.interpolationMethod, this.isosurfaceValue)
        this.dimensions = new THREE.Vector3().fromArray(this.tensor.shape.slice(0, 3).toReversed())
    }

    textureSync()
    {
        this.texture?.dispose()
        this.texture = new THREE.Data3DTexture(this.textureDataSync(), ...this.dimensions)
        this.texture.format = THREE.RGFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RG16F'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 2

        return this.texture
    }   

    textureDataSync()
    {
        const tensor = toHalfFloat(this.tensor)
        const dataHalfFloat = tensor.dataSync()
        tensor.dispose()
        
        return new Uint16Array(dataHalfFloat.buffer)
    }

    destroy()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
