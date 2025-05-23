import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'

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
        this.textureLaplaciansIntensityMap()
        
        this.textureOccupancyMap()
        this.textureDistanceMap()
        this.textureAnisotropicDistanceMap()
        this.textureExtendedAnisotropicDistanceMap()
    }

    async onThresholdChange()
    {
        this.occupancyMap.dispose()
        this.textureOccupancyMap()

        this.distanceMap.dispose()
        this.textureDistanceMap()

        this.anisotropicDistanceMap.dispose()
        this.textureAnisotropicDistanceMap()

        this.extendedAnisotropicDistanceMap.dispose()
        this.textureExtendedAnisotropicDistanceMap()
    }

    textureColorMaps()
    {
        if (this.resources.items.colorMaps)
        {
            this.colorMaps = this.resources.items.colorMaps
            this.colorMaps.colorSpace = THREE.SRGBColorSpace
            this.colorMaps.minFilter = THREE.LinearFilter
            this.colorMaps.magFilter = THREE.LinearFilter
            this.colorMaps.generateMipmaps = false
            this.colorMaps.needsUpdate = true
        }
    }

    textureIntensityMap()
    {
        if (this.computes.intensityMap)
        {
            const array = this.computes.intensityMap.array
            const dimension = this.computes.intensityMap.dimensions
            this.intensityMap = new THREE.Data3DTexture(array, ...dimension)
            this.intensityMap.format = THREE.RedFormat
            this.intensityMap.type = THREE.HalfFloatType
            this.intensityMap.minFilter = THREE.LinearFilter
            this.intensityMap.magFilter = THREE.LinearFilter
            this.intensityMap.generateMipmaps = false
            this.intensityMap.needsUpdate = true
        }
    }

    textureLaplaciansIntensityMap()
    {
        if (this.computes.laplaciansIntensityMap)
        {
            const array = this.computes.laplaciansIntensityMap.array
            const dimension = this.computes.laplaciansIntensityMap.dimensions
            this.laplaciansIntensityMap = new THREE.Data3DTexture(array, ...dimension)
            this.laplaciansIntensityMap.format = THREE.RGBAFormat
            this.laplaciansIntensityMap.type = THREE.HalfFloatType
            this.laplaciansIntensityMap.minFilter = THREE.LinearFilter
            this.laplaciansIntensityMap.magFilter = THREE.LinearFilter
            this.laplaciansIntensityMap.generateMipmaps = false
            this.laplaciansIntensityMap.needsUpdate = true
        }
    }

    textureOccupancyMap()
    {
        if (this.computes.occupancyMap)
        {
            const array = this.computes.occupancyMap.array
            const dimension = this.computes.occupancyMap.dimensions
            this.occupancyMap = new THREE.Data3DTexture(array, ...dimension)
            this.occupancyMap.format = THREE.RedIntegerFormat
            this.occupancyMap.type = THREE.UnsignedByteType
            this.occupancyMap.minFilter = THREE.NearestFilter
            this.occupancyMap.magFilter = THREE.NearestFilter
            this.occupancyMap.generateMipmaps = false
            this.occupancyMap.needsUpdate = true
        }
    }

    textureDistanceMap()
    {
        if (this.computes.distanceMap)
        {
            const array = this.computes.distanceMap.array
            const dimension = this.computes.distanceMap.dimensions
            this.distanceMap = new THREE.Data3DTexture(array, ...dimension)
            this.distanceMap.format = THREE.RedIntegerFormat
            this.distanceMap.type = THREE.UnsignedByteType
            this.distanceMap.minFilter = THREE.NearestFilter
            this.distanceMap.magFilter = THREE.NearestFilter
            this.distanceMap.generateMipmaps = false
            this.distanceMap.needsUpdate = true
        }
    }

    textureAnisotropicDistanceMap()
    {
        if (this.computes.anisotropicDistanceMap)
        {
            const array = this.computes.anisotropicDistanceMap.array
            const dimension = this.computes.anisotropicDistanceMap.dimensions
            this.anisotropicDistanceMap = new THREE.Data3DTexture(array, ...dimension)
            this.anisotropicDistanceMap.format = THREE.RedIntegerFormat
            this.anisotropicDistanceMap.type = THREE.UnsignedByteType
            this.anisotropicDistanceMap.minFilter = THREE.NearestFilter
            this.anisotropicDistanceMap.magFilter = THREE.NearestFilter
            this.anisotropicDistanceMap.generateMipmaps = false
            this.anisotropicDistanceMap.needsUpdate = true
        }
    }

    textureExtendedAnisotropicDistanceMap()
    {
        if (this.computes.extendedAnisotropicDistanceMap)
        {
            const array = this.computes.extendedAnisotropicDistanceMap.array
            const dimension = this.computes.extendedAnisotropicDistanceMap.dimensions
            this.extendedAnisotropicDistanceMap = new THREE.Data3DTexture(array, ...dimension)
            this.extendedAnisotropicDistanceMap.format = THREE.RedIntegerFormat
            this.extendedAnisotropicDistanceMap.type = THREE.UnsignedShortType
            this.extendedAnisotropicDistanceMap.minFilter = THREE.NearestFilter
            this.extendedAnisotropicDistanceMap.magFilter = THREE.NearestFilter
            this.extendedAnisotropicDistanceMap.generateMipmaps = false
            this.extendedAnisotropicDistanceMap.needsUpdate = true
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

}