import * as THREE from 'three'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'
import { toHalfFloat } from 'three/src/extras/DataUtils.js'

export default class Textures extends EventEmitter
{
    constructor()
    {
        super()

        // Setup
        this.viewer = new ISOViewer()
        this.resources = this.viewer.resources
        this.computes = this.viewer.computes

        // Wait for computes
        this.computes.on('ready', () =>
        {
            this.setTextures()
            this.trigger('ready')
        })
    }

    async setTextures()
    {
        this.textureColorMaps()
        this.textureIntensityMap()
        // this.textureLaplaciansIntensityMap()
        
        // this.textureOccupancyMap()
        this.textureDistanceMap()
        this.textureAnisotropicDistanceMap()
        this.textureExtendedAnisotropicDistanceMap()
    }

    async onThresholdChange()
    {
        // if (this.distanceMap)
        // {
        //     this.distanceMap.image.data.set(this.computes.distanceMap.array)
        //     this.distanceMap.needsUpdate = true
        // }

        // if (this.anisotropicDistanceMap)
        // {
        //     this.anisotropicDistanceMap.image.data.set(this.computes.anisotropicDistanceMap.array)
        //     this.anisotropicDistanceMap.needsUpdate = true
        // }

        if (this.extendedAnisotropicDistanceMap)
        {
            this.extendedAnisotropicDistanceMap.image.data.set(this.computes.extendedAnisotropicDistanceMap.array)
            this.extendedAnisotropicDistanceMap.needsUpdate = true
        }
    }

    textureColorMaps()
    {
        if (this.resources.items.colorMaps)
        {
            console.time('textureColorMaps') 
            this.colorMaps = this.resources.items.colorMaps
            this.colorMaps.colorSpace = THREE.SRGBColorSpace
            this.colorMaps.minFilter = THREE.LinearFilter
            this.colorMaps.magFilter = THREE.LinearFilter
            this.colorMaps.generateMipmaps = false
            this.colorMaps.needsUpdate = true
            console.timeEnd('textureColorMaps')
        }
    }

    textureIntensityMap() 
    {
        if (this.computes.intensityMap) 
        {
            console.time('textureIntensityMap')

            this.intensityMap = this.createTexture(
                this.computes.intensityMap.array,
                this.computes.intensityMap.dimensions,
                THREE.RedFormat,
                THREE.HalfFloatType,
                THREE.LinearFilter,
                THREE.LinearFilter
            )

            console.timeEnd('textureIntensityMap')
        }
    }

    textureLaplaciansIntensityMap() 
    {
        if (this.computes.laplaciansIntensityMap) 
        {
            console.time('textureLaplaciansIntensityMap')

            this.laplaciansIntensityMap = this.createTexture(
                this.computes.laplaciansIntensityMap.array,
                this.computes.laplaciansIntensityMap.dimensions,
                THREE.RGBAFormat,
                THREE.HalfFloatType,
                THREE.LinearFilter,
                THREE.LinearFilter
            )

            console.timeEnd('textureLaplaciansIntensityMap')
        }
    }

    textureExtremaMap() 
    {
        if (this.computes.extremaMap) 
        {
            console.time('textureExtremaMap')

            this.extremaMap = this.createTexture(
                this.computes.extremaMap.array,
                this.computes.extremaMap.dimensions,
                THREE.RedIntegerFormat,
                THREE.UnsignedByteType,
                THREE.NearestFilter,
                THREE.NearestFilter
            )

            console.timeEnd('textureExtremaMap')
        }
    }
    
    textureOccupancyMap() 
    {
        if (this.computes.occupancyMap) 
        {
            console.time('textureOccupancyMap')

            this.occupancyMap = this.createTexture(
                this.computes.occupancyMap.array,
                this.computes.occupancyMap.dimensions,
                THREE.RedIntegerFormat,
                THREE.UnsignedByteType,
                THREE.NearestFilter,
                THREE.NearestFilter
            )

            console.timeEnd('textureOccupancyMap')
        }
    }

    textureDistanceMap() 
    {
        if (this.computes.distanceMap) 
        {
            console.time('textureDistanceMap')

            this.distanceMap = this.createTexture(
                this.computes.distanceMap.array,
                this.computes.distanceMap.dimensions,
                THREE.RedIntegerFormat,
                THREE.UnsignedByteType,
                THREE.NearestFilter,
                THREE.NearestFilter
            )

            console.timeEnd('textureDistanceMap')
        }
    }

    textureAnisotropicDistanceMap() 
    {
        if (this.computes.anisotropicDistanceMap) 
        {
            console.time('textureAnisotropicDistanceMap')

            this.anisotropicDistanceMap = this.createTexture(
                this.computes.anisotropicDistanceMap.array,
                this.computes.anisotropicDistanceMap.dimensions,
                THREE.RedIntegerFormat,
                THREE.UnsignedByteType,
                THREE.NearestFilter,
                THREE.NearestFilter
            )

            console.timeEnd('textureAnisotropicDistanceMap')
        }
    }

    textureExtendedAnisotropicDistanceMap() 
    {
        if (this.computes.extendedAnisotropicDistanceMap) 
        {
            console.time('textureExtendedAnisotropicDistanceMap')

            this.extendedAnisotropicDistanceMap = this.createTexture(
                this.computes.extendedAnisotropicDistanceMap.array,
                this.computes.extendedAnisotropicDistanceMap.dimensions,
                THREE.RedIntegerFormat,
                THREE.UnsignedShortType,
                THREE.NearestFilter,
                THREE.NearestFilter
            )

            console.timeEnd('textureExtendedAnisotropicDistanceMap')
        }
    }

    destroy() 
    {
        if (this.colorMaps)
        {
            this.colorMaps.dispose()
            this.colorMaps = null
        }

        if (this.intensityMap)
        {
            this.intensityMap.dispose()
            this.intensityMap = null
        }

        if (this.laplaciansIntensityMap)
        {
            this.laplaciansIntensityMap.dispose()
            this.laplaciansIntensityMap = null
        }

        if (this.occupancyMap)
        {
            this.occupancyMap.dispose()
            this.occupancyMap = null
        }

        if (this.distanceMap)
        {
            this.distanceMap.dispose()
            this.distanceMap = null
        }

        if (this.anisotropicDistanceMap)
        {
            this.anisotropicDistanceMap.dispose()
            this.anisotropicDistanceMap = null
        }

        if (this.extendedAnisotropicDistanceMap)
        {
            this.extendedAnisotropicDistanceMap.dispose()
            this.extendedAnisotropicDistanceMap = null
        }

        this.viewer = null
        this.resources = null
        this.computes = null

        console.log('ISOTextures destroyed.')
    }

    createTexture(data, dimensions, format, type, minFilter, magFilter) 
    {
        const texture = new THREE.Data3DTexture(data, ...dimensions)
        texture.format = format
        texture.type = type
        texture.minFilter = minFilter
        texture.magFilter = magFilter
        texture.generateMipmaps = false
        texture.needsUpdate = true

        return texture
    }

}