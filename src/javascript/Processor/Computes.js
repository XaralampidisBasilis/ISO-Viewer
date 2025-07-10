import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TFUtils from '../../Utils/TensorUtils'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'
import { toHalfFloat, fromHalfFloat } from 'three/src/extras/DataUtils.js'
import { blockExtremaProgram } from './BlockExtremaProgram'
import { resizeProgram } from './ResizeProgram'
import { trilaplacianProgram } from './TrilaplacianProgram'
import { occupancyProgram } from './OccupancyProgram'

export default class Computes extends EventEmitter
{
    constructor()
    {
        super()

        this.viewer = new ISOViewer()
        this.renderer = this.viewer.renderer
        this.resources = this.viewer.resources
        this.uniforms = this.viewer.material.uniforms
        this.defines = this.viewer.material.defines
        this.stride = this.uniforms.u_distance_map.value.stride
        this.threshold = this.uniforms.u_rendering.value.intensity
        this.interpolationMethod = this.defines.INTERPOLATION_METHOD
        this.skippingMethod = this.defines.SKIPPING_METHOD

        // Wait for resources
        this.resources.on('ready', async () =>
        {
            await this.setTensorflow()
            await this.setComputes()
            this.trigger('ready')
        })
    }

    async setTensorflow()
    {
        tf.enableProdMode()
        await tf.ready()
        await tf.setBackend('webgl')
    }

    async onThresholdChange()
    {
        console.time('onThresholdChange') 

        this.threshold = this.uniforms.u_rendering.value.intensity
        
        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeIsotropicDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedDistanceMap()
        tf.dispose(this.occupancyMap.tensor)

        console.timeEnd('onThresholdChange') 
    }

    async onStrideChange()
    {
        console.time('onStrideChange') 

        this.stride = this.uniforms.u_distance_map.value.stride

        await this.uploadTrilaplacianIntensityMap()
        await this.computeExtremaMap()
        tf.dispose(this.trilaplacianIntensityMap.tensor)
        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeIsotropicDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedDistanceMap()
        tf.dispose(this.occupancyMap.tensor)

        console.timeEnd('onStrideChange') 
    }

    async onInterpolationChange()
    {
        console.time('onInterpolationChange') 

        this.interpolationMethod = this.defines.INTERPOLATION_METHOD

        await this.uploadTrilaplacianIntensityMap()
        await this.computeExtremaMap()
        tf.dispose(this.trilaplacianIntensityMap.tensor)
        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeIsotropicDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedDistanceMap()
        tf.dispose(this.occupancyMap.tensor)

        console.timeEnd('onInterpolationChange') 
    }

    async computeVolumeMap()
    {
        console.time('computeVolumeMap') 

        const volumeMap = this.resources.items.volumeMap

        // Compute intensity map parameters
        this.volumeMap = {}
        this.volumeMap.dimensions    = new THREE.Vector3().fromArray(volumeMap.dimensions)
        this.volumeMap.spacing       = new THREE.Vector3().fromArray(volumeMap.spacing)
        this.volumeMap.size          = new THREE.Vector3().fromArray(volumeMap.size)
        this.volumeMap.invDimensions = new THREE.Vector3().fromArray(volumeMap.dimensions.map(x => 1/x))
        this.volumeMap.invSpacing    = new THREE.Vector3().fromArray(volumeMap.spacing.map(x => 1/x))
        this.volumeMap.invSize       = new THREE.Vector3().fromArray(volumeMap.size.map(x => 1/x))
        this.volumeMap.spacingLength = new THREE.Vector3().fromArray(volumeMap.spacing).length()
        this.volumeMap.sizeLength    = new THREE.Vector3().fromArray(volumeMap.size).length()
        this.volumeMap.numVoxels     = volumeMap.dimensions.reduce((voxels, dims) => voxels * dims, 1)
        this.volumeMap.maxVoxels     = volumeMap.dimensions.reduce((voxels, dims) => voxels + dims, -2)
        this.volumeMap.shape         = volumeMap.dimensions.toReversed().concat(1)
    
        // compute normalized intensity map tensor
        const data = new Float32Array(volumeMap.data)
        this.volumeMap.tensor = tf.tensor4d(data, this.volumeMap.shape) 
        
        tf.tidy(() => 
        {
            const tensor = tf.tensor4d(data, this.volumeMap.shape)

            return TFUtils.map(volumeMap.min, volumeMap.max, tensor)
        })

        // compute intensity map data as uint16 encoding for HalfFloatType encoding
        this.volumeMap.array = new Uint16Array(this.volumeMap.tensor.size)
        const array = this.volumeMap.tensor.dataSync()

        for (let i = 0; i < this.volumeMap.array.length; ++i) {
            this.volumeMap.array[i] = toHalfFloat(array[i])
        }

        console.timeEnd('computeVolumeMap') 
    }

