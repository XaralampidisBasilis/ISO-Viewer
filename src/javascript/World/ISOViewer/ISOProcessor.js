import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../../Utils/EventEmitter'

export default class ISOProcessor extends EventEmitter
{
    constructor(volume)
    {
        super()

        this.setComputes()
        this.setVolume(volume)
        this.setTensorflow()
    }

    async setTensorflow()
    {
        tf.enableProdMode()
        await tf.setBackend('webgl')
        await tf.ready()
        this.trigger('ready')
    }

    setComputes()
    {
        this.computes = 
        {
            intensityMap : { parameters: null, tensor: null},
            occupancyMap : { parameters: null, tensor: null},
            distanceMap  : { parameters: null, tensor: null},
            boundingBox  : { parameters: null},
        }

    }

    setVolume(volume)
    {
       
        console.time('setVolume')
        this.volume = volume
        this.volume.data = new Float32Array(volume.data)
        const data = this.volume.data
        const min = this.volume.min
        const scale = 1 / (this.volume.max - this.volume.min)
        for (let i = 0; i < data.length; i++) 
        {
            data[i] = (data[i] - min) * scale;
        }

        this.volume.parameters = 
        {
            dimensions       : new THREE.Vector3().fromArray(this.volume.dimensions),
            spacing          : new THREE.Vector3().fromArray(this.volume.spacing),
            size             : new THREE.Vector3().fromArray(this.volume.size),
            spacingLength    : new THREE.Vector3().fromArray(this.volume.spacing).length(),
            sizeLength       : new THREE.Vector3().fromArray(this.volume.size).length(),
            invDimensions    : new THREE.Vector3().fromArray(this.volume.dimensions.map(x => 1/x)),
            invSpacing       : new THREE.Vector3().fromArray(this.volume.spacing.map(x => 1/x)),
            invSize          : new THREE.Vector3().fromArray(this.volume.size.map(x => 1/x)),
            numVoxels        : this.volume.dimensions.reduce((voxels, dim) => voxels * dim, 1),
            shape            : this.volume.dimensions.toReversed().concat(1),
            minIntensity     : this.volume.min,
            maxIntensity     : this.volume.max,
        }
        console.timeEnd('setVolume')
    }

    destroy() 
    {
        for (const key of Object.keys(this.computes)) 
        {
            const computes = this.computes[key]
            if (!computes) continue

            if (computes.tensor instanceof tf.Tensor) 
            {
                tf.dispose(computes.tensor)
                computes.tensor = null
            }

            computes.parameters = null
            this.computes[key] = null
        }

        this.computes = null
        this.volume.data = null
        this.volume.parameters = null
        this.volume = null

        console.log('ISOProcessor destroyed.')
    }
      
    //  Computes

    async generateIntensityMap()
    {
        console.time('generateIntensityMap') 
        this.computes.intensityMap.tensor = tf.tensor4d(this.volume.data, this.volume.parameters.shape,'float32')                
        this.computes.intensityMap.parameters = {...this.volume.parameters}
        console.timeEnd('generateIntensityMap') 
        // console.log(this.computes.intensityMap.parameters)
        // console.log(this.computes.intensityMap.tensor.dataSync())
    }

    async generateOccupancyMap(threshold, subDivision)
    {
        if (!(this.computes.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeOccupancyMap: intensityMap is not computed`)
        }
        
        console.time('generateOccupancyMap') 
        const occupancyMap = await this.computeOccupancyMap(this.computes.intensityMap.tensor, threshold, subDivision)
        const parameters = {}

        parameters.shape = occupancyMap.shape
        parameters.threshold = threshold
        parameters.subDivision = subDivision
        parameters.invSubDivision = 1/subDivision
        parameters.dimensions = new THREE.Vector3().fromArray(occupancyMap.shape.slice(0, 3).toReversed())
        parameters.spacing = new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(subDivision)
        parameters.size = new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing)
        parameters.numBlocks = parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
        parameters.invDimensions = new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x))
        parameters.invSpacing = new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x))
        parameters.invSize = new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x))

        this.computes.occupancyMap.tensor = occupancyMap
        this.computes.occupancyMap.parameters = parameters
        console.timeEnd('generateOccupancyMap') 
        // console.log(this.computes.occupancyMap.parameters)
        // console.log(this.computes.occupancyMap.tensor.dataSync())
    }

    async generateDistanceMap(maxIters)
    {
        if (!(this.computes.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeDistanceMap: occupancyMap is not computed`)
        }

        console.time('generateDistanceMap') 
        const distanceMap = await this.computeDistanceMap(this.computes.occupancyMap.tensor, maxIters)
        const parameters = {...this.computes.occupancyMap.parameters}
        const maxTensor = distanceMap.max()
        const meanTensor = distanceMap.mean()

        parameters.maxDistance = maxTensor.arraySync()  
        parameters.meanTensor = meanTensor.arraySync()  
        tf.dispose([maxTensor, meanTensor])

        this.computes.distanceMap.tensor = distanceMap
        this.computes.distanceMap.parameters = parameters
        console.timeEnd('generateDistanceMap') 
        // console.log(this.computes.distanceMap.parameters)
        // console.log(this.computes.distanceMap.tensor.dataSync())
    }

