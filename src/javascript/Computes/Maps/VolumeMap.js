import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import { resizeTrilinear } from '../Programs/Volume/GPGPUResizeTrilinear'
import { normalize } from '../Programs/Volume/GPGPUNormalize'
import { normalize as normalizePacked } from '../Programs/Volume/GPGPUNormalizePacked'

/** Prepare the scalar tensor consumed by InterpolationMap. Geometry uses XYZ vectors in storage axes, while TensorFlow.js indexes the same x-fastest voxel buffer as [z,y,x]. */
export default class VolumeMap
{
    /** @param {boolean} [unpacked] - Use the scalar normalization kernel. Both modes share the resize kernel. */
    constructor(unpacked)
    {
        this.normalize = unpacked ? normalize : normalizePacked
    }

    /**
     * Capture the source grid geometry.
     *
     * @param {object} volume - Parsed scan with XYZ dimensions, spacing in meters per voxel, and physical size in meters.
     */
    setVolume(volume)
    {
        this.dimensions = new THREE.Vector3().fromArray(volume.dimensions)
        this.spacing = new THREE.Vector3().fromArray(volume.spacing)
        this.size = new THREE.Vector3().fromArray(volume.size)
    }

    /**
     * Resample and normalize the scan, retaining the scalar tensor until the interpolation features have been built.
     *
     * @param {object} volume - Parsed scan geometry and stored scalar samples.
     * @param {number} downscaleFactor - Positive linear scale. Output dimensions round up independently.
     * @param {number[]} [range] - Stored intensity [min,max] for normalization. When omitted, use the resampled extrema.
     */
    computeTensor(volume, downscaleFactor, range)
    {
        console.time('computeTensor')

        this.setVolume(volume)

        const shape = [...volume.dimensions].reverse()
        const newShape = shape.map((x) => Math.ceil(downscaleFactor * x))
        // Scale spacing by N / N′ to preserve the physical extent on each axis.
        const newSpacing = [...volume.spacing].reverse().map((x, i) => shape[i] / newShape[i] * x)

        this.dimensions.fromArray([...newShape].reverse())
        this.spacing.fromArray(newSpacing.reverse())
        this.tensor = tf.tidy(() =>
        {
            const data = new Float32Array(volume.data)
            let tensor = tf.tensor3d(data, shape)
            tensor = resizeTrilinear(tensor, newShape, false, true)
            tensor = this.normalize(tensor, range)

            return tensor
        })

        console.timeEnd('computeTensor')
    }

    /** Legacy R32F texture setup outside the active renderer path. The constructor currently receives the readback function itself as its data argument. */
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

    /** Refresh an existing same-sized scalar texture from this tensor and queue a renderer upload. */
    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    /**
     * Synchronously read the normalized scalar field.
     *
     * @returns {Float32Array} X-fastest samples in tensor storage order.
     */
    getTextureData()
    {
        return new Float32Array(this.tensor.dataSync())
    }

    /** Release map-owned tensor and texture resources if present. */
    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