    async downscaleVolumeMap()
    {
        console.time('downscaleIntensityMap') 

        const newShape = this.intensityMap.tensor.shape.map((x) => Math.ceil(x * 0.5))
        const intensityMap = resizeProgram(this.intensityMap.tensor, newShape[0], newShape[1], newShape[2], false, true)  
        tf.dispose(this.intensityMap.tensor)

        // Compute new intensity map
        this.intensityMap.tensor = intensityMap
        this.intensityMap.dimensions = new THREE.Vector3().fromArray(this.intensityMap.tensor.shape.slice(0, 3).toReversed())
        this.intensityMap.size = new THREE.Vector3().copy(this.intensityMap.size)
        this.intensityMap.spacing = new THREE.Vector3().copy(this.intensityMap.size).divide(this.intensityMap.dimensions)
        this.intensityMap.invDimensions = new THREE.Vector3().fromArray(this.intensityMap.dimensions.toArray().map(x => 1/x))
        this.intensityMap.invSpacing = new THREE.Vector3().fromArray(this.intensityMap.spacing.toArray().map(x => 1/x))
        this.intensityMap.invSize = new THREE.Vector3().fromArray(this.intensityMap.size.toArray().map(x => 1/x))
        this.intensityMap.spacingLength = this.intensityMap.spacing.length()
        this.intensityMap.sizeLength = this.intensityMap.size.length()
        this.intensityMap.numVoxels = this.intensityMap.dimensions.toArray().reduce((voxels, dims) => voxels * dims, 1)
        this.intensityMap.maxVoxels = this.intensityMap.dimensions.toArray().reduce((voxels, dims) => voxels + dims, -2)
        this.intensityMap.shape = this.intensityMap.tensor.shape

        // compute intensity map data as uint16 encoding for HalfFloatType encoding
        this.intensityMap.array = null
        this.intensityMap.array = new Uint16Array(this.intensityMap.tensor.size)
        const array = this.intensityMap.tensor.dataSync()
        for (let i = 0; i < this.intensityMap.array.length; ++i) 
        {
            this.intensityMap.array[i] = toHalfFloat(array[i])
        }

        console.timeEnd('downscaleIntensityMap') 
    }

    async normalizeVolumeMap()
    {

    }

    async computeTrilaplacianIntensityMap()
    {
        console.time('computeTrilaplacianIntensityMap') 

        this.trilaplacianIntensityMap = {}
        this.trilaplacianIntensityMap.tensor = trilaplacianProgram(this.intensityMap.tensor)
        this.trilaplacianIntensityMap.array = new Uint16Array(this.trilaplacianIntensityMap.tensor.size)

        // convert data to half float type
        const array = this.trilaplacianIntensityMap.tensor.dataSync()
        for (let i = 0; i < this.trilaplacianIntensityMap.array.length; ++i) 
        {
            this.trilaplacianIntensityMap.array[i] = toHalfFloat(array[i])
        }

        // copy parameters from intensity map
        this.trilaplacianIntensityMap.shape         = this.trilaplacianIntensityMap.tensor.shape
        this.trilaplacianIntensityMap.dimensions    = this.intensityMap.dimensions
        this.trilaplacianIntensityMap.spacing       = this.intensityMap.spacing
        this.trilaplacianIntensityMap.size          = this.intensityMap.size
        this.trilaplacianIntensityMap.invDimensions = this.intensityMap.invDimensions
        this.trilaplacianIntensityMap.invSpacing    = this.intensityMap.invSpacing
        this.trilaplacianIntensityMap.invSize       = this.intensityMap.invSize
        this.trilaplacianIntensityMap.spacingLength = this.intensityMap.spacingLength
        this.trilaplacianIntensityMap.sizeLength    = this.intensityMap.sizeLength
        this.trilaplacianIntensityMap.numVoxels     = this.intensityMap.numVoxels
        this.trilaplacianIntensityMap.maxVoxels     = this.intensityMap.maxVoxels

        console.timeEnd('computeTrilaplacianIntensityMap') 
    }

