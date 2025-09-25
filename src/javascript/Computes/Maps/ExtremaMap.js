import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeExtremaMap } from '../Programs/GPGPUExtremaMapPacked'

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

    setTensor()
    {
        this.tensor = computeExtremaMap(this.interpolationMap.tensor, this.interpolationMethod, this.isosurfaceValue)
    }

    setTexture()
    {
        this.texture = new THREE.Data3DTexture(this.getData16F(), ...this.dimensions)
        this.texture.format = THREE.RGFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RG16F'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 2
    }   

    getData16F()
    {
        const dataFloat = this.tensor.dataSync()
        const dataHalfFloat = new Uint16Array(this.tensor.size)

        for (let i = 0; i < dataFloat.length; ++i) 
        {
            dataHalfFloat[i] = toHalfFloat(dataFloat[i])
        }

        return dataHalfFloat
    }
}
