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
            intensityMap                        : { parameters: null, tensor: null},
            laplaceIntensityMap                 : { parameters: null, tensor: null},
            occupancyMap                        : { parameters: null, tensor: null},
            boundingBox                         : { parameters: null},
            distanceMap                         : { parameters: null, tensor: null},
            anisotropicDistanceMap              : { parameters: null, tensor: null},
            extendedAnisotropicDistanceMap      : { parameters: null, tensor: null},
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

    async generateLaplaceIntensityMap()
    {
        console.time('generateLaplaceIntensityMap') 
        this.computes.laplaceIntensityMap.tensor = this.computeLaplaceIntensityMap(this.computes.intensityMap.tensor)          
        this.computes.laplaceIntensityMap.parameters = {...this.computes.intensityMap.parameters}
        console.timeEnd('generateLaplaceIntensityMap') 
        // console.log(this.computes.laplaceIntensityMap.parameters)
        // console.log(this.computes.laplaceIntensityMap.tensor.dataSync())
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
        const distanceMap = await this.computeDistanceMap(this.computes.occupancyMap.tensor, maxIters)
        const parameters = {...this.computes.occupancyMap.parameters}
        const maxTensor = distanceMap.max()
        const meanTensor = distanceMap.mean()

        parameters.maxDistance = maxTensor.arraySync()  
        parameters.meanDistance = meanTensor.arraySync()  
        tf.dispose([maxTensor, meanTensor])

        this.computes.distanceMap.tensor = distanceMap
        this.computes.distanceMap.parameters = parameters
        console.timeEnd('generateDistanceMap') 
        console.log(this.computes.distanceMap.parameters)
        // console.log(this.computes.distanceMap.tensor.dataSync())
    }

    async generateAnisotropicDistanceMap(maxIters)
    {
        console.time('generateAnisotropicDistanceMap') 
        const anisotropicDistanceMap = await this.computeAnisotropicDistanceMap(this.computes.occupancyMap.tensor, maxIters)
        const parameters = {...this.computes.occupancyMap.parameters}
        const maxTensor = anisotropicDistanceMap.max()
        const meanTensor = anisotropicDistanceMap.mean()
        
        parameters.dimensions = parameters.dimensions.clone()
        parameters.dimensions.z *= 8
        parameters.maxDistance = maxTensor.arraySync()  
        parameters.meanDistance = meanTensor.arraySync()  
        tf.dispose([maxTensor, meanTensor])

        this.computes.anisotropicDistanceMap.tensor = anisotropicDistanceMap
        this.computes.anisotropicDistanceMap.parameters = parameters
        console.timeEnd('generateAnisotropicDistanceMap') 
        // console.log(this.computes.anisotropicDistanceMap.parameters)
        // console.log(this.computes.anisotropicDistanceMap.tensor.dataSync())
    }

    async generateExtendedAnisotropicDistanceMap(maxIters)
    {
        console.time('generateExtendedAnisotropicDistanceMap') 
        const extendedAnisotropicDistanceMap = await this.computeExtendedAnisotropicDistanceMap(this.computes.occupancyMap.tensor, maxIters)
        const parameters = {...this.computes.occupancyMap.parameters}
        const maxTensor = extendedAnisotropicDistanceMap.max()
        const meanTensor = extendedAnisotropicDistanceMap.mean()

        parameters.dimensions = parameters.dimensions.clone()
        parameters.dimensions.z *= 8
        parameters.maxDistance = maxTensor.arraySync()  
        parameters.meanDistance = meanTensor.arraySync()  
        tf.dispose([maxTensor, meanTensor])

        this.computes.extendedAnisotropicDistanceMap.tensor = extendedAnisotropicDistanceMap
        this.computes.extendedAnisotropicDistanceMap.parameters = parameters
        console.timeEnd('generateExtendedAnisotropicDistanceMap') 
        // console.log(this.computes.extendedAnisotropicDistanceMap.parameters)
        // console.log(this.computes.extendedAnisotropicDistanceMap.tensor.dataSync())
    }

    // Helpers

    async computeLaplaceIntensityMap(intensityMap)
   {
        return tf.tidy(() => 
        {            
            // Compute 3 fused second-order derivatives filter
            let xFilter = tf.tensor([0.5, -1, 0.5], [1, 1, 3, 1, 1], 'float32')
            let yFilter = tf.tensor([0.5, -1, 0.5], [1, 3, 1, 1, 1], 'float32')
            let zFilter = tf.tensor([0.5, -1, 0.5], [3, 1, 1, 1, 1], 'float32')
    
            // Compute second-order derivatives 
            let xlLaplace = tf.conv3d(intensityMap, xFilter, 1, 'same')
            let ylLaplace = tf.conv3d(intensityMap, yFilter, 1, 'same')
            let zlLaplace = tf.conv3d(intensityMap, zFilter, 1, 'same')

            // Concatenate laplace vector with intensity map 
            return tf.concat([xlLaplace, ylLaplace, zlLaplace, intensityMap], 3)
        })
    }

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

            // Compute if cell has values above/bellow threshold
            const max = tf.maxPool3d(padded, filterSize, strides, 'valid')
            const negMin = tf.maxPool3d(padded.neg(), filterSize, strides, 'valid')

            // Compute if voxel values is above/bellow  threshold
            const isAbove = tf.lessEqual(-threshold, negMin)
            const isBellow = tf.lessEqual(threshold, max)    

            // Compute cell occupation if above and bellow values from threshold
            return tf.logicalAnd(isAbove, isBellow)
        })
    }

    // async computeOccupancyMap(intensityMap, threshold, blockSize) 
    // {
    //     return tf.tidy(() =>
    //     {
    //         // Prepare strides and size for pooling operations
    //         const shape = intensityMap.shape
    //         const strides = [blockSize, blockSize, blockSize]
    //         const filterSize = [blockSize + 1, blockSize + 1, blockSize + 1]
    
    //         // Compute shape in order to be appropriate for valid pool operations
    //         const numBlocks = shape.map((dimension) => Math.ceil((dimension - 1) / blockSize))
    //         const newShape = numBlocks.map((blockCount) => blockCount * blockSize + 1)
    
    //         // Calculate necessary padding for valid subdivisions and boundary handling
    //         const padding = shape.map((dimension, i) => [1, newShape[i] - dimension - 1])
    //         padding[3] = [0, 0]
    //         const padded = tf.pad(intensityMap, padding) 

    //         // Compute if voxel values is above/bellow  threshold
    //         const isBellow = tf.lessEqual(padded, threshold)
    //         const isAbove = tf.greaterEqual(padded, threshold)
    
    //         // Compute if cell has values above/bellow threshold
    //         const hasAbove = tf.maxPool3d(isAbove, filterSize, strides, 'valid')
    //         const hasBellow = tf.maxPool3d(isBellow, filterSize, strides, 'valid')
    
    //         // Compute cell occupation if above and bellow values from threshold
    //         return tf.logicalAnd(hasAbove, hasBellow)
    //     })
    // }

    async computeBoundingBox(occupancyMap) 
    {
        return tf.tidy(() => 
        {
            // Collapse occupancy map across axes to identify active voxels
            // For each axis, reduce all other axes and get a 1D boolean array
            const xOccupancy = occupancyMap.any([0, 1, 3]).arraySync().flat() 
            const yOccupancy = occupancyMap.any([0, 2, 3]).arraySync().flat() 
            const zOccupancy = occupancyMap.any([1, 2, 3]).arraySync().flat() 
    
            // Compute mix/max bounding box coords
            const minCoords = [xOccupancy.findIndex(Boolean), yOccupancy.findIndex(Boolean), zOccupancy.findIndex(Boolean)]
            const maxCoords = [xOccupancy.findLastIndex(Boolean), yOccupancy.findLastIndex(Boolean), zOccupancy.findLastIndex(Boolean)]
    
            return { minCoords, maxCoords }
        })
    }

    // async computeBoundingBox(occupancyMap) 
    // {
    //     return tf.tidy(() => 
    //     {
    //         // Collapse occupancy map across axes to identify active voxels
    //         // For each axis, reduce all other axes and get a 1D boolean array
    //         const xMin = occupancyMap.argMax(0).min().arraySync()
    //         const yMin = occupancyMap.argMax(1).min().arraySync()
    //         const zMin = occupancyMap.argMax(2).min().arraySync()


    //         const xMax = occupancyMap.shape[2] - 1 - occupancyMap.reverse(0).argMax(0).min().arraySync()
    //         const yMax = occupancyMap.shape[1] - 1 - occupancyMap.reverse(1).argMax(1).min().arraySync()
    //         const zMax = occupancyMap.shape[0] - 1 - occupancyMap.reverse(2).argMax(2).min().arraySync()
    
    //         // Compute mix/max bounding box coords
    //         const iMin = [xMin, yMin, zMin]
    //         const iMax = [xMax, yMax, zMax]
    
    //         return { minCoords: iMin, maxCoords: iMax }
    //     })
    // }

    // async computeBoundingBox(occupancyMap) 
    // {
    //     return tf.tidy(() => 
    //     {    
    //         // Collapse occupancy map across axes to identify active voxels
    //         // For each axis, reduce all other axes and get a 1D boolean array
    //         const xOccupancy = occupancyMap.any([1, 2, 3])
    //         const yOccupancy = occupancyMap.any([0, 2, 3])
    //         const zOccupancy = occupancyMap.any([0, 1, 3])
    
    //         // Get argmin 
    //         const xMin = xOccupancy.argMax().arraySync()
    //         const yMin = yOccupancy.argMax().arraySync()
    //         const zMin = zOccupancy.argMax().arraySync()
            
    //         // Get argmax
    //         const xMax = occupancyMap.shape[2] - 1 - zOccupancy.argMax().arraySync()
    //         const yMax = occupancyMap.shape[1] - 1 - yOccupancy.argMax().arraySync()
    //         const zMax = occupancyMap.shape[0] - 1 - xOccupancy.argMax().arraySync()

    //         // Compute mix/max bounding box coords
    //         const iMin = [xMin, yMin, zMin]
    //         const iMax = [xMax, yMax, zMax]

    //         console.log({minCoords: iMin, maxCoords: iMax})
    
    //         return { minCoords: iMin, maxCoords: iMax }
    //     })
    // }

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
                const newFrontier = tf.maxPool3d(frontier, [3, 3, 3], 1, 'same')
                                
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
    
    async computeDirectional8DistanceMap(occupancyMap, maxDistance = 255, axes) 
    {
        return tf.tidy(() => 
        {            
            // Initialize the frontier  and the distance tensor
            let source = tf.reverse(occupancyMap, axes)
            let distances = tf.where(source, 0, maxDistance)
            let frontier = tf.cast(source, 'bool')
            tf.dispose(source)
    
            for (let distance = 1; distance < maxDistance; distance++) 
            {   
                // Compute the new frontier by expanding frontier regions
                const newFrontier = tf.maxPool3d(frontier, [2, 2, 2], 1, 'same')
                                
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
    
            return tf.reverse(distances, axes)
        })
    }

    // its not faster than 3 computeDirectional24DistanceMap
    // async compute3Directional8DistanceMap(occupancyMap, maxDistance = 31, axes) 
    // {
    //     return tf.tidy(() => 
    //     {            
    //         // Create the axial filters
    //         let filters = [
    //             tf.tensor([1, 1, 0, 1, 0, 1, 0, 1], [2, 2, 2], 'float32'), // z
    //             tf.tensor([1, 0, 0, 0, 1, 1, 1, 1], [2, 2, 2], 'float32'), // y
    //             tf.tensor([1, 0, 1, 1, 0, 0, 1, 1], [2, 2, 2], 'float32'), // x
    //         ]

    //         // Fuse axis filters into a separable 5d filter
    //         let filter = tf.buffer([2, 2, 2, 3, 3], 'float32')

    //         for (let c = 0; c < 3; c++) {
    //             const f = filters[c].arraySync()
    //             for (let d = 0; d < 2; d++)
    //                 for (let h = 0; h < 2; h++)
    //                     for (let w = 0; w < 2; w++) 
    //                         filter.set(f[d][h][w], d, h, w, c, c)
    //         }

    //         filter = filter.toTensor()
    
    //         // Reverse occupancy based on target octant axes and tile result
    //         let source = tf.tile(tf.reverse(occupancyMap, axes), [1, 1, 1, 3])

    //         // Initialize the frontier and the distance tensor
    //         let distances = tf.where(source, 0, maxDistance)
    //         let frontier = tf.cast(source, 'bool')
    
    //         for (let d = 1; d < maxDistance; d++) 
    //         {   
    //             // Expand frontier with kernel
    //             const expansion = tf.conv3d(frontier, filter, 1, 'same')
    //             const newFrontier = expansion.cast('bool')
                                    
    //             // Identify the newly occupied voxel wavefront
    //             const wavefront = tf.notEqual(newFrontier, frontier)
    
    //             // Compute and add distances for the newly occupied voxels at this step
    //             const newDistances = tf.where(wavefront, d, distances)
    
    //             // Dispose old tensors 
    //             tf.dispose([distances, frontier, wavefront])
    
    //             // Update new tensors for the next iteration
    //             distances = newDistances
    //             frontier = newFrontier
    //         }
            
    //         // Reverse distances based on target octant and unstack result
    //         let distanceMaps = tf.unstack(tf.reverse(distances, axes), -1)
            
    //         // pack distance and occupancy maps
    //         return this.uint5551(distanceMaps[0], distanceMaps[1], distanceMaps[2], occupancyMap.squeeze())
    //     })
    // }

    async computeDirectional24DistanceMap(occupancyMap, maxDistance = 31, axes, index) 
    {
        return tf.tidy(() => 
        {            
            // swap order based on index
            const order = [0, 1, 2, 3, 4];
            [order[0], order[index]] = [order[index], order[0]]

            // Compute a x-axis octant prismal kernel
            let filter = tf.tensor([1, 0, 0, 0, 1, 1, 1, 1], [2, 2, 2, 1, 1], 'float32').transpose(order)
            
            // Initialize the frontier and the distance tensor
            let source = tf.reverse(occupancyMap, axes)
            let distances = tf.where(source, 0, maxDistance)
            let frontier = tf.cast(source, 'bool')
    
            for (let distance = 1; distance < maxDistance; distance++) 
            {   
                // Expand frontier with kernel
                const expansion = tf.conv3d(frontier, filter, 1, 'same')
                const newFrontier = expansion.cast('bool')
                                    
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
    
            return tf.reverse(distances, axes)
        })
    }

    async computeAnisotropicDistanceMap(occupancyMap, maxDistance) 
    {  
        // compute octant distance maps with binary code order
        let distances = [
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 1, 0]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [1, 0]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 0]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [0]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 1]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [1]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, [2]),
            await this.computeDirectional8DistanceMap(occupancyMap, maxDistance, []),
        ]

        // compute anisotropic distance map by concatenating octant distance maps in depth dimensions
        let distanceMap = tf.concat(distances, 0)
        tf.dispose(distances)

        return distanceMap
    }

    async computeExtendedAnisotropicDistanceMap(occupancyMap, maxDistance = 31) 
    {  
        // compute distance maps with binary code order
        const distances = [
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [0], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [0], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [0], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [1], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [2], 0),
            ],
            [
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [], 2),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [], 1),
                await this.computeDirectional24DistanceMap(occupancyMap, 31, [], 0),
            ],
        ]
    
        // Compute packed distances 
        const packedDistances = []
    
        for (let distance of distances)
        {
            const xDistances = distance[0]
            const yDistances = distance[1]
            const zDistances = distance[2]
    
            // pack distances into a 16 bit uint, assuming each distance is a 5 bit uint 
            packedDistances.push( tf.tidy(() => this.uint5551(xDistances, yDistances, zDistances, occupancyMap)) ) 
            tf.dispose([xDistances, yDistances, zDistances])
        }
    
        // compute anisotropic distance map by concatenating octant distance maps in depth dimensions
        let distanceMap = tf.concat(packedDistances, 0)
        tf.dispose(packedDistances)
    
        return distanceMap
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

    uint5551(R, G, B, A) 
    {
        return tf.tidy(() => 
        {
            // Clamp and floor all channels to fit their bit-widths
            const R5 = R.clipByValue(0, 31) // R & 0x1F
            const G5 = G.clipByValue(0, 31) // G & 0x1F
            const B5 = B.clipByValue(0, 31) // B & 0x1F
            const A1 = A.clipByValue(0, 1)  // A & 0x1

            // Shift each channel to correct bit position
            const R11 = R5.mul(2048) // R << 11
            const G6  = G5.mul(64)   // G << 6
            const B1  = B5.mul(2)    // B << 1

            // Combine all into one 16-bit packed value
            return A1.add(B1).add(G6).add(R11)
        })
    }
}