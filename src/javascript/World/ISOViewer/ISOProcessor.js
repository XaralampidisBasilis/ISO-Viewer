import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import EventEmitter from '../../Utils/EventEmitter'
import { cos } from 'mathjs'

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

    async computeOccupancyMap(intensityMap, threshold, division) 
    {
        // Scalars for threshold and output scaling
        const scalarThreshold = tf.scalar(threshold, 'float32')
        const strides = [division, division, division]
        const spacing = strides.map(x => x + 1)

        // Calculate necessary padding for valid subdivisions and boundary handling
        const divisible = intensityMap.shape
            .map((dimension, i) => Math.ceil((dimension - spacing[i]) / strides[i]))
            .map((dimension, i) => dimension * strides[i] + spacing[i])
        const padding = intensityMap.shape.map((dimension, i) => [1, divisible[i] - dimension - 1])
        padding[3] = [0, 0]

        // Symmetric padding to handle boundaries by adding zeros
        const padded = tf.mirrorPad(intensityMap, padding, 'symmetric')

        // Min pooling for lower bound detection
        const minPool = this.minPool3d(padded, spacing, strides, 'valid')
        const isAbove = tf.greaterEqual(scalarThreshold, minPool)
        tf.dispose(minPool)
        await tf.nextFrame()

        // Max pooling for upper bound detection
        const maxPool = tf.maxPool3d(padded, spacing, strides, 'valid')
        const isBellow = tf.lessEqual(scalarThreshold, maxPool)
        tf.dispose(maxPool)
        await tf.nextFrame()

        tf.dispose([padded, scalarThreshold])
        await tf.nextFrame()

        // Logical AND to find isosurface occupied blocks
        const occupancyMap = tf.logicalAnd(isAbove, isBellow)
        tf.dispose([isAbove, isBellow])
        await tf.nextFrame()

        return occupancyMap
    }

    async computeDistanceMap(occupancyMap, maxIters) 
    {
        console.log(tf.memory().numTensors)

        // Initialize distance map and previous/next diffusion
        let distanceMap   = tf.variable(tf.zeros(occupancyMap.shape, 'int32'), true)
        let diffusionPrev = tf.variable(tf.zeros(occupancyMap.shape, 'bool'), true)
        let diffusionNext = tf.variable(tf.clone(occupancyMap), true)

        for (let i = 0; i <= maxIters; i++) 
        {
            // Compute distance update
            const scalarIter = tf.scalar(i, 'int32')
            const diffusionUpdate = tf.notEqual(diffusionNext, diffusionPrev)
            const distanceUpdate = diffusionUpdate.mul(scalarIter)

            // Update distance map
            const distanceMapUpdate = distanceMap.add(distanceUpdate)
            distanceMap.assign(distanceMapUpdate)

            // Update previous diffusion state
            diffusionPrev.assign(diffusionNext)

            // Compute next diffusion with max pooling
            const diffusionNextUpdate = tf.maxPool3d(diffusionPrev, [3, 3, 3], [1, 1, 1], 'same')
            diffusionNext.assign(diffusionNextUpdate)

            // Await for garbage disposal
            tf.dispose([diffusionNextUpdate, distanceMapUpdate, distanceUpdate, diffusionUpdate, scalarIter])
            await tf.nextFrame()

            console.log(tf.memory().numTensors)
        }

        // Compute final distance update
        const scalarMax = tf.scalar(maxIters, 'int32')
        const diffusionUpdate = tf.logicalNot(diffusionPrev)
        const distanceUpdate = diffusionUpdate.mul(scalarMax)

        // Update final distance map
        distanceMap = distanceMap.add(distanceUpdate)

        // Cleanup
        tf.disposeVariables()
        tf.dispose([distanceUpdate, diffusionUpdate, scalarMax])
        await tf.nextFrame()
        console.log(tf.memory().numTensors)

        // Return the final distance map
        return distanceMap
    }

    async computeBoundingBox(occupancyMap) 
    {
        const coords = []
        const collapsedX = occupancyMap.any([1, 2, 3]) 
        coords[2] = await this.trueBounds(collapsedX)
        tf.dispose(collapsedX)
        await tf.nextFrame()

        const collapsedYZ = occupancyMap.any([0, 3]) 
        const collapsedY = collapsedYZ.any(1) 
        coords[1] = await this.trueBounds(collapsedY)
        tf.dispose(collapsedY)
        await tf.nextFrame()

        const collapsedZ = collapsedYZ.any(0) 
        coords[0] = await this.trueBounds(collapsedZ)
        tf.dispose([collapsedZ, collapsedYZ])
        await tf.nextFrame()

        const minCoords = [coords[0][0], coords[1][0], coords[2][0]]
        const maxCoords = [coords[0][1], coords[1][1], coords[2][1]]

        return { minCoords, maxCoords }
    
    }

    async trueBounds(condition)
    {
        const coords = await tf.whereAsync(condition)
        const indices = coords.arraySync().flat()
        tf.dispose(coords)

        if (indices.length)
        {
            return [indices[0], indices[indices.length - 1]]
        }
        else
        {
            return [0, 0]
        }
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

    quantize(tensor4d) 
    {
        return tf.tidy(() => 
        {
            // Tensor must be normalized in [0, 1]
            // Scale to the specified quantization levels
            const scaled = tensor4d.mul(tf.scalar(255))
            tf.dispose(tensor4d)
    
            // Clip values to the range [0, levels]
            const clipped = scaled.clipByValue(0, 255)
            tf.dispose(scaled)
    
            // Round and cast to integer type
            const rounded = clipped.round()
            tf.dispose(clipped)
            const quantized = rounded.cast('int32')
            tf.dispose(rounded)
    
            // Return the quantized tensor
            return quantized
        })
    }

}