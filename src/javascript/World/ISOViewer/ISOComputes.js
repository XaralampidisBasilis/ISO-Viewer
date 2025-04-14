import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TENSOR from '../../Utils/TensorUtils'
import EventEmitter from '../../Utils/EventEmitter'
import ISOViewer from './ISOViewer'

export default class ISOComputes extends EventEmitter
{
    constructor()
    {
        super()

        this.viewer = new ISOViewer()
        this.renderer = this.viewer.renderer
        this.resources = this.viewer.resources

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

    async setComputes()
    {
        const uniforms = this.viewer.mesh.material.uniforms
        const threshold = uniforms.u_rendering.value.intensity
        const stride = uniforms.u_distance_map.value.stride

        await this.computeIntensityMap()
        await this.computeOccupancyMap(threshold, stride)
        await this.computeBoundingBox()
        await this.computeDistanceMap()
    }

    async update()
    {
        const uniforms = this.viewer.mesh.material.uniforms
        const threshold = uniforms.u_rendering.value.intensity
        const stride = uniforms.u_distance_map.value.stride

        tf.dispose(this.occupancyMap.tensor)
        tf.dispose(this.distanceMap.tensor)
        
        await this.computeOccupancyMap(threshold, stride)
        await this.computeBoundingBox()
        await this.computeDistanceMap()
    }

    async computeIntensityMap()
    {
        console.time('computeIntensityMap') 
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
        console.timeEnd('computeIntensityMap') 
    }

    async computeOccupancyMap(threshold, stride)
    {
        console.time('computeOccupancyMap') 
        const tensor = await TENSOR.computeOccupancyMap(this.intensityMap.tensor, threshold, stride)
       
        const parameters = {}
        parameters.shape = tensor.shape
        parameters.threshold = threshold
        parameters.stride = stride
        parameters.invStride = 1/stride
        parameters.dimensions = new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed())
        parameters.spacing = new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(stride)
        parameters.size = new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing)
        parameters.numBlocks = parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
        parameters.invDimensions = new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x))
        parameters.invSpacing = new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x))
        parameters.invSize = new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x))

        this.occupancyMap = { tensor : tensor, parameters : parameters }
        console.timeEnd('computeOccupancyMap') 
    }

    async computeBoundingBox()
    {
        console.time('computeBoundingBox') 
        const boundingBox = await TENSOR.computeBoundingBox(this.binaryMap.tensor)
        
        const parameters = {}

        parameters.minPosition = new THREE.Vector3().fromArray(boundingBox.minCoords).addScalar(0).multiply(this.computes.occupancyMap.parameters.spacing)
        parameters.maxPosition = new THREE.Vector3().fromArray(boundingBox.maxCoords).addScalar(1).multiply(this.computes.occupancyMap.parameters.spacing)
        parameters.minPosition.clamp(new THREE.Vector3(), this.volume.parameters.size)
        parameters.maxPosition.clamp(new THREE.Vector3(), this.volume.parameters.size)

        parameters.minCoords = new THREE.Vector3().copy(parameters.minPosition).divide(this.volume.parameters.spacing).addScalar(0.5).floor() // included in bbox
        parameters.maxCoords = new THREE.Vector3().copy(parameters.maxPosition).divide(this.volume.parameters.spacing).subScalar(0.5).floor() // included in bbox
        parameters.minCoords.clamp(new THREE.Vector3(), this.volume.parameters.dimensions)
        parameters.maxCoords.clamp(new THREE.Vector3(), this.volume.parameters.dimensions)

        parameters.dimensions = new THREE.Vector3().subVectors(parameters.maxCoords, parameters.minCoords).addScalar(1)
        parameters.size = parameters.dimensions.clone().multiply(this.occupancyMap.parameters.spacing)
        parameters.numCells = parameters.dimensions.toArray().reduce((cells, dim) => cells * dim, 1)
        parameters.numBlocks = parameters.dimensions.clone().divideScalar(this.computes.occupancyMap.parameters.subDivision).ceil().toArray().reduce((blocks, dim) => blocks * dim, 1)
        parameters.maxCellCount = parameters.dimensions.toArray().reduce((intersections, cells) => intersections + cells, -2)
        parameters.maxBlockCount = parameters.dimensions.clone().divideScalar(this.computes.occupancyMap.parameters.subDivision).ceil().toArray().reduce((intersections, blocks) => intersections + blocks, -2)

        // parameters.minCoords = new THREE.Vector3().fromArray(boundingBox.minCoords)
        // parameters.maxCoords = new THREE.Vector3().fromArray(boundingBox.maxCoords)
        // parameters.dimensions = new THREE.Vector3().subVectors(parameters.maxCoords, parameters.minCoords).addScalar(1)
        // parameters.size = parameters.dimensions.clone().multiply(this.binaryMap.parameters.spacing)
        // parameters.numCells = parameters.dimensions.toArray().reduce((count, dimension) => count * dimension, 1)
        // parameters.maxCells = parameters.dimensions.toArray().reduce((count, dimension) => count + dimension, -2)

        this.boundingBox = { parameters : parameters }
        console.timeEnd('computeBoundingBox') 
    }

    async computeDistanceMap()
    {
        console.time('computeDistanceMap') 
        const begin = this.boundingBox.parameters.minCoords.toArray().toReversed().concat(0)
        const sliceSize = this.boundingBox.parameters.dimensions.toArray().toReversed().concat(1)
        const tensor = await TENSOR.computeDistanceMapFromSlice(this.binaryMap.tensor, begin, sliceSize, 255)

        const parameters = {...this.binaryMap.parameters}
        parameters.maxDistance = tf.tidy(() => tensor.max().arraySync())  
        
        this.distanceMap = { tensor : tensor, parameters : parameters }
        console.timeEnd('computeDistanceMap') 
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

        if (this.occupancyMap) 
        {
            tf.dispose(this.occupancyMap.tensor)
            this.occupancyMap.tensor = null
            this.occupancyMap.parameters = null
            this.occupancyMap = null
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