    async generateBoundingBox()
    {
        if (!(this.computes.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeBoundingBox: occupancyMap is not computed`)
        }
   
        console.time('generateBoundingBox') 
        const boundingBox = await this.computeBoundingBox(this.computes.occupancyMap.tensor)
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
        parameters.numCells = parameters.dimensions.toArray().reduce((cells, dim) => cells * dim, 1)
        parameters.numBlocks = parameters.dimensions.clone().divideScalar(this.computes.occupancyMap.parameters.subDivision).ceil().toArray().reduce((blocks, dim) => blocks * dim, 1)
        parameters.maxCellCount = parameters.dimensions.toArray().reduce((intersections, cells) => intersections + cells, -2)
        parameters.maxBlockCount = parameters.dimensions.clone().divideScalar(this.computes.occupancyMap.parameters.subDivision).ceil().toArray().reduce((intersections, blocks) => intersections + blocks, -2)

        this.computes.boundingBox.parameters = parameters
        console.timeEnd('generateBoundingBox') 
        // console.log(this.computes.boundingBox.parameters)
    }
    
    // Helpers

    // async computeOccupancyMap(intensityMap, threshold, division) 
    // {
    //     // Scalars for threshold and output scaling
    //     const scalarThreshold = tf.scalar(threshold, 'float32')
    //     const strides = [division, division, division]
    //     const divisions = strides.map(x => x + 1)

    //     // Calculate necessary padding for valid subdivisions and boundary handling
    //     const divisible = intensityMap.shape
    //         .map((dimension, i) => Math.ceil((dimension - divisions[i]) / strides[i]) + 1)
    //         .map((dimension, i) => dimension * strides[i] + divisions[i])
    //     const padding = intensityMap.shape.map((dimension, i) => [1, divisible[i] - dimension - 1])
    //     padding[3] = [0, 0]

    //     // Symmetric padding to handle boundaries by adding zeros
    //     // const padded = tf.mirrorPad(intensityMap, padZ`ding, 'symmetric')
    //     const padded = tf.pad(intensityMap, padding)

    //     // Min pooling for lower bound detection
    //     const minPool = this.minPool3d(padded, divisions, strides, 'valid')
    //     const isAbove = tf.greaterEqual(scalarThreshold, minPool)
    //     tf.dispose(minPool)
    //     await tf.nextFrame()

    //     // Max pooling for upper bound detection
    //     const maxPool = tf.maxPool3d(padded, divisions, strides, 'valid')
    //     const isBellow = tf.lessEqual(scalarThreshold, maxPool)
    //     tf.dispose(maxPool)
    //     await tf.nextFrame()

    //     tf.dispose([padded, scalarThreshold])
    //     await tf.nextFrame()

    //     // Logical AND to find isosurface occupied blocks
    //     const occupancyMap = tf.logicalAnd(isAbove, isBellow)
    //     tf.dispose([isAbove, isBellow])
    //     await tf.nextFrame()

    //     return occupancyMap
    // }

    async computeOccupancyMap(intensityMap, threshold, blockSize) 
    {
        // Prepare strides and size for pooling operations
        const strides = [blockSize, blockSize, blockSize]
        const filterSize = [blockSize + 1, blockSize + 1, blockSize + 1]
        const scalarThreshold = tf.scalar(threshold, 'float32')
    
        // Compute shape in order to be appropriate for valid pool operations
        const shape = intensityMap.shape
        const blockCounts = shape.map((dimension) => Math.ceil((dimension - 1) / blockSize))
        const newShape = blockCounts.map((blockCount) => blockCount * blockSize + 1)
    
        // Calculate necessary padding for valid subdivisions and boundary handling
        // Source for convolution resulting shape https://www.tensorflow.org/api_docs/python/tf/nn/convolution
        const padding = shape.map((dimension, i) => [1, newShape[i] - dimension - 1])
        padding[3] = [0, 0]
        const padded = tf.pad(intensityMap, padding) // tf.mirrorPad(intensityMap, padding, 'symmetric')
        
        // Min pooling for lower bound detection
        const minPool = this.minPool3d(padded, filterSize, strides, 'valid')
        const isAbove = tf.greaterEqual(scalarThreshold, minPool)
        tf.dispose(minPool)
        await tf.nextFrame()
    
        // Max pooling for upper bound detection
        const maxPool = tf.maxPool3d(padded, filterSize, strides, 'valid')
        const isBellow = tf.lessEqual(scalarThreshold, maxPool)
        tf.dispose([maxPool, padded, scalarThreshold])
        await tf.nextFrame()
    
        // Logical AND to find isosurface occupied blocks
        const occupancyMap = tf.logicalAnd(isAbove, isBellow)
        tf.dispose([isAbove, isBellow])
        await tf.nextFrame()
    
        return occupancyMap
    }

    async computeDistanceMap(occupancyMap, maxDistance) 
    {
        // Initialize the frontier (occupied voxels) and the distance tensor
        let frontier = tf.cast(occupancyMap, 'bool')
        let distances = tf.zeros(occupancyMap.shape, 'int32')  
        
        for (let i = 1; i < maxDistance; i++) 
        {
            // Compute the new frontier by expanding occupied regions using 3D max pooling
            const newFrontier = tf.maxPool3d(frontier, [3, 3, 3], [1, 1, 1], 'same')
            
            // Identify the newly occupied voxels (wavefront) by comparing with the old frontier
            const wavefront = tf.notEqual(newFrontier, frontier)
            frontier.dispose()
            
            // Compute and add distances for the newly occupied voxels at this step
            const distance = tf.scalar(i, 'int32')
            const waveDistance = wavefront.mul(distance)
            const newDistances = distances.add(waveDistance)
            distances.dispose()
            
            // Update the frontier and distances for the next iteration
            frontier = newFrontier
            distances = newDistances
    
            // Dispose temporary tensors and yield to the next frame
            tf.dispose([distance, wavefront, waveDistance])
            await tf.nextFrame()
        }
    
        // Any remaining free voxels form the final wavefront
        const wavefront = tf.logicalNot(frontier)
        frontier.dispose()
    
        // Assign the maximum distance to voxels still not reached
        const distance = tf.scalar(maxDistance, 'int32')
        const waveDistance = wavefront.mul(distance)
        const distanceMap = distances.add(waveDistance)
        distances.dispose()
    
        // Dispose final temporary tensors and yield to the next frame
        tf.dispose([distance, wavefront, waveDistance])
        await tf.nextFrame()
    
        return distanceMap
    }

    async computeBoundingBox(occupancyMap) 
    {
        return tf.tidy(() => 
        {
            // Helper to find first and last index where the value is truthy
            const bounds = (array) => [array.findIndex(Boolean), array.findLastIndex(Boolean)]
    
            // Collapse occupancy map across axes to identify active voxels
            // For each axis, reduce all other axes and get a 1D boolean array
            const collapsedX = occupancyMap.any([1, 2, 3]).arraySync().flat() 
            const collapsedY = occupancyMap.any([0, 2, 3]).arraySync().flat() 
            const collapsedZ = occupancyMap.any([0, 1, 3]).arraySync().flat() 
    
            // Get bounds (min and max index) for each axis
            const [xMin, xMax] = bounds(collapsedX)
            const [yMin, yMax] = bounds(collapsedY)
            const [zMin, zMax] = bounds(collapsedZ)
    
            // Return bounding box coordinates in [z, y, x] order
            return {
                minCoords: [zMin, yMin, xMin],
                maxCoords: [zMax, yMax, xMax],
            }
        })
    }

    minPool3d(tensor4d, filterSize, strides, pad)
    {
        return tf.tidy(() =>
        {
            const tensorNeg = tensor4d.neg()
            const maxPool = tf.maxPool3d(tensorNeg, filterSize, strides, pad)
            const minPool = maxPool.neg()
            return minPool
        })

    } 
}