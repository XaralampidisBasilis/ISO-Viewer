import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Processor from '../Processor'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeOccupancyMap } from '../Programs/GPGPUOccupancy'

export default class OccupancyMap extends EventEmitter
{
    constructor()
    {
        super()

        this.processor = new Processor()
        this.settings = this.processor.config.settings
        this.inputMap = this.processor.extremaMap

        this.isosurfaceValue = this.settings.isosurfaceValue

        this.setTensor()
    }

    setTensor()
    {
        this.tensor = computeOccupancyMap(this.inputMap.tensor, this.isosurfaceValue)
    }

    setParametersFromTensor()
    {
        this.dimensions = new THREE.Vector3().fromArray(this.tensor.shape.slice(0, 3).toReversed())
        this.spacing    = new THREE.Vector3().copy(this.intensityMap.spacing).multiplyScalar(this.extremaMap.stride)
        this.size       = new THREE.Vector3().copy(this.extremaMap.dimensions).multiply(this.extremaMap.spacing)
    }

    setTexture()
    {
        const data = this.getData()

        this.texture = new THREE.Data3DTexture(data, ...this.dimensions)
        this.texture.format = THREE.RGFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'R16F'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 2
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
