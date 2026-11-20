import * as THREE from 'three'
import Computes from '../Computes'
import { computeInterpolationMap } from '../Programs/GPGPUInterpolationMapPacked'
import { toHalfFloat } from '../Programs/GPGPUToHalfFloatPacked'

export default class InterpolationMap
{
    constructor()
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.volumeMap = this.computes.volumeMap
    }

    computeTensor()
    {
        console.time('computeTensor') 
        this.tensor = computeInterpolationMap(this.volumeMap.tensor)
        this.dimensions = new THREE.Vector3(...this.volumeMap.dimensions)
        console.timeEnd('computeTensor') 
    }

    computeTexture()
    {
        console.time('computeTexture') 
        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.LinearFilter
        this.texture.magFilter = THREE.LinearFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 4
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
        // Native conversion avoids a second full-sized TensorFlow.js texture.
        if (typeof Float16Array === 'function')
        {
            const half = new Float16Array(this.tensor.dataSync())
            return new Uint16Array(half.buffer, half.byteOffset, half.length)
        }

        const tensor = toHalfFloat(this.tensor)
        const dataFloat = tensor.dataSync()
        const dataHalfFloat = new Uint16Array(dataFloat)
        tensor.dispose()

        return dataHalfFloat
    }

    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
