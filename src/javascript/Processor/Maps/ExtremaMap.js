import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Processor from '../Processor'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeTrilinearExtremaMap } from '../Programs/GPGPUTrilinearExtremaMap'
import { computeTricubicExtremaMap } from '../Programs/GPGPUTricubicExtremaMap'

export default class ExtremaMap extends EventEmitter
{
    constructor()
    {
        super()

        this.processor = new Processor()
        this.settings = this.processor.config.settings

        this.interpolationMethod = this.settings.interpolationMethod
        this.blockSize = this.settings.blockSize

        this.setTensor()
    }

    setTensor()
    {
        if (this.interpolationMethod === 'trilinear')
        {
            this.tensor = computeTrilinearExtremaMap(this.processor.volumeMap.tensor, this.blockSize)
        }
        if (this.interpolationMethod === 'tricubic')
        {
            this.tensor = computeTricubicExtremaMap(this.processor.volumeMap.tensor, this.blockSize)
        }
    }

    setParametersFromTensor()
    {
        this.dimensions = new THREE.Vector3().fromArray(this.tensor.shape.slice(0, 3).toReversed())
        this.spacing    = new THREE.Vector3().copy(this.intensityMap.spacing).multiplyScalar(this.extremaMap.stride)
        this.size       = new THREE.Vector3().copy(this.extremaMap.dimensions).multiply(this.extremaMap.spacing)
    }

    getDataFromTensor()
    {
        const dataFloat16 = new Uint16Array(this.tensor.size)
        const dataFloat32 = this.tensor.dataSync()

        for (let i = 0; i < dataFloat16.length; ++i) 
        {
            dataFloat16[i] = toHalfFloat(dataFloat32[i])
        }

        return dataFloat16
    }

    setTexture()
    {
        const data = this.getDataFromTensor()

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
}
