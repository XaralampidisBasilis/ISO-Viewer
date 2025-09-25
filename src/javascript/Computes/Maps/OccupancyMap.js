import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { computeOccupancyMap } from '../Programs/GPGPUOccupancyMapPacked'

export default class OccupancyMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.extremaMap = this.computes.extremaMap
        this.isosurfaceValue = this.configs.isosurfaceValue
        
        this.dimensions = this.extremaMap.dimensions
    }

    compute()
    {
        this.tensor?.dispose()
        this.tensor = computeOccupancyMap(this.extremaMap.tensor, this.isosurfaceValue)
    }

    textureSync()
    {
        this.texture?.dispose()
        this.texture = new THREE.Data3DTexture(this.textureDataSync(), ...this.dimensions)
        this.texture.format = THREE.RedIntegerFormat
        this.texture.type = THREE.UnsignedByteType
        this.texture.internalFormat = 'R8UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1

        return this.texture
    }   

    textureDataSync()
    {
        return new Uint8Array(this.tensor.dataSync())
    }

    destroy()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
