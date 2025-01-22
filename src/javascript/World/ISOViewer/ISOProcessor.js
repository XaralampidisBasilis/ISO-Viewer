import * as THREE from 'three'
import * as tf from '@tensorflow/tfjs'
import * as TensorUtils from './TensorUtils'
import { timeit } from './timeit'


export default class ISOProcessor 
{
    constructor(volume)
    {
        this.volume = volume
        this.setObjects()
        this.setVolumeParameters()
    }

    setObjects()
    {
        this.intensityMap = { params: null, tensor: null, texture: null}
        this.occupancyMap = { params: null, tensor: null, texture: null}
        this.distanceMap  = { params: null, tensor: null, texture: null}
        this.boundingBox  = { params: null, tensor: null, texture: null}
    }

    setVolumeParameters()
    {
        this.volume.params = 
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

    // Intensity Map

    async computeIntensityMap()
    {
        timeit('computeIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.params] = tf.tidy(() =>
            {
                const tensor  = tf.tensor4d(this.volume.getData(), this.volume.params.shape,'float32')
                const params = {...this.volume.params}

                return [tensor, params]
            })            
        })

        // console.log('intensityMap', this.intensityMap.params, this.intensityMap.tensor.dataSync())
    }

    async normalizeIntensityMap()
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`normalizeIntensityMap: intensityMap is not computed`)
        }

        timeit('normalizeIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.params] = tf.tidy(() =>
            {
                const [tensor, minValue, maxValue] = TensorUtils.normalize3d(this.intensityMap.tensor) 
                this.intensityMap.tensor.dispose()

                const params =  {...this.intensityMap.params}
                params.minValue = minValue[0]
                params.maxValue = maxValue[0]  

                return [tensor, params]
            })
        })

        // console.log('normalizedIntensityMap', this.intensityMap.params, this.intensityMap.tensor.dataSync())
    }

    async downscaleIntensityMap(scale = 2)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`downscaleIntensityMap: intensityMap is not computed`)
        }

        timeit('downscaleIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.params] = tf.tidy(() =>
            {
                const tensor = TensorUtils.downscale3d(this.intensityMap.tensor, scale)
                this.intensityMap.tensor.dispose()

                const params =  {...this.intensityMap.params}
                params.downScale = scale
                params.dimensions = new THREE.Vector3().fromArray(this.intensityMap.tensor.shape.slice(0, 3).toReversed())
                params.spacing = new THREE.Vector3().copy(this.volume.params.spacing).multiplyScalar(scale)
                params.size = new THREE.Vector3().copy(params.dimensions).multiply(params.spacing)
                params.numBlocks = params.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
                params.shape = this.intensityMap.tensor.shape

                return [tensor, params]
            })
        })

        // console.log('downscaledIntensityMap', this.intensityMap.params, this.intensityMap.tensor.dataSync())
    }

    async smoothIntensityMap(radius = 1)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`smoothIntensityMap: intensityMap is not computed`)
        }

        timeit('smoothIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.params] = tf.tidy(() =>
            {
                const tensor = TensorUtils.smooth3d(this.intensityMap.tensor, radius)
                this.intensityMap.tensor.dispose()

                const params =  {...this.intensityMap.params}
                params.smoothingRadius = radius

                return [tensor, params]
            })
            
            
            // console.log('smoothedIntensityMap', this.intensityMap.params, this.intensityMap.tensor.dataSync())
        })
    }

    async quantizeIntensityMap()
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`quantizeIntensityMap: intensityMap is not computed`)
        }

        timeit('quantizeIntensityMap', () =>
        {
            [this.intensityMap.tensor, this.intensityMap.params] = tf.tidy(() =>
            {
                const [tensor, minValue, maxValue] = TensorUtils.quantize3d(this.intensityMap.tensor) 
                this.intensityMap.tensor.dispose()

                const params =  {...this.intensityMap.params}
                params.minValue = minValue
                params.maxValue = maxValue  

                return [tensor, params]
            })            
        })

        // console.log('quantizedIntensityMap', this.intensityMap.params, this.intensityMap.tensor.dataSync())
    }

    // Isosurface Maps

    async computeOccupancyMap(threshold = 0, subDivision = 4)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeIsosurfaceOccupancyDualMap: intensityMap is not computed`)
        }

        timeit('computeIsosurfaceOccupancyDualMap', () =>
        {
            [this.isosurfaceOccupancyDualMap.tensor, this.isosurfaceOccupancyDualMap.params] = tf.tidy(() => 
            {
                const tensor = TensorUtils.isosurfaceOccupancyDualMap(this.intensityMap.tensor, threshold, subDivision)
                const params = {}
                params.threshold = threshold
                params.subDivision = subDivision
                params.invSubDivision = 1/subDivision
                params.dimensions = new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed())
                params.spacing = new THREE.Vector3().copy(this.volume.params.spacing).multiplyScalar(subDivision)
                params.size = new THREE.Vector3().copy(params.dimensions).multiply(params.spacing)
                params.numBlocks = params.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
                params.shape = tensor.shape
                params.invDimensions = new THREE.Vector3().fromArray(params.dimensions.toArray().map(x => 1/x))
                params.invSpacing = new THREE.Vector3().fromArray(params.spacing.toArray().map(x => 1/x))
                params.invSize = new THREE.Vector3().fromArray(params.size.toArray().map(x => 1/x))

                return [tensor, params]
            })
        })

        console.log('isosurfaceOccupancyDualMap', this.isosurfaceOccupancyDualMap.params, this.isosurfaceOccupancyDualMap.tensor.dataSync())
    }

    async computeDistanceMap(threshold = 0, subDivision = 2, maxIters = 255)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeIsosurfaceDistanceDualMap: intensityMap is not computed`)
        }
       
        timeit('computeIsosurfaceDistanceDualMap', () =>
        {
            [this.isosurfaceDistanceDualMap.tensor, this.isosurfaceDistanceDualMap.params] = tf.tidy(() =>
            {
                const tensor = TensorUtils.isosurfaceDistanceDualMap(this.intensityMap.tensor, threshold, subDivision, maxIters)
                const params = {}
                params.threshold = threshold
                params.subDivision = subDivision
                params.shape = tensor.shape
                params.maxDistance = tensor.max().arraySync()
                params.dimensions = new THREE.Vector3().fromArray(tensor.shape.slice(0, 3).toReversed())
                params.spacing = new THREE.Vector3().copy(this.volume.params.spacing).multiplyScalar(params.subDivision)
                params.size = new THREE.Vector3().copy(params.dimensions).multiply(params.spacing)
                params.numBlocks = params.dimensions.toArray().reduce((numBlocks, dimension) => numBlocks * dimension, 1)
                params.invSubDivision = 1/subDivision
                params.invDimensions = new THREE.Vector3().fromArray(params.dimensions.toArray().map(x => 1/x))
                params.invSpacing = new THREE.Vector3().fromArray(params.spacing.toArray().map(x => 1/x))
                params.invSize = new THREE.Vector3().fromArray(params.size.toArray().map(x => 1/x))
                
                return [tensor, params]
            })
        })

        // console.log('isosurfaceDistanceDualMap', this.isosurfaceDistanceDualMap.params, this.isosurfaceDistanceDualMap.tensor.dataSync())
    }

    async computeBoundingBoxMap(threshold = 0)
    {
        if (!(this.intensityMap.tensor instanceof tf.Tensor)) 
        {
            throw new Error(`computeIsosurfaceBoundingBoxDualMap: intensityMap is not computed`)
        }

        timeit('computeIsosurfaceBoundingBoxDualMap', () =>
        {
            this.isosurfaceBoundingBoxDualMap.params = tf.tidy(() =>
            {
                const boundingBox = TensorUtils.isosurfaceBoundingBoxDualMap(this.intensityMap.tensor, threshold)
                const params = {}
                params.threshold = threshold
                params.minCoords = new THREE.Vector3().fromArray(boundingBox.minCoords)
                params.maxCoords = new THREE.Vector3().fromArray(boundingBox.maxCoords)
                params.minPosition = new THREE.Vector3().fromArray(boundingBox.minCoords).subScalar(0.5).multiply(this.volume.params.spacing)
                params.maxPosition = new THREE.Vector3().fromArray(boundingBox.maxCoords).addScalar(0.5).multiply(this.volume.params.spacing)
                
                return params
            })          
        })

        // console.log('isosurfaceBoundingBoxDualMap', this.isosurfaceBoundingBoxDualMap.params)
    }

    // helper functions

    getTexture(key, format, type) 
    {
        if (!(this[key].tensor instanceof tf.Tensor)) 
        {
            throw new Error(`${key} is not computed`)
        }

        if (this[key].texture instanceof THREE.Data3DTexture) 
        {
            this[key].texture.dispose()
        }

        timeit(`generateTexture(${key})`, () =>
        {
            let dimensions = this[key].params.dimensions.toArray()
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
        
            if (this[key]?.params) 
            {
                delete this[key].params
            }

            if (this[key])
            {
                this[key] = null
            }
        })

        this.volume = null;
    
        console.log("VolumeProcessor destroyed.");
    }
    
}