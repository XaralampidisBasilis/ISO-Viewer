import * as THREE from 'three'
import Computes from '../Computes'
import { computeOccupancyMap } from '../Programs/Blocks/GPGPUOccupancyMap'
import { computeOccupancyMap as computeOccupancyMapPacked } from '../Programs/Blocks/GPGPUOccupancyMapPacked'

export default class OccupancyMap
{
    constructor(unpacked)
    {
        this.computes = new Computes()
        this.configs = this.computes.configs
        this.extremaMap = this.computes.extremaMap
        this.computeOccupancy = unpacked ? computeOccupancyMap : computeOccupancyMapPacked
    }

    computeTensor()
    {
        console.time('computeTensor')

        this.isosurfaceValue = this.configs.isosurfaceValue
        this.interpolationMethod = this.configs.interpolationMethod
        this.tensor = this.computeOccupancy(this.extremaMap.tensor, this.interpolationMethod, this.isosurfaceValue)
        this.dimensions = this.extremaMap.dimensions

        console.timeEnd('computeTensor')
    }

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

    updateTexture(data = this.getTextureData())
    {
        this.texture.image.data.set(data)
        this.texture.needsUpdate = true
        this.computeBoundingBox(data)
    }

    getTextureData()
    {
        return new Uint8Array(this.tensor.dataSync())
    }

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

    dispose()
    {
        this.tensor?.dispose()
        this.texture?.dispose()
    }
}
