import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeExtendedIsotropicDistanceMap } from '../Programs/DistanceMaps/Isotropic/GPGPUExtendedIsotropicDistanceMap'
import { computeExtendedIsotropicDistanceMap as computeExtendedIsotropicDistanceMapPacked } from '../Programs/DistanceMaps/Isotropic/GPGPUExtendedIsotropicDistanceMapPacked'

export default class ExtendedIsotropicDistanceMap
{
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.occupancyMap = this.computes.occupancyMap
        this.computeDistance = unpacked ? computeExtendedIsotropicDistanceMap : computeExtendedIsotropicDistanceMapPacked
        this.maxDistance = 31
    }

    computeTensor()
    {
        console.time('computeTensor')

        this.tensor = tf.tidy(() => this.computeDistance(this.occupancyMap.tensor, this.maxDistance))
        this.dimensions = new THREE.Vector3(...this.occupancyMap.dimensions)

        console.timeEnd('computeTensor')
    }

    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGIntegerFormat
        this.texture.type = THREE.UnsignedShortType
        this.texture.internalFormat = 'RG16UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 2
        this.texture.needsUpdate = true

        console.timeEnd('computeTexture')
    }

    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    getTextureData()
    {
        return new Uint16Array(this.tensor.dataSync())
    }

    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
