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
        this.spacing = this.extremaMap.spacing
    }

    setTensor()
    {
        this.tensor = computeOccupancyMap(this.extremaMap.tensor, this.isosurfaceValue)
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
