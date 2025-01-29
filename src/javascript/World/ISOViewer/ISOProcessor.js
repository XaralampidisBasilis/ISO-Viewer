import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../../Utils/EventEmitter'

const timeit = (name, callback) => 
{ 
    // console.time(name) 
    callback()
    // console.timeEnd(name) 
}

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
        timeit('setVolume', () =>
        {
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
        })
    }

    destroy() 
    {
        for (const key of Object.keys(this.computes)) 
        {
            const computes = this.computes[key]
            if (!computes) continue

            if (computes.tensor instanceof tf.Tensor) 
            {
                computes.tensor.dispose()
                computes.tensor = null
            }

            // If it has a Data3DTexture, dispose it
            if (computes.texture instanceof THREE.Data3DTexture) 
            {
                computes.texture.dispose()
                computes.texture = null
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

    async computeIntensityMap()
    {
        if (this.computes.intensityMap.tensor instanceof tf.Tensor) 
        {
            this.computes.intensityMap.tensor.dispose()
        }

        timeit('computeIntensityMap', () =>
        {
            this.computes.intensityMap.tensor = tf.tensor4d(this.volume.data, this.volume.parameters.shape,'float32')                
            this.computes.intensityMap.parameters = {...this.volume.parameters}
        })

        // console.log(this.computes.intensityMap.parameters, /*this.computes.intensityMap.tensor.dataSync()*/)
    }

    async computeOccupancyMap(threshold, subDivision)
    {
        if (!(this.computes.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeOccupancyMap: intensityMap is not computed`)
        }

        if (this.computes.occupancyMap.tensor instanceof tf.Tensor) 
        {
            this.computes.occupancyMap.tensor.dispose()
        }

        timeit('computeOccupancyMap', () =>
        {
            const occupancyMap = this._computeOccupancyMap(this.computes.intensityMap.tensor, threshold, subDivision)
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
        })

        // console.log(this.computes.occupancyMap.parameters, /*this.computes.occupancyMap.tensor.dataSync()*/)
    }

    async computeDistanceMap(maxIters)
    {
        if (!(this.computes.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeDistanceMap: occupancyMap is not computed`)
        }

        if (this.computes.distanceMap.tensor instanceof tf.Tensor) 
        {
            this.computes.distanceMap.tensor.dispose()
        }
       
        timeit('computeDistanceMap', () =>
        {
            const distanceMap = this._computeDistanceMap(this.computes.occupancyMap.tensor, maxIters)
            const parameters = {...this.computes.occupancyMap.parameters}
            
            const maxTensor = distanceMap.max()
            parameters.maxDistance = maxTensor.arraySync()  
            maxTensor.dispose()

            this.computes.distanceMap.tensor = distanceMap
            this.computes.distanceMap.parameters = parameters
        })

        // console.log(this.computes.distanceMap.parameters, /*this.computes.distanceMap.tensor.dataSync()*/)
    }

    async computeBoundingBox()
    {
        if (!(this.computes.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeBoundingBox: occupancyMap is not computed`)
        }

        timeit('computeBoundingBox', () =>
        {
            const boundingBox = this._computeBoundingBox(this.computes.occupancyMap.tensor)
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
        })

        // console.log(this.computes.boundingBox.parameters)
    }
    
    // Helpers
    
    _computeOccupancyMap(intensityMap, threshold, subDivision) 
    {
        // Scalars for threshold and output scaling
        const scalarThreshold = tf.scalar(threshold, 'float32')
        const scalar255 = tf.scalar(255, 'int32')

        // Symmetric padding to handle boundaries
        const tensorPadded = tf.mirrorPad(intensityMap, [[1, 1], [1, 1], [1, 1], [0, 0]], 'symmetric')

        // Min pooling for lower bound detection
        const minima = this._minPool3d(tensorPadded, [2, 2, 2], [1, 1, 1], 'valid')
        const lesser = tf.lessEqual(minima, scalarThreshold)
        minima.dispose()

        // Max pooling for upper bound detection
        const maxima = tf.maxPool3d(tensorPadded, [2, 2, 2], [1, 1, 1], 'valid')
        tensorPadded.dispose()
        const greater = tf.greaterEqual(maxima, scalarThreshold)
        scalarThreshold.dispose()
        maxima.dispose()

        // Logical AND to find isosurface occupied regions
        const occupied = tf.logicalAnd(lesser, greater)
        lesser.dispose()
        greater.dispose()

        // If no subdivision is needed, scale and return
        if (subDivision === 1) 
        {        
            const occupancyMap255 = occupied.mul(scalar255)
            occupied.dispose()
            return occupancyMap255
        }

        // Calculate necessary padding for valid subdivisions
        const padAmounts = occupied.shape.map((dim, i) => {
            const paddedDim = i < 3 ? Math.ceil(dim / subDivision) * subDivision : dim // Only pad spatial dimensions
            return [0, paddedDim - dim]
        })

        // Apply padding
        const occupiedPadded = tf.pad(occupied, padAmounts)
        occupied.dispose()

        // Apply max pooling with valid padding and subdivision
        const subDivisions = [subDivision, subDivision, subDivision]
        const occupancyMap = tf.maxPool3d(occupiedPadded, subDivisions, subDivisions, 'valid')
        occupiedPadded.dispose()

        // Scale the result and return
        const occupancyMap255 = occupancyMap.mul(scalar255)
        occupancyMap.dispose()
        scalar255.dispose()

        return occupancyMap255
    }

    _computeDistanceMap(occupancyMap, maxIters) 
    {
        // Initialize next diffusion
        let diffusionNext = occupancyMap.cast('bool')

        // Initialize previous diffusion
        let diffusionPrev = tf.zeros(occupancyMap.shape, 'bool')

        // Initialize distance map 
        let distanceMap = tf.zeros(occupancyMap.shape, 'int32')

        for (let iter = 0; iter <= maxIters; iter++) 
        {
            const scalarIter = tf.scalar(iter, 'int32')

            // Compute distance update
            const diffusionUpdate = tf.notEqual(diffusionNext, diffusionPrev)
            const distanceUpdate = diffusionUpdate.mul(scalarIter)
            diffusionUpdate.dispose()
            scalarIter.dispose()

            // Update distance map
            const distanceMapTemp = distanceMap.add(distanceUpdate)
            distanceUpdate.dispose()
            distanceMap.dispose()
            distanceMap = distanceMapTemp

            // Update previous diffusion 
            diffusionPrev.dispose()
            diffusionPrev = diffusionNext.clone()

            // Compute next diffusion with max pooling
            const diffusionNextTemp = tf.maxPool3d(diffusionPrev, [3, 3, 3], [1, 1, 1], 'same')
            diffusionNext.dispose()
            diffusionNext = diffusionNextTemp
        }
        diffusionNext.dispose()

        // Compute final distance update
        const scalarMaxIters = tf.scalar(maxIters, 'int32')
        const diffusionUpdate = tf.logicalNot(diffusionPrev)
        diffusionPrev.dispose()
        const distanceUpdate = diffusionUpdate.mul(scalarMaxIters)
        diffusionUpdate.dispose()
        scalarMaxIters.dispose()

        // Update final distance map
        const distanceMapTemp = distanceMap.add(distanceUpdate)
        distanceUpdate.dispose()
        distanceMap.dispose()
        distanceMap = distanceMapTemp

        // Return the final distance map
        return distanceMap
    }

    _computeBoundingBox(occupancyMap) 
    {
        const occupancyMapBool = occupancyMap.cast('bool')

        // Compute the bounds for each axis dynamically
        const rank = occupancyMapBool.rank
        const boundingIntervals = Array.from({ length: rank }, (_, axis) => this._argBounds(occupancyMapBool, axis))
        occupancyMapBool.dispose()

        // Separate min and max bounds
        const minCoords = tf.stack(boundingIntervals.map(interval => interval[0]), 0)
        const maxCoords = tf.stack(boundingIntervals.map(interval => interval[1]), 0)
        tf.dispose(boundingIntervals)

        // Convert tensors to arrays
        const minCoordsArray = minCoords.arraySync().slice(0, 3).toReversed()
        const maxCoordsArray = maxCoords.arraySync().slice(0, 3).toReversed()
        minCoords.dispose()
        maxCoords.dispose()

        return { minCoords: minCoordsArray, maxCoords: maxCoordsArray}
    
    }

    _minPool3d(tensor4d, filterSize, strides, pad)
    {
        const scalarNegativeOne = tf.scalar(-1, 'float32')
        const negative = tensor4d.mul(scalarNegativeOne)
        const negMaxPool = tf.maxPool3d(negative, filterSize, strides, pad)
        negative.dispose()
        const tensorMinPool = negMaxPool.mul(scalarNegativeOne)
        negMaxPool.dispose()
        scalarNegativeOne.dispose()
        return tensorMinPool
    } 

    _argBounds(occupancyMapBool, axis) 
    {
        // Check input is boolean
        if (occupancyMapBool.dtype !== "bool") {
            throw new Error('Input tensor must be of type bool');
        }
        
        // Scalar tensors
        const scalarOne = tf.scalar(1, 'int32')

        // Create a list of all axes and remove the target axis
        const axes = [...Array(occupancyMapBool.rank).keys()].filter((x) => x !== axis)
        
        // Compute the collapsed view along the specified axis
        const collapsed = occupancyMapBool.any(axes) 
        
        // Find the first non-zero index (minInd)
        const minIndTemp = collapsed.argMax(0) // First True from the left
        
        // Find the last non-zero index (maxInd)
        const reversed = collapsed.reverse()
        const reversedArgMax = reversed.argMax()
        reversed.dispose()
        const maxIndTemp2 = tf.sub(occupancyMapBool.shape[axis], reversedArgMax)
        reversedArgMax.dispose()
        const maxIndTemp = maxIndTemp2.sub(scalarOne) // First True from the right
        maxIndTemp2.dispose()
        scalarOne.dispose()

        // Check if there are any true values in the collapsed tensor
        const isNonSingular = tf.any(collapsed)
        collapsed.dispose()

        // If collapsed is singular return zero indices
        const minInd = minIndTemp.mul(isNonSingular) // min indices are included 
        const maxInd = maxIndTemp.mul(isNonSingular) // max indices are included 
        minIndTemp.dispose()
        maxIndTemp.dispose()
        isNonSingular.dispose()

        // Return the bounds
        return [minInd, maxInd] 
    }

    _quantize(tensor4d) 
    {
        return tf.tidy(() => 
        {
            // Tensor must be normalized in [0, 1]
            // Scale to the specified quantization levels
            const scaled = tensor4d.mul(tf.scalar(255))
            tensor4d.dispose()
    
            // Clip values to the range [0, levels]
            const clipped = scaled.clipByValue(0, 255)
            scaled.dispose()
    
            // Round and cast to integer type
            const rounded = clipped.round()
            clipped.dispose()
            const quantized = rounded.cast('int32')
            rounded.dispose()
    
            // Return the quantized tensor
            return quantized
        })
    }

}