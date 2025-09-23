import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeTricubicMap } from '../Programs/GPGPUTricubicMap'

export default class TricubicMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.trilinearMap = this.computed.trilinearMap

        this.dimensions = new THREE.Vector3().copy(this.trilinearMap.dimensions)
        this.spacing = new THREE.Vector3().copy(this.trilinearMap.spacing)
    }

    setTensor()
    {
       this.tensor = computeTricubicMap(this.trilinearMap.tensor)
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