    async computeExtremaMap()
    {
        console.time('computeExtremaMap') 

        this.extremaMap = {}
        this.extremaMap.tensor = blockExtremaProgram(this.trilaplacianIntensityMap.tensor, this.stride, this.interpolationMethod)
        this.extremaMap.array = new Float32Array(this.extremaMap.tensor.size)

        this.extremaMap.stride        = this.stride
        this.extremaMap.invStride     = 1 / this.extremaMap.stride
        this.extremaMap.shape         = this.extremaMap.tensor.shape
        this.extremaMap.dimensions    = new THREE.Vector3().fromArray(this.extremaMap.shape.slice(0, 3).toReversed())
        this.extremaMap.spacing       = new THREE.Vector3().copy(this.intensityMap.spacing).multiplyScalar(this.extremaMap.stride)
        this.extremaMap.size          = new THREE.Vector3().copy(this.extremaMap.dimensions).multiply(this.extremaMap.spacing)
        this.extremaMap.invDimensions = new THREE.Vector3().fromArray(this.extremaMap.dimensions.toArray().map(x => 1 / x))
        this.extremaMap.invSpacing    = new THREE.Vector3().fromArray(this.extremaMap.spacing.toArray().map(x => 1 / x))
        this.extremaMap.invSize       = new THREE.Vector3().fromArray(this.extremaMap.size.toArray().map(x => 1 / x))

        console.timeEnd('computeExtremaMap') 
    }

    async computeOccupancyMap()
    {
        console.time('computeOccupancyMap') 

        this.occupancyMap = {}
        // this.occupancyMap.tensor = await TF.computeOccupancyMap(this.extremaMap.tensor, this.threshold)
        this.occupancyMap.tensor = occupancyProgram(this.extremaMap.tensor, this.threshold)
        this.occupancyMap.array = new Uint8Array(this.occupancyMap.tensor.dataSync())
       
        this.occupancyMap.threshold     = this.threshold
        this.occupancyMap.stride        = this.extremaMap.stride
        this.occupancyMap.shape         = this.extremaMap.shape
        this.occupancyMap.dimensions    = this.extremaMap.dimensions
        this.occupancyMap.spacing       = this.extremaMap.spacing
        this.occupancyMap.size          = this.extremaMap.size
        this.occupancyMap.invStride     = this.extremaMap.invStride
        this.occupancyMap.invDimensions = this.extremaMap.invDimensions
        this.occupancyMap.invSpacing    = this.extremaMap.invSpacing
        this.occupancyMap.invSize       = this.extremaMap.invSize
        this.occupancyMap.numBlocks     = this.extremaMap.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)

