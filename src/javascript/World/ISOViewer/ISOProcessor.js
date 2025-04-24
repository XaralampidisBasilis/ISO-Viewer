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
            intensityMap: { parameters: null, tensor: null},
            occupancyMap: { parameters: null, tensor: null},
            distanceMap : { parameters: null, tensor: null},
            distance3Map: { parameters: null, tensor: null},
            boundingBox : { parameters: null},
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

    async generateOccupancyMap(threshold, stride)
    {
        console.time('generateOccupancyMap') 
        const occupancyMap = await this.computeOccupancyMap(this.computes.intensityMap.tensor, threshold, stride)
        const parameters = {}

        parameters.shape = occupancyMap.shape
        parameters.threshold = threshold
        parameters.stride = stride
        parameters.invStride = 1/stride
        parameters.dimensions = new THREE.Vector3().fromArray(occupancyMap.shape.slice(0, 3).toReversed())
        parameters.spacing = new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(stride)
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

    async generateBoundingBox()
    {
        if (!(this.computes.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeBoundingBox: occupancyMap is not computed`)
        }
   
        console.time('generateBoundingBox') 
        const boundingBox = await this.computeBoundingBox(this.computes.occupancyMap.tensor)
    
        const parameters = {}
        const stride = this.computes.occupancyMap.parameters.stride
        parameters.minBlockCoords = new THREE.Vector3().fromArray(boundingBox.minCoords)
        parameters.maxBlockCoords = new THREE.Vector3().fromArray(boundingBox.maxCoords)
        parameters.minCellCoords = parameters.minBlockCoords.clone().addScalar(0).multiplyScalar(stride)
        parameters.maxCellCoords = parameters.maxBlockCoords.clone().addScalar(1).multiplyScalar(stride).subScalar(1)     
        parameters.blockDimensions = new THREE.Vector3().subVectors(parameters.maxBlockCoords, parameters.minBlockCoords).addScalar(1)
        parameters.cellDimensions = new THREE.Vector3().subVectors(parameters.maxCellCoords, parameters.minCellCoords).addScalar(1)
        parameters.maxCells = parameters.cellDimensions.toArray().reduce((count, dimension) => count + dimension, -2)
        parameters.maxBlocks = parameters.blockDimensions.toArray().reduce((count, dimension) => count + dimension, -2)
        parameters.maxCellsPerBlock = stride * 3 - 2

        // min/max bounding box positions in voxel grid space
        parameters.minPosition = parameters.minBlockCoords.clone().addScalar(0).multiplyScalar(stride).subScalar(0.5)
        parameters.maxPosition = parameters.maxBlockCoords.clone().addScalar(1).multiplyScalar(stride).subScalar(0.5)

        this.computes.boundingBox.parameters = parameters
        console.timeEnd('generateBoundingBox') 
        // console.log(this.computes.boundingBox.parameters)
    }

    async generateDistanceMap(maxIters)
    {
        console.time('generateDistanceMap') 
        const distanceMap = await this.computeDistanceMap(this.computes.occupancyMap.tensor, 50)
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

    async generateDistance3Map(maxIters)
    {
        console.time('generateDistance3Map') 
        const distance3Map = await this.computeDistance3Map(this.computes.occupancyMap.tensor, 50)
        const parameters = {...this.computes.occupancyMap.parameters}

        this.computes.distance3Map.tensor = distance3Map
        this.computes.distance3Map.parameters = parameters
        console.timeEnd('generateDistance3Map') 
        // console.log(this.computes.distance3Map.parameters)
        console.log(this.computes.distance3Map.tensor.dataSync())
    }

    // Helpers

    async computeOccupancyMap(intensityMap, threshold, blockSize) 
    {
        return tf.tidy(() =>
        {
            // Prepare strides and size for pooling operations
            const shape = intensityMap.shape
            const strides = [blockSize, blockSize, blockSize]
            const filterSize = [blockSize + 1, blockSize + 1, blockSize + 1]
    
            // Compute shape in order to be appropriate for valid pool operations
            const numBlocks = shape.map((dimension) => Math.ceil((dimension - 1) / blockSize))
            const newShape = numBlocks.map((blockCount) => blockCount * blockSize + 1)
    
            // Calculate necessary padding for valid subdivisions and boundary handling
            const padding = shape.map((dimension, i) => [1, newShape[i] - dimension - 1])
            padding[3] = [0, 0]
            const padded = tf.pad(intensityMap, padding) 

            // Compute if voxel values is above/bellow  threshold
            const isBellow = tf.lessEqual(padded, threshold)
            const isAbove = tf.greaterEqual(padded, threshold)
    
            // Compute if cell has values above/bellow threshold
            const hasAbove = tf.maxPool3d(isAbove, filterSize, strides, 'valid')
            const hasBellow = tf.maxPool3d(isBellow, filterSize, strides, 'valid')
    
            // Compute cell occupation if above and bellow values from threshold
            const occupancyMap = tf.logicalAnd(hasAbove, hasBellow)
            return occupancyMap
        })
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

            // Compute mix/max bounding box coords
            const minCoords = [zMin, yMin, xMin]
            const maxCoords = [zMax, yMax, xMax]
    
            return { minCoords, maxCoords }
        })
    }

    async computeDistanceMap(occupancyMap, maxDistance) 
    {
        return tf.tidy(() => 
        {
            // Initialize the frontier (occupied voxels) and the distance tensor
            let distances = tf.where(occupancyMap, 0, maxDistance)
            let frontier  = tf.cast(occupancyMap, 'bool')
            
            for (let distance = 1; distance < maxDistance; distance++) 
            {   
                // Compute the new frontier by expanding frontier regions
                const newFrontier = tf.maxPool3d(frontier, [3, 3, 3], [1, 1, 1], 'same')
                                
                // Identify the newly occupied voxel wavefront
                const wavefront = tf.notEqual(newFrontier, frontier)

                // Compute and add distances for the newly occupied voxels at this step
                const newDistances = tf.where(wavefront, distance, distances)

                // Dispose old tensors 
                tf.dispose([distances, frontier, wavefront])

                // Update new tensors for the next iteration
                distances = newDistances
                frontier = newFrontier
            }

            return distances
        })
    }

    
    async computeDistance3Map(occupancyMap, maxDistance) 
    {
        const distancesX = tf.tidy(() => 
        {
            // Compute an x-axis aligned kernel cone
            let filter = tf.tensor([1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], [3, 3, 3, 1, 1], 'float32')
            
            // Initialize the frontier and  distance tensors
            let distances = tf.where(occupancyMap, 0, 1)
            let frontier  = tf.cast(occupancyMap, 'bool')
    
            for (let distance = 1; distance <= maxDistance; distance++) 
            {   
                // Expand frontier with a x-axis aligned kernel cone
                const expansion = tf.conv3d(frontier, filter, [1, 1, 1], 'same')
                const newFrontier = expansion.cast('bool')
    
                // Identify the non visited backline cells
                const wavefront = tf.notEqual(newFrontier, frontier)
    
                // Update all backline cells with current distance
                const newDistances = tf.where(wavefront, distance, distances)
    
                // Dispose old tensors 
                tf.dispose([distances, frontier, expansion, wavefront])
    
                // Update new tensors for the next iteration
                distances = newDistances
                frontier = newFrontier
            }
    
            return distances
        })
    
        const distancesY = tf.tidy(() => 
        {
            // Compute an y-axis aligned kernel cone
            let filter = tf.tensor([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1], [3, 3, 3, 1, 1], 'float32') 
    
            // Initialize the frontier and  distance tensors
            let distances = tf.where(occupancyMap, 0, 1)
            let frontier  = tf.cast(occupancyMap, 'bool')
    
            for (let distance = 1; distance <= maxDistance; distance++) 
            {   
                // Expand frontier with a y-axis aligned kernel cone
                const expansion = tf.conv3d(frontier, filter, [1, 1, 1], 'same')
                const newFrontier = expansion.cast('bool')
    
                // Identify the non visited backline cells
                const wavefront = tf.notEqual(newFrontier, frontier)
    
                // Update all backline cells with current distance
                const newDistances = tf.where(wavefront, distance, distances)
    
                // Dispose old tensors 
                tf.dispose([distances, frontier, expansion, wavefront])
    
                // Update new tensors for the next iteration
                distances = newDistances
                frontier = newFrontier
            }
    
            return distances
        })
    
        const distancesZ = tf.tidy(() => 
        {
            // Compute an z-axis aligned kernel cone
            let filter = tf.tensor([1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], [3, 3, 3, 1, 1], 'float32')
    
            // Initialize the frontier and  distance tensors
            let distances = tf.where(occupancyMap, 0, 1)
            let frontier  = tf.cast(occupancyMap, 'bool')
    
            for (let distance = 1; distance <= maxDistance; distance++) 
            {   
                // Expand frontier with a z-axis aligned kernel cone
                const expansion = tf.conv3d(frontier, filter, [1, 1, 1], 'same')
                const newFrontier = expansion.cast('bool')
    
                // Identify the non visited backline cells
                const wavefront = tf.notEqual(newFrontier, frontier)
    
                // Update all backline cells with current distance
                const newDistances = tf.where(wavefront, distance, distances)
    
                // Dispose old tensors 
                tf.dispose([distances, frontier, expansion, wavefront])
    
                // Update new tensors for the next iteration
                distances = newDistances
                frontier = newFrontier
            }
    
            return distances
        })
    
        // Combine axial distance maps
        // we need an extra channel to use RGBAIntegerFormat
        const distances = tf.concat([distancesZ, distancesY, distancesX, distancesX], 3)
        tf.dispose([[distancesX, distancesY, distancesZ]])
    
        return distances
    }

    async computeDistanceMapFromSlice(occupancyMap, maxDistance, begin, sliceSize)
    {
        const shape = occupancyMap.shape
        const paddings = shape.map((dimension, i) => [begin[i], dimension - begin[i] - sliceSize[i]])
    
        // Compute distance map over slice and pad result back to the original size
        const occupancyMapSlice = tf.slice4d(occupancyMap, begin, sliceSize)
        const distanceMapSlice = await computeDistanceMap(occupancyMapSlice, maxDistance)
        const distanceMap = tf.pad4d(distanceMapSlice, paddings, 1)
    
        tf.dispose([distanceMapSlice, occupancyMapSlice])
    
        return distanceMap
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