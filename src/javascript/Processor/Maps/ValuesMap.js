import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Processor from '../Processor'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { resize } from '../Programs/GPGPUTrilinearResize'
import { normalize } from '../Programs/GPGPUNormalize'

export default class ValuesMap extends EventEmitter
{
    constructor()
    {
        super()

        this.processor = new Processor()
        this.config = this.processor.config
        this.source = this.processor.resources.items.volumeMap
        this.downscaleFactor = this.config.settings.downscaleFactor
    }

    setParams()
    {
        this.dimensions = new THREE.Vector3().fromArray(this.source.dimensions)
        this.spacing    = new THREE.Vector3().fromArray(this.source.spacing)
        this.size       = new THREE.Vector3().fromArray(this.source.size)
        this.numVoxels  = this.source.dimensions.reduce((voxels, dims) => voxels * dims, 1)
        this.maxVoxels  = this.source.dimensions.reduce((voxels, dims) => voxels + dims, -2)
    }

    setTensor()
    {
        const data = new Float32Array(this.source.data)
        const shape = this.source.dimensions.toReversed().concat(1)
        const newShape = shape.map((x) => Math.ceil(this.downscaleFactor * x))

        this.tensor = tf.tidy(() =>
        {
            let tensor = tf.tensor4d(data, shape) 
            tensor = resize(tensor, newShape, false, true)  
            tensor = normalize(tensor)  
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
