import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeExtremaMap } from '../Programs/GPGPUExtremaMap'

export default class OccupancyMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.trilinearMap = this.computes.trilinearMap
        this.tricubicMap = this.computes.tricubicMap
    }

    setTensor()
    {
        this.tensor = computeOccupancyMap(this.extremaMap.tensor, this.configs.isosurfaceValue)
    }

    setTexture()
    {
        const data = Uint8Array(this.tensor.dataSync())

        this.texture = new THREE.Data3DTexture(data, ...this.dimensions)
        this.texture.format = THREE.RedIntegerFormat
        this.texture.type = THREE.UnsignedByteType
        this.texture.internalFormat = 'R8UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1
    }   
}
