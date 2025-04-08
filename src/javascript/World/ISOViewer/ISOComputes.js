import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TENSOR from '../../Utils/TensorUtils'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'

export default class ISOProcessor extends EventEmitter
{
    constructor()
    {
        super()

        this.viewer = new ISOViewer()
        this.renderer = this.viewer.renderer
        this.resources = this.viewer.resources

        // Wait for resources
        this.resources.on('ready', () =>
        {
            this.setComputes()
        })
    }

    async setComputes()
    {
        console.time('Computes') 

        // tf.enableProdMode()
        await tf.ready()

        await tf.setBackend('webgl')
        await this.setIntensityMap()
        await this.downscaleIntensityMap()

        await tf.setBackend('webgl')
        await this.setOccupancyMap()
        await this.setBoundingBox()
        await this.setDistanceMap()
     
        this.trigger('ready')
        console.timeEnd('Computes') 
    }

    async setIntensityMap()
    {
        console.time('setIntensityMap') 
        const source = this.resources.items.intensityMap
        const parameters = 
        {
            dimensions       : new THREE.Vector3().fromArray(source.dimensions),
            spacing          : new THREE.Vector3().fromArray(source.spacing),
            size             : new THREE.Vector3().fromArray(source.size),
            invDimensions    : new THREE.Vector3().fromArray(source.dimensions.map(x => 1/x)),
            invSpacing       : new THREE.Vector3().fromArray(source.spacing.map(x => 1/x)),
            invSize          : new THREE.Vector3().fromArray(source.size.map(x => 1/x)),
            spacingLength    : new THREE.Vector3().fromArray(source.spacing).length(),
            sizeLength       : new THREE.Vector3().fromArray(source.size).length(),
            numVoxels        : source.dimensions.reduce((voxels, dimension) => voxels * dimension, 1),
            maxVoxels        : source.dimensions.reduce((voxels, dimension) => voxels + dimension, -2),
            shape            : source.dimensions.toReversed().concat(1),
        }

        const min = source.min
        const range = source.max - source.min
        const data = new Float32Array(source.data)
        const tensor = tf.tidy(() => tf.tensor4d(data, parameters.shape,'float32').sub([min]).div([range]))        

        this.intensityMap = { tensor : tensor, parameters : parameters }
        console.timeEnd('setIntensityMap') 
        // console.log(this.intensityMap.parameters)
        // console.log(this.intensityMap.tensor.dataSync())
    }

    async setOccupancyMap(threshold, blockDimensions)
    {
        console.time('setOccupancyMap') 
        const tensor = await TENSOR.computeOccupancyMap(this.computes.intensityMap.tensor, threshold, blockDimensions)
       
        const parameters = {}
        parameters.shape = tensor.shape
        parameters.threshold = threshold
        parameters.blockDimensions = blockDimensions
        parameters.invBlockDimensions = 1/blockDimensions
        parameters.dimensions = new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed())
        parameters.spacing = new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(blockDimensions)
        parameters.size = new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing)
        parameters.numBlocks = parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
        parameters.invDimensions = new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x))
        parameters.invSpacing = new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x))
        parameters.invSize = new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x))

        this.occupancyMap = { tensor : tensor, parameters : parameters }
        console.timeEnd('setOccupancyMap') 
        // console.log(this.occupancyMap.parameters)
        // console.log(this.occupancyMap.tensor.dataSync())
    }

    async setBoundingBox()
    {
        console.time('setBoundingBox') 
        const boundingBox = await TENSOR.computeBoundingBox(this.binaryMap.tensor)
        
        const parameters = {}
        parameters.minCoords = new THREE.Vector3().fromArray(boundingBox.minCoords)
        parameters.maxCoords = new THREE.Vector3().fromArray(boundingBox.maxCoords)
        parameters.dimensions = new THREE.Vector3().subVectors(parameters.maxCoords, parameters.minCoords).addScalar(1)
        parameters.size = parameters.dimensions.clone().multiply(this.binaryMap.parameters.spacing)
        parameters.numCells = parameters.dimensions.toArray().reduce((count, dimension) => count * dimension, 1)
        parameters.maxCells = parameters.dimensions.toArray().reduce((count, dimension) => count + dimension, -2)

        this.boundingBox = { parameters : parameters }
        console.timeEnd('setBoundingBox') 
        // console.log(this.boundingBox.parameters)
    }

    async setDistanceMap()
    {
        console.time('setDistanceMap') 
        const begin = this.boundingBox.parameters.minCoords.toArray().toReversed().concat(0)
        const sliceSize = this.boundingBox.parameters.dimensions.toArray().toReversed().concat(1)
        const tensor = await TENSOR.computeDistanceMapFromSlice(this.binaryMap.tensor, begin, sliceSize, 128)

        const parameters = {...this.binaryMap.parameters}
        const maxTensor = tensor.max()
        parameters.maxDistance = maxTensor.arraySync()  
        tf.dispose(maxTensor)

        this.distanceMap = { tensor : tensor, parameters : parameters }
        console.timeEnd('setDistanceMap') 
        // console.log(this.distanceMap.parameters)
        // console.log(this.distanceMap.tensor)
        // console.log(this.distanceMap.tensor.dataSync())
    }

    async downscaleIntensityMap()
    {
        console.time('downscaleIntensityMap') 
        const downscaledMap = await TENSOR.downscaleLinear(this.intensityMap.tensor, 2)  

        const parameters = {}
        parameters.shape = downscaledMap.shape
        parameters.dimensions = new THREE.Vector3().fromArray(downscaledMap.shape.slice(0, 3).toReversed())
        parameters.size = new THREE.Vector3().copy(this.intensityMap.parameters.size)
        parameters.spacing = new THREE.Vector3().copy(parameters.size).divide(parameters.dimensions)
        parameters.invDimensions = new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x))
        parameters.invSpacing = new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x))
        parameters.invSize = new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x))
        parameters.spacingLength = parameters.spacing.length()
        parameters.sizeLength = parameters.size.length()
        parameters.numVoxels = parameters.dimensions.toArray().reduce((voxels, dimension) => voxels * dimension, 1)
        parameters.maxVoxels = parameters.dimensions.toArray().reduce((voxels, dimension) => voxels + dimension, -2)

        tf.dispose(this.intensityMap.tensor)
        this.intensityMap.tensor = downscaledMap
        this.intensityMap.parameters = parameters

        console.timeEnd('downscaleIntensityMap') 
        // console.log(this.intensityMap.parameters)
        // console.log(this.intensityMap.tensor.dataSync())
    }

    destroy() 
    {
        if (this.intensityMap) 
        {
            tf.dispose(this.intensityMap.tensor)
            this.intensityMap.tensor = null
            this.intensityMap.parameters = null
            this.intensityMap = null

        }

        if (this.binaryMap) 
        {
            tf.dispose(this.binaryMap.tensor)
            this.binaryMap.tensor = null
            this.binaryMap.parameters = null
            this.binaryMap = null
        }

        if (this.distanceMap) 
        {
            tf.dispose(this.distanceMap.tensor)
            this.distanceMap.tensor = null
            this.distanceMap.parameters = null
            this.distanceMap = null
        }

        if (this.boundingBox) 
        {
            this.boundingBox.parameters = null
            this.boundingBox = null
        }

        this.viewer =  null
        this.renderer = null
        this.resources = null

        console.log('Computes destroyed.')
    }
}