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
        this.setColorMaps()
        this.setIntensityMap()
        this.setDistanceMap()
    }

    async update()
    {
        this.distanceMap.dispose()
        this.setDistanceMap()
    }

    setColorMaps()
    {
        this.colorMaps = this.resources.items.colorMaps

        this.colorMaps.colorSpace = THREE.SRGBColorSpace
        this.colorMaps.minFilter = THREE.LinearFilter
        this.colorMaps.magFilter = THREE.LinearFilter
        this.colorMaps.generateMipmaps = false
        this.colorMaps.needsUpdate = true
    }

    setIntensityMap()
    {
        const source = this.computes.intensityMap
        const dimensions = source.parameters.dimensions
        const data = new Float32Array(source.tensor.dataSync())

        this.intensityMap = new THREE.Data3DTexture(data, ...dimensions)
        this.intensityMap.format = THREE.RedFormat
        this.intensityMap.type = THREE.FloatType
        this.intensityMap.minFilter = THREE.LinearFilter
        this.intensityMap.magFilter = THREE.LinearFilter
        this.intensityMap.computeMipmaps = false
        this.intensityMap.needsUpdate = true

        tf.dispose(source.tensor)
    }

    setDistanceMap()
    {
        const source = this.computes.distanceMap
        const dimensions = source.parameters.dimensions
        const data = new Int8Array(source.tensor.dataSync())

        this.distanceMap = new THREE.Data3DTexture(data, ...dimensions)
        this.distanceMap.format = THREE.RedIntegerFormat
        this.distanceMap.type = THREE.ByteType
        this.distanceMap.minFilter = THREE.NearestFilter
        this.distanceMap.magFilter = THREE.NearestFilter
        this.distanceMap.computeMipmaps = false
        this.distanceMap.needsUpdate = true

        tf.dispose(source.tensor)
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

        if (this.distanceMap)
        {
            this.distanceMap.dispose()
            this.distanceMap = null
        }

        this.viewer = null
        this.resources = null
        this.computes = null

        console.log('Textures destroyed.')
    }

}