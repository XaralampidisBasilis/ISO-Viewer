import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { computeExtendedAnisotropicDistanceMap } from '../Programs/GPGPUExtendedAnisotropicDistanceMapPacked'

export default class ExtendedAnisotropicDistanceMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        this.maxDistance = 31
        
        this.dimensions = this.occupancyMap.dimensions
    }

    compute()
    {
        this.tensor?.dispose()
        this.tensor = computeExtendedAnisotropicDistanceMap(this.occupancyMap.tensor, this.maxDistance)
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
