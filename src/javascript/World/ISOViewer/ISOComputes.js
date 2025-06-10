import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TF from '../../Utils/TensorUtils'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'
import { toHalfFloat } from 'three/src/extras/DataUtils.js'
import { computeBersteinExtrema } from './BersteinExtremaProgram'
import { computeBlockBersteinExtrema } from './BlockBersteinExtremaProgram'
export default class ISOComputes extends EventEmitter
{
    constructor()
    {
        super()

        this.viewer = new ISOViewer()
        this.renderer = this.viewer.renderer
        this.resources = this.viewer.resources
        this.uniforms = this.viewer.material.uniforms
        this.stride = this.uniforms.u_distance_map.value.stride
        this.threshold = this.uniforms.u_rendering.value.intensity

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
        console.time('setTensorflow') 

        tf.enableProdMode()

        await tf.ready()
        await tf.setBackend('webgl')
        // console.log('tf', tf)

        console.timeEnd('setTensorflow') 
    }

    async setComputes()
    {
        console.time('setComputes') 

        await this.computeIntensityMap()
        await this.downscaleIntensityMap()
        await this.computeTrilaplacianIntensityMap()
        await this.computeBlockExtremaMap()
        tf.dispose(this.intensityMap.tensor)

        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedAnisotropicDistanceMap()
        tf.dispose(this.occupancyMap.tensor)

        // tf.engine().reset()
        // await this.setTensorflow()

        console.timeEnd('setComputes') 
    }

    async onThresholdChange()
    {
        this.threshold = this.uniforms.u_rendering.value.intensity
        
        await this.setTensorflow()
        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedAnisotropicDistanceMap()
        tf.dispose(this.occupancyMap.tensor)
    }

    async onStrideChange()
    {
        this.stride = this.uniforms.u_distance_map.value.stride
        
        await this.computeIntensityMap()
        await this.computeBlockExtremaMap()
        tf.dispose(this.intensityMap.tensor)

        await tf.nextFrame()
        await this.computeOccupancyMap()
        await this.computeBoundingBox()
        await this.computeDistanceMap()
        await this.computeAnisotropicDistanceMap()
        await this.computeExtendedAnisotropicDistanceMap()
        tf.dispose(this.occupancyMap.tensor)
    }

    async computeIntensityMap()
    {
        console.time('computeIntensityMap') 

        const intensityMap = this.resources.items.intensityMap

        // Compute intensity map parameters
        this.intensityMap = {}
        this.intensityMap.dimensions    = new THREE.Vector3().fromArray(intensityMap.dimensions)
        this.intensityMap.spacing       = new THREE.Vector3().fromArray(intensityMap.spacing)
        this.intensityMap.size          = new THREE.Vector3().fromArray(intensityMap.size)
        this.intensityMap.invDimensions = new THREE.Vector3().fromArray(intensityMap.dimensions.map(x => 1/x))
        this.intensityMap.invSpacing    = new THREE.Vector3().fromArray(intensityMap.spacing.map(x => 1/x))
        this.intensityMap.invSize       = new THREE.Vector3().fromArray(intensityMap.size.map(x => 1/x))
        this.intensityMap.spacingLength = new THREE.Vector3().fromArray(intensityMap.spacing).length()
        this.intensityMap.sizeLength    = new THREE.Vector3().fromArray(intensityMap.size).length()
        this.intensityMap.numVoxels     = intensityMap.dimensions.reduce((voxels, dims) => voxels * dims, 1)
        this.intensityMap.maxVoxels     = intensityMap.dimensions.reduce((voxels, dims) => voxels + dims, -2)
        this.intensityMap.shape         = intensityMap.dimensions.toReversed().concat(1)
    
        // compute normalized intensity map tensor
        this.intensityMap.tensor = tf.tidy(() => 
        {
            const data = new Float32Array(intensityMap.data)
            const tensor = tf.tensor4d(data, this.intensityMap.shape)

            return TF.map(intensityMap.min, intensityMap.max, tensor)
        })

        // compute intensity map data as uint16 encoding for HalfFloatType encoding
        this.intensityMap.array = new Uint16Array(this.intensityMap.tensor.size)
        const array = this.intensityMap.tensor.dataSync()

        for (let i = 0; i < this.intensityMap.array.length; ++i) {
            this.intensityMap.array[i] = toHalfFloat(array[i])
        }

        console.timeEnd('computeIntensityMap') 
    }

