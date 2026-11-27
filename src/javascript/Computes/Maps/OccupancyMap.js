import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import Computes from '../Computes'
import { computeOccupancyMap } from '../Programs/Blocks/GPGPUOccupancyMap'
import { computeOccupancyMap as computeOccupancyMapPacked } from '../Programs/Blocks/GPGPUOccupancyMapPacked'

/** Threshold conservative block ranges into a single binary grid. Distance maps, the renderer, and CPU clipping bounds derive from this occupancy. */
export default class OccupancyMap
{
    /** @param {boolean} [unpacked] - Use the scalar occupancy kernel. */
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.extremaMap = this.computes.extremaMap
        this.unpacked = unpacked
        this.computeOccupancy = unpacked ? computeOccupancyMap : computeOccupancyMapPacked
    }

    /** Mark each [z,y,x] block whose active interpolation interval contains the isovalue. A mark identifies a candidate crossing. */
    computeTensor()
    {
        console.time('computeTensor')

        this.isosurfaceValue = this.configs.isosurfaceValue
        this.interpolationMethod = this.configs.interpolationMethod
        this.tensor = tf.tidy(() =>
        {
            const extrema = this.extremaMap.tensor
            const packed = !this.unpacked
            const [depth, height, width] = extrema.shape
            // Both layouts use the same linear order for the four bounds.
            const bounds = packed === (extrema.rank === 5)
                ? extrema
                : extrema.reshape([depth, height, width, ...(packed ? [2, 2] : [4])])

            return this.computeOccupancy(bounds, this.interpolationMethod, this.isosurfaceValue)
        })
        this.dimensions = this.extremaMap.dimensions

        console.timeEnd('computeTensor')
    }

    /**
     * Create the nearest-filtered R8UI texture and derive inclusive occupied bounds from the same bytes.
     *
     * @param {Uint8Array} [data] - X-fastest binary occupancy. Defaults to synchronous tensor readback.
     */
    computeTexture(data = this.getTextureData())
    {
        console.time('computeTexture')

        this.texture = new THREE.Data3DTexture(data, ...this.dimensions)
        this.texture.format = THREE.RedIntegerFormat
        this.texture.type = THREE.UnsignedByteType
        this.texture.internalFormat = 'R8UI'
        this.texture.minFilter = THREE.NearestFilter
        this.texture.magFilter = THREE.NearestFilter
        this.texture.generateMipmaps = false
        this.texture.unpackAlignment = 1
        this.texture.needsUpdate = true
        this.computeBoundingBox(data)

        console.timeEnd('computeTexture')
    }

    /**
     * Refresh an existing same-sized texture and recompute its bounds from the replacement bytes.
     *
     * @param {Uint8Array} [data] - X-fastest binary occupancy. Defaults to synchronous tensor readback.
     */
    updateTexture(data = this.getTextureData())
    {
        this.texture.image.data.set(data)
        this.texture.needsUpdate = true
        this.computeBoundingBox(data)
    }

    /**
     * Synchronously read the candidate grid for texture upload and CPU bounds.
     *
     * @returns {Uint8Array} One 0/1 byte per block, with X varying fastest.
     */
    getTextureData()
    {
        return new Uint8Array(this.tensor.dataSync())
    }

    /**
     * Store inclusive XYZ block indices for occupied blocks, or null for empty occupancy.
     *
     * @param {Uint8Array} data - Binary occupancy laid out as [z,y,x] with X varying fastest.
     */
    computeBoundingBox(data)
    {
        const { x: width, y: height, z: depth } = this.dimensions
        const minCoords = [width, height, depth]
        const maxCoords = [-1, -1, -1]
        let index = 0

        // Reuse the occupancy readback that already supplies the texture upload.
        for (let z = 0; z < depth; z++)
            for (let y = 0; y < height; y++)
                for (let x = 0; x < width; x++)
                {
                    if (!data[index++]) continue
                    minCoords[0] = Math.min(minCoords[0], x)
                    minCoords[1] = Math.min(minCoords[1], y)
                    minCoords[2] = Math.min(minCoords[2], z)
                    maxCoords[0] = Math.max(maxCoords[0], x)
                    maxCoords[1] = Math.max(maxCoords[1], y)
                    maxCoords[2] = Math.max(maxCoords[2], z)
                }

        this.boundingBox = maxCoords[0] < 0 ? null : { minCoords, maxCoords }
    }

    /** Release the occupancy tensor and texture owned by this map. */
    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