        console.timeEnd('computeOccupancyMap') 
    }

    async computeBoundingBox()
    {
        console.time('computeBoundingBox') 
        
        const { minCoords, maxCoords } = await TFUtils.computeBoundingBox(this.occupancyMap.tensor)

        this.boundingBox = {}
        this.boundingBox.minCoords = minCoords
        this.boundingBox.maxCoords = maxCoords

        this.boundingBox.minBlockCoords = new THREE.Vector3().fromArray(this.boundingBox.minCoords)
        this.boundingBox.maxBlockCoords = new THREE.Vector3().fromArray(this.boundingBox.maxCoords)

        this.boundingBox.minCellCoords = this.boundingBox.minBlockCoords.clone().addScalar(0).multiplyScalar(this.occupancyMap.stride)
        this.boundingBox.maxCellCoords = this.boundingBox.maxBlockCoords.clone().addScalar(1).multiplyScalar(this.occupancyMap.stride).subScalar(1)   

        this.boundingBox.minPosition = this.boundingBox.minBlockCoords.clone().addScalar(0).multiplyScalar(this.occupancyMap.stride).subScalar(0.5) // voxel grid coords
        this.boundingBox.maxPosition = this.boundingBox.maxBlockCoords.clone().addScalar(1).multiplyScalar(this.occupancyMap.stride).subScalar(0.5) // voxel grid coords

        this.boundingBox.blockDimensions = new THREE.Vector3().subVectors(this.boundingBox.maxBlockCoords, this.boundingBox.minBlockCoords).addScalar(1)
        this.boundingBox.cellDimensions = new THREE.Vector3().subVectors(this.boundingBox.maxCellCoords, this.boundingBox.minCellCoords).addScalar(1)

        this.boundingBox.maxCells = this.boundingBox.cellDimensions.toArray().reduce((count, dimension) => count + dimension, -2)
        this.boundingBox.maxBlocks = this.boundingBox.blockDimensions.toArray().reduce((count, dimension) => count + dimension, -2)
        this.boundingBox.maxCellsPerBlock = this.occupancyMap.stride * 3 - 2

        console.timeEnd('computeBoundingBox') 
    }

    async computeIsotropicDistanceMap()
    {
        console.time('computeIsotropicDistanceMap') 

        this.isotropicDistanceMap = {}
        this.isotropicDistanceMap.tensor = await TFUtils.computeIsotropicDistanceMap(this.occupancyMap.tensor, 255)
        this.isotropicDistanceMap.array = new Uint8Array(this.isotropicDistanceMap.tensor.dataSync())
        tf.dispose(this.isotropicDistanceMap.tensor)

        this.isotropicDistanceMap.threshold     = this.occupancyMap.threshold    
        this.isotropicDistanceMap.stride        = this.occupancyMap.stride       
        this.isotropicDistanceMap.shape         = this.occupancyMap.shape        
        this.isotropicDistanceMap.dimensions    = this.occupancyMap.dimensions   
        this.isotropicDistanceMap.spacing       = this.occupancyMap.spacing      
        this.isotropicDistanceMap.size          = this.occupancyMap.size         
        this.isotropicDistanceMap.invStride     = this.occupancyMap.invStride    
        this.isotropicDistanceMap.invDimensions = this.occupancyMap.invDimensions
        this.isotropicDistanceMap.invSpacing    = this.occupancyMap.invSpacing   
        this.isotropicDistanceMap.invSize       = this.occupancyMap.invSize      
        this.isotropicDistanceMap.numBlocks     = this.occupancyMap.numBlocks    

        // this.distanceMap.maxDistance = tf.tidy(() => this.distanceMap.tensor.max().arraySync())
        // this.distanceMap.meanDistance = tf.tidy(() => this.distanceMap.tensor.mean().arraySync())
        
        console.timeEnd('computeIsotropicDistanceMap') 
    }

    async computeAnisotropicDistanceMap()
    {
        console.time('computeAnisotropicDistanceMap') 

        this.anisotropicDistanceMap = {}
        this.anisotropicDistanceMap.tensor = await TFUtils.computeAnisotropicDistanceMap(this.occupancyMap.tensor, 63)
        this.anisotropicDistanceMap.array = new Uint8Array(this.anisotropicDistanceMap.tensor.dataSync())
        tf.dispose(this.anisotropicDistanceMap.tensor)

        this.anisotropicDistanceMap.threshold     = this.occupancyMap.threshold    
        this.anisotropicDistanceMap.stride        = this.occupancyMap.stride       
        this.anisotropicDistanceMap.shape         = this.occupancyMap.shape        
        this.anisotropicDistanceMap.dimensions    = new THREE.Vector3(this.occupancyMap.dimensions.x, this.occupancyMap.dimensions.y, this.occupancyMap.dimensions.z * 8)
        this.anisotropicDistanceMap.spacing       = this.occupancyMap.spacing      
        this.anisotropicDistanceMap.size          = this.occupancyMap.size         
        this.anisotropicDistanceMap.invStride     = this.occupancyMap.invStride    
        this.anisotropicDistanceMap.invDimensions = this.occupancyMap.invDimensions
        this.anisotropicDistanceMap.invSpacing    = this.occupancyMap.invSpacing   
        this.anisotropicDistanceMap.invSize       = this.occupancyMap.invSize      
        this.anisotropicDistanceMap.numBlocks     = this.occupancyMap.numBlocks    

        // this.anisotropicDistanceMap.maxDistance = tf.tidy(() => this.anisotropicDistanceMap.tensor.max().arraySync())
        // this.anisotropicDistanceMap.meanDistance = tf.tidy(() => this.anisotropicDistanceMap.tensor.mean().arraySync())
        
        console.timeEnd('computeAnisotropicDistanceMap') 
    }

    async computeExtendedDistanceMap()
    {
        console.time('computeExtendedDistanceMap') 

        this.extendedDistanceMap = {}
        this.extendedDistanceMap.tensor = await TFUtils.computeExtendedDistanceMap(this.occupancyMap.tensor)
        this.extendedDistanceMap.array = new Uint16Array(this.extendedDistanceMap.tensor.dataSync())
        tf.dispose(this.extendedDistanceMap.tensor)

        this.extendedDistanceMap.threshold     = this.occupancyMap.threshold    
        this.extendedDistanceMap.stride        = this.occupancyMap.stride       
        this.extendedDistanceMap.shape         = this.occupancyMap.shape        
        this.extendedDistanceMap.dimensions    = new THREE.Vector3(this.occupancyMap.dimensions.x, this.occupancyMap.dimensions.y, this.occupancyMap.dimensions.z * 8)
        this.extendedDistanceMap.spacing       = this.occupancyMap.spacing      
        this.extendedDistanceMap.size          = this.occupancyMap.size         
        this.extendedDistanceMap.invStride     = this.occupancyMap.invStride    
        this.extendedDistanceMap.invDimensions = this.occupancyMap.invDimensions
        this.extendedDistanceMap.invSpacing    = this.occupancyMap.invSpacing   
        this.extendedDistanceMap.invSize       = this.occupancyMap.invSize      
        this.extendedDistanceMap.numBlocks     = this.occupancyMap.numBlocks    

        console.timeEnd('computeExtendedDistanceMap') 
    }

    async uploadIntensityMap()
    {
        if (this.intensityMap.array)
        {
            console.time('uploadIntensityMap') 

            const array = new Float32Array(this.intensityMap.array.length)
            for (let i = 0; i < this.intensityMap.array.length; ++i) 
            {
                array[i] = fromHalfFloat(this.intensityMap.array[i])
            }

            this.intensityMap.tensor = tf.tensor4d(array, this.intensityMap.shape)

            console.timeEnd('uploadIntensityMap') 
        }
        else
        {
            await this.computeIntensityMap()
        }
    }

    async uploadTrilaplacianIntensityMap()
    {
        if (this.trilaplacianIntensityMap.array)
        {
            console.time('uploadTrilaplacianIntensityMap') 

            const array = new Float32Array(this.trilaplacianIntensityMap.array.length)
            for (let i = 0; i < this.trilaplacianIntensityMap.array.length; ++i) 
            {
                array[i] = fromHalfFloat(this.trilaplacianIntensityMap.array[i])
            }

            this.trilaplacianIntensityMap.tensor = tf.tensor4d(array, this.trilaplacianIntensityMap.shape)

            console.timeEnd('uploadTrilaplacianIntensityMap') 
        }
        else
        {
            await this.computeTrilaplacianIntensityMap()
        }
    }

    destroy() 
    {
        if (this.intensityMap) 
        {
            tf.dispose(this.intensityMap.tensor)
            this.intensityMap.tensor = null
            this.intensityMap.array = null
            this.intensityMap = null
        }

        if (this.trilaplacianIntensityMap)
        {
            this.trilaplacianIntensityMap.array = null
            this.trilaplacianIntensityMap = null
        }

        if (this.extremaMap) 
        {
            tf.dispose(this.extremaMap.tensor)
            this.extremaMap.tensor = null
            this.extremaMap.array = null
            this.extremaMap = null
        }

        if (this.occupancyMap) 
        {
            tf.dispose(this.occupancyMap.tensor)
            this.occupancyMap.tensor = null
            this.occupancyMap.array = null
            this.occupancyMap = null
        }

        if (this.boundingBox) 
        {
            this.boundingBox = null
        }

        if (this.isotropicDistanceMap) 
        {
            tf.dispose(this.isotropicDistanceMap.tensor)
            this.isotropicDistanceMap.tensor = null
            this.isotropicDistanceMap.array = null
            this.isotropicDistanceMap = null
        }

        if (this.anisotropicDistanceMap) 
        {
            tf.dispose(this.anisotropicDistanceMap.tensor)
            this.anisotropicDistanceMap.tensor = null
            this.anisotropicDistanceMap.array = null
            this.anisotropicDistanceMap = null
        }

        if (this.extendedDistanceMap) 
        {
            tf.dispose(this.extendedDistanceMap.tensor)
            this.extendedDistanceMap.tensor = null
            this.extendedDistanceMap.array = null
            this.extendedDistanceMap = null
        }

        this.viewer = null
        this.renderer = null
        this.resources = null
        this.uniforms = null

        console.log('ISOComputes destroyed.')
    }
}