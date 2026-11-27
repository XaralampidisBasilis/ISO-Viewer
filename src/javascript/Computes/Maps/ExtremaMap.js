import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeExtremaMap } from '../Programs/Blocks/GPGPUExtremaMapFusedPacked'
import { toHalfFloat } from '../Programs/Encoding/GPGPUToHalfFloatPacked'
import readHalfFloatBits from '../Programs/Encoding/readHalfFloatBits'

/** Retain the trilinear and tricubic bounds for each block so later isovalue changes can rebuild occupancy from existing ranges. */
export default class ExtremaMap
{
    /** @param {boolean} [unpacked] - Request scalar output from the fused extrema program. */
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.interpolationMap = this.computes.interpolationMap
        this.packed = !unpacked
    }

    /** Compute both bound pairs from the interpolation features. Tensor dimensions start with ZYX block counts, which become an XYZ texture-size vector. */
    computeTensor()
    {
        console.time('computeTensor')

        this.blockSize = this.configs.blockSize
        this.tensor = computeExtremaMap(this.interpolationMap.tensor, this.blockSize, this.packed)

        const shape = this.tensor.shape
        this.dimensions = new THREE.Vector3(...shape.slice(0,3).toReversed())

        console.timeEnd('computeTensor')
    }

    /** Create an optional nearest-filtered RGBA16F texture of the ranges. The active occupancy path reads the tensor directly. */
    computeTexture()
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(this.getTextureData(), ...this.dimensions)
        this.texture.format = THREE.RGBAFormat
        this.texture.type = THREE.HalfFloatType
        this.texture.internalFormat = 'RGBA16F'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 4
        this.texture.needsUpdate = true

        console.timeEnd('computeTexture')
    }

    /** Refresh an existing bounds texture when the block grid is unchanged, then queue an upload. */
    updateTexture()
    {
        this.texture.image.data.set(this.getTextureData())
        this.texture.needsUpdate = true
    }

    /**
     * Read the bounds into binary16 words for the optional texture path.
     *
     * @returns {Uint16Array} Per block, [trilinear min, trilinear max, tricubic min, tricubic max].
     */
    getTextureData()
    {
        return readHalfFloatBits(this.tensor, toHalfFloat)
    }

    /** Release the retained bounds tensor and any optional texture owned by this map. */
    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