    async downscaleIntensityMap()
    {
        console.time('downscaleIntensityMap') 

        const intensityMap = await TF.downscaleLinear(this.intensityMap.tensor, 2)  
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

    async computeTrilaplacianIntensityMap()
    {
        console.time('computeTrilaplacianIntensityMap') 

        this.trilaplacianIntensityMap = {}
        this.trilaplacianIntensityMap.tensor = await TF.computeTrilaplacianIntensityMap(this.intensityMap.tensor)
        this.trilaplacianIntensityMap.array = new Uint16Array(this.intensityMap.tensor.size * 4)

        // convert data to half float type
        const array = this.trilaplacianIntensityMap.tensor.dataSync()

        for (let i = 0; i < this.trilaplacianIntensityMap.array.length; ++i) {
            this.trilaplacianIntensityMap.array[i] = toHalfFloat(array[i])
        }

        // copy parameters from intensity map
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

    async computeBlockExtremaMap()
    {
        console.time('computeBlockExtremaMap') 

        this.blockExtremaMap = {}
        // this.blockExtremaMap.tensor = await TF.computeBlockExtremaMap(this.intensityMap.tensor, this.stride)
        this.blockExtremaMap.tensor = await computeBlockBersteinExtrema(this.trilaplacianIntensityMap.tensor, this.stride)
        this.blockExtremaMap.array = new Float32Array(this.blockExtremaMap.tensor.size)

        this.blockExtremaMap.stride        = this.stride
        this.blockExtremaMap.invStride     = 1 / this.blockExtremaMap.stride
        this.blockExtremaMap.shape         = this.blockExtremaMap.tensor.shape
        this.blockExtremaMap.dimensions    = new THREE.Vector3().fromArray(this.blockExtremaMap.shape.slice(0, 3).toReversed())
        this.blockExtremaMap.spacing       = new THREE.Vector3().copy(this.intensityMap.spacing).multiplyScalar(this.blockExtremaMap.stride)
        this.blockExtremaMap.size          = new THREE.Vector3().copy(this.blockExtremaMap.dimensions).multiply(this.blockExtremaMap.spacing)
        this.blockExtremaMap.invDimensions = new THREE.Vector3().fromArray(this.blockExtremaMap.dimensions.toArray().map(x => 1 / x))
        this.blockExtremaMap.invSpacing    = new THREE.Vector3().fromArray(this.blockExtremaMap.spacing.toArray().map(x => 1 / x))
        this.blockExtremaMap.invSize       = new THREE.Vector3().fromArray(this.blockExtremaMap.size.toArray().map(x => 1 / x))

        console.timeEnd('computeBlockExtremaMap') 
    }

    async computeOccupancyMap()
    {
        console.time('computeOccupancyMap') 

        this.occupancyMap = {}
        this.occupancyMap.tensor = await TF.computeOccupancyMap(this.blockExtremaMap.tensor, this.threshold)
        this.occupancyMap.array = new Uint8Array(this.occupancyMap.tensor.dataSync())
       
        this.occupancyMap.threshold     = this.threshold
        this.occupancyMap.stride        = this.blockExtremaMap.stride
        this.occupancyMap.shape         = this.blockExtremaMap.shape
        this.occupancyMap.dimensions    = this.blockExtremaMap.dimensions
        this.occupancyMap.spacing       = this.blockExtremaMap.spacing
        this.occupancyMap.size          = this.blockExtremaMap.size
        this.occupancyMap.invStride     = this.blockExtremaMap.invStride
        this.occupancyMap.invDimensions = this.blockExtremaMap.invDimensions
        this.occupancyMap.invSpacing    = this.blockExtremaMap.invSpacing
        this.occupancyMap.invSize       = this.blockExtremaMap.invSize
        this.occupancyMap.numBlocks     = this.blockExtremaMap.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)

        console.timeEnd('computeOccupancyMap') 
    }

    async computeBoundingBox()
    {
        console.time('computeBoundingBox') 
        
        const { minCoords, maxCoords } = await TF.computeBoundingBox(this.occupancyMap.tensor)

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

    async computeDistanceMap()
    {
        console.time('computeDistanceMap') 

        this.distanceMap = {}
        this.distanceMap.tensor = await TF.computeDistanceMap(this.occupancyMap.tensor, 255)
        this.distanceMap.array = new Uint8Array(this.distanceMap.tensor.dataSync())
        tf.dispose(this.distanceMap.tensor)

        this.distanceMap.threshold     = this.occupancyMap.threshold    
        this.distanceMap.stride        = this.occupancyMap.stride       
        this.distanceMap.shape         = this.occupancyMap.shape        
        this.distanceMap.dimensions    = this.occupancyMap.dimensions   
        this.distanceMap.spacing       = this.occupancyMap.spacing      
        this.distanceMap.size          = this.occupancyMap.size         
        this.distanceMap.invStride     = this.occupancyMap.invStride    
        this.distanceMap.invDimensions = this.occupancyMap.invDimensions
        this.distanceMap.invSpacing    = this.occupancyMap.invSpacing   
        this.distanceMap.invSize       = this.occupancyMap.invSize      
        this.distanceMap.numBlocks     = this.occupancyMap.numBlocks    

        // this.distanceMap.maxDistance = tf.tidy(() => this.distanceMap.tensor.max().arraySync())
        // this.distanceMap.meanDistance = tf.tidy(() => this.distanceMap.tensor.mean().arraySync())
        
        console.timeEnd('computeDistanceMap') 
    }

    async computeAnisotropicDistanceMap()
    {
        console.time('computeAnisotropicDistanceMap') 

        this.anisotropicDistanceMap = {}
        this.anisotropicDistanceMap.tensor = await TF.computeAnisotropicDistanceMap(this.occupancyMap.tensor, 63)
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

    async computeExtendedAnisotropicDistanceMap()
    {
        console.time('computeExtendedAnisotropicDistanceMap') 

        this.extendedAnisotropicDistanceMap = {}
        this.extendedAnisotropicDistanceMap.tensor = await TF.computeExtendedAnisotropicDistanceMap(this.occupancyMap.tensor)
        this.extendedAnisotropicDistanceMap.array = new Uint16Array(this.extendedAnisotropicDistanceMap.tensor.dataSync())
        tf.dispose(this.extendedAnisotropicDistanceMap.tensor)

        this.extendedAnisotropicDistanceMap.threshold     = this.occupancyMap.threshold    
        this.extendedAnisotropicDistanceMap.stride        = this.occupancyMap.stride       
        this.extendedAnisotropicDistanceMap.shape         = this.occupancyMap.shape        
        this.extendedAnisotropicDistanceMap.dimensions    = new THREE.Vector3(this.occupancyMap.dimensions.x, this.occupancyMap.dimensions.y, this.occupancyMap.dimensions.z * 8)
        this.extendedAnisotropicDistanceMap.spacing       = this.occupancyMap.spacing      
        this.extendedAnisotropicDistanceMap.size          = this.occupancyMap.size         
        this.extendedAnisotropicDistanceMap.invStride     = this.occupancyMap.invStride    
        this.extendedAnisotropicDistanceMap.invDimensions = this.occupancyMap.invDimensions
        this.extendedAnisotropicDistanceMap.invSpacing    = this.occupancyMap.invSpacing   
        this.extendedAnisotropicDistanceMap.invSize       = this.occupancyMap.invSize      
        this.extendedAnisotropicDistanceMap.numBlocks     = this.occupancyMap.numBlocks    

        console.timeEnd('computeExtendedAnisotropicDistanceMap') 
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

        if (this.blockExtremaMap) 
        {
            tf.dispose(this.blockExtremaMap.tensor)
            this.blockExtremaMap.tensor = null
            this.blockExtremaMap.array = null
            this.blockExtremaMap = null
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

        if (this.distanceMap) 
        {
            tf.dispose(this.distanceMap.tensor)
            this.distanceMap.tensor = null
            this.distanceMap.array = null
            this.distanceMap = null
        }

        if (this.anisotropicDistanceMap) 
        {
            tf.dispose(this.anisotropicDistanceMap.tensor)
            this.anisotropicDistanceMap.tensor = null
            this.anisotropicDistanceMap.array = null
            this.anisotropicDistanceMap = null
        }

        if (this.extendedAnisotropicDistanceMap) 
        {
            tf.dispose(this.extendedAnisotropicDistanceMap.tensor)
            this.extendedAnisotropicDistanceMap.tensor = null
            this.extendedAnisotropicDistanceMap.array = null
            this.extendedAnisotropicDistanceMap = null
        }

        this.viewer = null
        this.renderer = null
        this.resources = null
        this.uniforms = null

        console.log('ISOComputes destroyed.')
    }
}