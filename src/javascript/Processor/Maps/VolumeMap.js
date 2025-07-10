import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../Utils/EventEmitter'
import Experience from '../../Experience'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'

export default class VolumeMap extends EventEmitter
{
    constructor()
    {
        super()

        this.experience = new Experience()
        this.config = this.experience.config
        this.source = this.experience.resources.items.volumeMap
    }

    setParameters()
    {
        this.dimensions = new THREE.Vector3().fromArray(this.source.dimensions)
        this.spacing    = new THREE.Vector3().fromArray(this.source.spacing)
        this.size       = new THREE.Vector3().fromArray(this.source.size)
        this.numVoxels  = this.source.dimensions.reduce((voxels, dims) => voxels * dims, 1)
        this.maxVoxels  = this.source.dimensions.reduce((voxels, dims) => voxels + dims, -2)
    }

    setTensor()
    {
        const shape = this.source.dimensions.toReversed().concat(1)

        this.tensor = tf.tensor4d
        (
            new Float32Array(this.source.data), 
            shape
        ) 
    }

    setData()
    {
        this.data = new Uint16Array(this.tensor.size)
        const data = this.tensor.dataSync()

        for (let i = 0; i < this.data.length; ++i) 
        {
            this.data[i] = toHalfFloat(data[i])
        }
    }

    setTexture()
    {
        this.texture = new THREE.Data3DTexture
        (
            this.data, 
            ...this.dimensions
        )

        this.texture.format = THREE.RedFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'R16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1
    }
}
