import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Processor from '../Processor'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeTricubicFeatures } from '../Programs/GPGPUTricubicFeatures'

export default class FeaturesMap extends EventEmitter
{
    constructor()
    {
        super()

        this.processor = new Processor()
        this.config = this.processor.config
        this.valuesMap = this.processor.valuesMap
    }

    setTensor()
    {
        this.tensor = computeTricubicFeatures(this.valuesMap.tensor)
    }

    setParams()
    {
        this.dimensions = this.valuesMap.dimensions
        this.spacing = this.valuesMap.spacing   
        this.size = this.valuesMap.size      
        this.numVoxels = this.valuesMap.numVoxels 
        this.maxVoxels = this.valuesMap.maxVoxels 
    }

    setTexture()
    {
        const data = this.getData()

        this.texture = new THREE.Data3DTexture(data, ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 4
    }

    getData()
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
