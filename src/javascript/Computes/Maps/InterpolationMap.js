import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeNormalizedMap } from '../Programs/GPGPUNormalizeMap'
import { computeResizedMap } from '../Programs/GPGPUResizeMap'
import { computeInterpolationMap } from '../Programs/GPGPUInterpolationMap'

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

    setTensor()
    {
        const downscale = (x) => Math.ceil(x * this.downscaleFactor)
        const shape = this.dimensions.toArray()
        const newShape = this.dimensions.toArray().map(downscale)
        const newDimensions = new THREE.Vector3().fromArray(newShape.toReversed())
        this.dimensions = newDimensions

        const data = new Float32Array(this.volume.data)
        let volume = tf.tensor3d(data, shape)
        let resized = computeResizedMap(volume, newShape, false, true); volume.dispose()
        let normalized = computeNormalizedMap(resized); resized.dispose()
        this.tensor = computeInterpolationMap(normalized); normalized.dispose() 
    }

    setTexture()
    {
        this.texture = new THREE.Data3DTexture(this.getData16F(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 4
    }

    getData16F()
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
