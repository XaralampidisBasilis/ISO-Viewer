import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import { resizeTrilinear } from '../Programs/GPGPUResizeTrilinear'
import { normalize } from '../Programs/GPGPUNormalizePacked'

export default class VolumeMap
{
    setVolume(volume)
    {
        this.dimensions = new THREE.Vector3().fromArray(volume.dimensions)
        this.spacing = new THREE.Vector3().fromArray(volume.spacing)
        this.size = new THREE.Vector3().fromArray(volume.size)
    }

    computeTensor(volume, downscaleFactor, range)
    {
        console.time('computeTensor') 
        
        this.setVolume(volume)

        const shape = [...volume.dimensions].reverse()
        const newShape = shape.map((x) => Math.ceil(downscaleFactor * x))
        const newSpacing = [...volume.spacing].reverse().map((x, i) => shape[i] / newShape[i] * x)
        
        this.dimensions.fromArray([...newShape].reverse())
        this.spacing.fromArray(newSpacing.reverse())
        this.tensor = tf.tidy(() =>
        {    
            const data = new Float32Array(volume.data)
            let tensor = tf.tensor3d(data, shape)
            tensor = resizeTrilinear(tensor, newShape, false, true)
            tensor = normalize(tensor, range)

            return tensor
        })  
        console.timeEnd('computeTensor') 
    }

    computeTexture()
    {
        console.time('computeTexture') 
        this.texture = new THREE.Data3DTexture(this.getTextureData, ...this.dimensions)
        this.texture.format = THREE.RedFormat
        this.texture.type = THREE.FloatType
        this.texture.internalFormat = 'R32F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.needsUpdate = true
        this.texture.unpackAlignment = 1
        console.timeEnd('computeTexture') 
    }

    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    getTextureData()
    {
        return new Float32Array(this.tensor.dataSync())
    }

    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
