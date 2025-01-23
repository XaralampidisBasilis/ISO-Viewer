import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TensorUtils from '../../Computes/TensorUtils'

const timeit = (name, callback) => { console.time(name), callback(), console.timeEnd(name) }

export default class ISOProcessor
{
    constructor(volume)
    {
        this.volume = volume
        this.setObjects()
        this.setParameters()
    }

    setObjects()
    {
        this.intensityMap = { parameters: null, tensor: null, texture: null}
        this.occupancyMap = { parameters: null, tensor: null, texture: null}
        this.distanceMap  = { parameters: null, tensor: null, texture: null}
        this.boundingBox  = { parameters: null, tensor: null, texture: null}
    }

    setParameters()
    {
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
    }

    async generateIntensityMap()
    {
        timeit('generateIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.parameters] = tf.tidy(() =>
            {
                const data = new Float32Array(this.volume.data)
                const tensor  = tf.tensor4d(data, this.volume.parameters.shape,'float32')
                const parameters = {...this.volume.parameters}

                return [tensor, parameters]
            })            
        })

        console.log('intensityMap', this.intensityMap.parameters, this.intensityMap.tensor.dataSync())
    }

    async generateOccupancyMap(threshold = 0, subDivision = 4)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`generateOccupancyMap: intensityMap is not generated`)
        }

        timeit('generateOccupancyMap', () =>
        {
            [this.occupancyMap.tensor, this.occupancyMap.parameters] = tf.tidy(() => 
            {
                const tensor = this.computeOccupancyMap(this.intensityMap.tensor, threshold, subDivision)
                const parameters = 
                {
                    shape : tensor.shape,
                    threshold : threshold,
                    subDivision : subDivision,
                    invSubDivision : 1/subDivision,
                    dimensions : new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed()),
                    spacing : new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(subDivision),
                    size : new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing),
                    numBlocks : parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1),
                    invDimensions : new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x)),
                    invSpacing : new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x)),
                    invSize : new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x)),
                }

                return [tensor, parameters]
            })
        })

        console.log('occupancyMap', this.occupancyMap.parameters, this.occupancyMap.tensor.dataSync())
    }

    async generateDistanceMap(maxIters = 255)
    {
        if (!(this.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`generateDistanceMap: occupancyMap is not generated`)
        }
       
        timeit('generateDistanceMap', () =>
        {
            [this.distanceMap.tensor, this.distanceMap.parameters] = tf.tidy(() =>
            {
                const tensor = TensorUtils.isosurfaceDistanceDualMap(this.intensityMap.tensor, threshold, subDivision, maxIters)
                const parameters = 
                {
                    threshold : threshold,
                    subDivision : subDivision,
                    shape : tensor.shape,
                    maxDistance : tensor.max().arraySync(),
                    dimensions : new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed()),
                    spacing : new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(parameters.subDivision),
                    size : new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing),
                    numBlocks : parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1),
                    invSubDivision : 1/subDivision,
                    invDimensions : new THREE.Vector3().fromArray(parameters.dimensions.toArray().map(x => 1/x)),
                    invSpacing : new THREE.Vector3().fromArray(parameters.spacing.toArray().map(x => 1/x)),
                    invSize : new THREE.Vector3().fromArray(parameters.size.toArray().map(x => 1/x)),
                }
                
                return [tensor, parameters]
            })
        })

        console.log('distanceMap', this.distanceMap.parameters, this.distanceMap.tensor.dataSync())
    }

    async generateBoundingBox()
    {
        if (!(this.occupancyMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`generateBoundingBox: occupancyMap is not generated`)
        }

        timeit('generateBoundingBox', () =>
        {
            this.boundingBox.parameters = tf.tidy(() =>
            {
                const boundingBox = TensorUtils.isosurfaceBoundingBoxDualMap(this.intensityMap.tensor, threshold)
                const parameters = {}
                parameters.threshold = threshold
                parameters.minCoords = new THREE.Vector3().fromArray(boundingBox.minCoords)
                parameters.maxCoords = new THREE.Vector3().fromArray(boundingBox.maxCoords)
                parameters.minPosition = new THREE.Vector3().fromArray(boundingBox.minCoords).subScalar(0.5).multiply(this.volume.parameters.spacing)
                parameters.maxPosition = new THREE.Vector3().fromArray(boundingBox.maxCoords).addScalar(0.5).multiply(this.volume.parameters.spacing)
                
                return parameters
            })          
        })

        console.log('boundingBox', this.boundingBox.parameters)
    }

    async normalizeIntensityMap()
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`normalizeIntensityMap: intensityMap is not generated`)
        }

        timeit('normalizeIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.parameters] = tf.tidy(() =>
            {
                const [tensor, minValue, maxValue] = TensorUtils.normalize3d(this.intensityMap.tensor) 
                this.intensityMap.tensor.dispose()

                const parameters =  {...this.intensityMap.parameters}
                parameters.minValue = minValue[0]
                parameters.maxValue = maxValue[0]  

                return [tensor, parameters]
            })
        })

        console.log('normalizedIntensityMap', this.intensityMap.parameters, this.intensityMap.tensor.dataSync())
    }

    async downscaleIntensityMap(scale = 2)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`downscaleIntensityMap: intensityMap is not generated`)
        }

        timeit('downscaleIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.parameters] = tf.tidy(() =>
            {
                const tensor = TensorUtils.downscale3d(this.intensityMap.tensor, scale)
                this.intensityMap.tensor.dispose()

                const parameters =  {...this.intensityMap.parameters}
                parameters.downScale = scale
                parameters.dimensions = new THREE.Vector3().fromArray(this.intensityMap.tensor.shape.slice(0, 3).toReversed())
                parameters.spacing = new THREE.Vector3().copy(this.volume.parameters.spacing).multiplyScalar(scale)
                parameters.size = new THREE.Vector3().copy(parameters.dimensions).multiply(parameters.spacing)
                parameters.numBlocks = parameters.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
                parameters.shape = this.intensityMap.tensor.shape

                return [tensor, parameters]
            })
        })

        console.log('downscaledIntensityMap', this.intensityMap.parameters, this.intensityMap.tensor.dataSync())
    }

    async quantizeIntensityMap()
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`quantizeIntensityMap: intensityMap is not generated`)
        }

        timeit('quantizeIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.parameters] = tf.tidy(() =>
            {
                const [tensor, minValue, maxValue] = TensorUtils.quantize3d(this.intensityMap.tensor) 
                this.intensityMap.tensor.dispose()

                const parameters =  {...this.intensityMap.parameters}
                parameters.minValue = minValue
                parameters.maxValue = maxValue  

                return [tensor, parameters]
            })            
        })

        console.log('quantizedIntensityMap', this.intensityMap.parameters, this.intensityMap.tensor.dataSync())
    }

    generateTexture(key, format, type) 
    {
        if (!(this[key].tensor instanceof tf.Tensor)) 
        {
            throw new Error(`${key} is not generated`)
        }

        if (this[key].texture instanceof THREE.Data3DTexture) 
        {
            this[key].texture.dispose()
        }

        timeit(`generateTexture(${key})`, () =>
        {
            let dimensions = this[key].parameters.dimensions.toArray()
            let array

            switch (type) 
            {
                case THREE.FloatType:
                    array = new Float32Array(this[key].tensor.dataSync())
                    break
                case THREE.UnsignedByteType:
                    array = new Uint8Array(this[key].tensor.dataSync())
                    break
                case THREE.UnsignedShortType:
                    array = new Uint16Array(this[key].tensor.dataSync())
                    break
                case THREE.ByteType:
                    array = new Int8Array(this[key].tensor.dataSync())
                    break
                case THREE.ShortType:
                    array = new Int16Array(this[key].tensor.dataSync())
                    break
                case THREE.IntType:
                    array = new Int32Array(this[key].tensor.dataSync())
                    break
                default:
                    throw new Error(`Unsupported type: ${type}`)
            }

            this[key].texture = new THREE.Data3DTexture(array, ...dimensions)
            this[key].texture.format = format
            this[key].texture.type = type
            this[key].texture.minFilter = THREE.LinearFilter
            this[key].texture.magFilter = THREE.LinearFilter
            this[key].texture.generateMipmaps = false
            this[key].texture.needsUpdate = true
        })

        return this[key].texture
    }
    
    destroy() 
    {
        Object.keys(this).forEach(key => 
        {
            // console.log(this[key])

            if (this[key]?.tensor instanceof tf.Tensor) 
            {
                this[key].tensor.dispose()
                this[key].tensor = null
            }

            if (this[key]?.texture instanceof THREE.Data3DTexture) 
            {
                this[key].texture.dispose()
                this[key].texture = null
            }
        
            if (this[key]?.parameters) 
            {
                delete this[key].parameters
            }

            if (this[key])
            {
                this[key] = null
            }
        })

        this.volume = null;
    
        console.log("ISOProcessor destroyed.");
    }

    // Helpers

    boundingInterval(occupancy, axis) 
    {
        return tf.tidy(() => 
        {
            // Check input is boolean
            if (occupancy.dtype !== "bool") {
                throw new Error('Input tensor must be of type bool');
            }
            
            // Scalar tensors
            const scalarOne = tf.scalar(1, 'int32')
    
            // Create a list of all axes and remove the target axis
            const axes = [...Array(occupancy.rank).keys()].filter((x) => x !== axis)
            
            // Compute the collapsed view along the specified axis
            const collapsed = occupancy.any(axes) 
            
            // Find the first non-zero index (minInd)
            const minIndTemp = collapsed.argMax(0) // First True from the left
            
            // Find the last non-zero index (maxInd)
            const reversed = collapsed.reverse()
            const maxIndTemp = tf.sub(occupancy.shape[axis], reversed.argMax()).sub(scalarOne) // First True from the right
            
            // Check if there are any true values in the collapsed tensor
            const isNonSingular = tf.any(collapsed)
    
            // If collapsed is singular return zero indices
            const minInd = minIndTemp.mul(isNonSingular) // min indices are included 
            const maxInd = maxIndTemp.mul(isNonSingular) // max indices are included 
    
            // Return the bounds
            return [minInd, maxInd] 
        })
    }
     
    minPool3d(tensor4d, filterSize, strides, pad)
    {
        return tf.tidy(() =>
        {
            const scalarNegativeOne = tf.scalar(-1, 'float32')
            const negative = tensor4d.mul(scalarNegativeOne)
            const negMaxPool = tf.maxPool3d(negative, filterSize, strides, pad)
            negative.dispose()
            const tensorMinPool = negMaxPool.mul(scalarNegativeOne)
            negMaxPool.dispose()
            return tensorMinPool
        })
    } 

    computeOccupancyMap(intensityMap, threshold, subDivision) 
    {
        return tf.tidy(() => 
        {
            // Scalars for threshold and output scaling
            const scalarThreshold = tf.scalar(threshold, 'float32')
            const scalar255 = tf.scalar(255, 'int32')
    
            // Symmetric padding to handle boundaries
            const tensorPadded = tf.mirrorPad(intensityMap, [[1, 1], [1, 1], [1, 1], [0, 0]], 'symmetric')
    
            // Min pooling for lower bound detection
            const minima = this.minPool3d(tensorPadded, [2, 2, 2], [1, 1, 1], 'valid')
            const lesser = tf.lessEqual(minima, scalarThreshold)
            minima.dispose()
    
            // Max pooling for upper bound detection
            const maxima = tf.maxPool3d(tensorPadded, [2, 2, 2], [1, 1, 1], 'valid')
            const greater = tf.greaterEqual(maxima, scalarThreshold)
            maxima.dispose()
    
            // Logical AND to find isosurface occupied regions
            const occupied = tf.logicalAnd(lesser, greater)
            lesser.dispose()
            greater.dispose()
    
            // If no subdivision is needed, scale and return
            if (subDivision === 1) {
                return occupied.mul(scalar255)
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
    
            return occupancyMap255
        })
    }

    computeDistanceMap(occupancyMap, maxIters = 255) 
    {
        return tf.tidy(() => 
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
            const scalarMaxIters = tf.scalar(maxIters, 'int32')
    
            // Compute final distance update
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
        })
    }

    computeBoundingBox(occupancyMap) 
    {
        return tf.tidy(() => 
        {
            // Compute the bounds for each axis dynamically
            const rank = occupancyMap.rank
            const boundingIntervals = Array.from({ length: rank }, (_, axis) => boundingInterval(occupancyMap, axis))
    
            // Separate min and max bounds
            const minCoords = tf.stack(boundingIntervals.map(interval => interval[0]), 0)
            const maxCoords = tf.stack(boundingIntervals.map(interval => interval[1]), 0)
    
            // Convert tensors to arrays
            const minCoordsArray = minCoords.arraySync().slice(0, 3).toReversed()
            const maxCoordsArray = maxCoords.arraySync().slice(0, 3).toReversed()
    
            return { minCoords: minCoordsArray, maxCoords: maxCoordsArray}
        })
    }
}