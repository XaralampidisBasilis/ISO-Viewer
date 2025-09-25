import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { resizeMap } from '../Programs/GPGPUResizeMap'
import { normalizeMap } from '../Programs/GPGPUNormalizeMapPacked'
import { computeInterpolationMap, toHalfFloat } from '../Programs/GPGPUInterpolationMapPacked'

export default class InterpolationMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.resources = this.computes.resources
        this.volume = this.resources.items.intensityMap
        this.downscaleFactor = this.configs.downscaleFactor

        this.dimensions = new THREE.Vector3().fromArray(this.volume.dimensions)
        this.spacing = new THREE.Vector3().fromArray(this.volume.spacing)
    }

    compute()
    {
        const downscale = (x) => Math.ceil(x * this.downscaleFactor)
        const shape = this.dimensions.toArray()
        const newShape = this.dimensions.toArray().map(downscale)
        const newDimensions = new THREE.Vector3().fromArray(newShape.toReversed())
        this.dimensions = newDimensions

        const data = new Float32Array(this.volume.data)
        const volume = tf.tensor3d(data, shape)

        const resizedVolume = resizeMap(volume, newShape, false, true)
        volume.dispose()

        const normalizedVolume = normalizeMap(resizedVolume)
        resizedVolume.dispose()

        this.tensor?.dispose()
        this.tensor = computeInterpolationMap(normalizedVolume) 
        normalizedVolume.dispose() 
    }

    textureSync()
    {
        this.texture?.dispose()
        this.texture = new THREE.Data3DTexture(this.textureDataSync(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 4

        return this.texture
    }

    textureDataSync()
    {
        const tensor = toHalfFloat(this.tensor)
        const dataHalfFloat = tensor.dataSync()
        tensor.dispose()
        
        return new Uint16Array(dataHalfFloat.buffer)
    }

    destroy()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
