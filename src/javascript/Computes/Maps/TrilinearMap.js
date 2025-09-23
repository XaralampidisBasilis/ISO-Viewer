import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Computes from '../Computes'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeNormalizedMap } from '../Programs/GPGPUNormalizeMap'
import { computeResizedMap } from '../Programs/GPGPUResizeMap'

export default class TrilinearMap extends EventEmitter
{
    constructor()
    {
        super()

        this.computes = new Computes()
        this.configs = this.computes.configs
        this.resources = this.computes.resources
        this.volume = this.resources.items.intensityMap

        this.dimensions = new THREE.Vector3().fromArray(this.volume.dimensions)
        this.spacing = new THREE.Vector3().fromArray(this.volume.spacing)
    }

    setTensor()
    {
        const data = new Float32Array(this.source.data)
        const shape = this.volume.dimensions.toReversed()
        const newShape = shape.map((x) => Math.ceil(x * this.configs.downscaleFactor))
        this.dimensions = new THREE.Vector3().fromArray(newShape.toReversed())

        this.tensor = tf.tidy(() =>
        {
            let tensor = tf.tensor3d(data, shape)
            tensor = computeResizedMap(tensor, newShape, false, true)  
            tensor = computeNormalizedMap(tensor)  
            return tensor
        })
    }

    setTexture()
    {
        const data = this.getData()

        this.texture = new THREE.Data3DTexture(data, ...this.dimensions)
        this.texture.format = THREE.RedFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'R16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1
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
