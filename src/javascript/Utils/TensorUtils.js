import * as tf from '@tensorflow/tfjs'

export async function computeLaplacianMap(intensityMap, axis)
{
    return tf.tidy(() => 
    {            
        // Compute shape based on axis
        const shape = [1, 1, 1, 1, 1]
        shape[axis] = 3

        // Compute paddings
        const padding = intensityMap.shape.map(() => [0, 0])
        padding[axis] = [1, 1]

        // Laplacian filter
        const filter = tf.tensor([1, -2, 1], shape, 'float32')

        // Expand boarders
        const padded = intensityMap.mirrorPad(padding, 'symmetric')

        // Concatenate laplacian map
        return tf.conv3d(padded, filter, 1, 'valid')
    })
}

export async function computeTrilaplacianIntensityMap(intensityMap)
{
    const laplacians = [
        await computeLaplacianMap(intensityMap, 2),
        await computeLaplacianMap(intensityMap, 1),
        await computeLaplacianMap(intensityMap, 0),
    ]

    const tensor = tf.concat([...laplacians, intensityMap], 3)
    tf.dispose(laplacians)

    return tensor
}

export async function computeBlockExtremaMap(intensityMap, stride) 
{
    return tf.tidy(() =>
    {
        // Prepare strides and size for pooling operations
        // Filter size is bigger to have overlapping voxels between cells
        const shape = intensityMap.shape
        const filterSize = stride + 1

        // Compute shape in order to be appropriate for valid pool operations
        const numBlocks = shape.map((dimension) => Math.ceil((dimension + 1) / stride))
        const newShape = numBlocks.map((count) => count * stride + 1)

        // Calculate necessary padding for valid subdivisions and boundary handling
        const padding = shape.map((dimension, i) => [1, newShape[i] - dimension - 1])
        padding[3] = [0, 0]

        // Compute block extrema
        const padded = tf.mirrorPad(intensityMap, padding, 'symmetric') 
        const blockMax = tf.maxPool3d(padded, filterSize, stride, 'valid')
        const blockMin = minPool3d(padded, filterSize, stride, 'valid') 

        // Return concatenated result
        return tf.concat([blockMin, blockMax], -1)
    })
}

/**
 * Computes an occupancy map by identifying blocks in a 3D intensity map
 * where the specified threshold value lies within the local minimum and 
 * maximum intensity values of cell blocks.
 * This method is useful for detecting iso-surfaces or transitions in volumetric data.
 *
 * @param {tf.Tensor4D} intensityMap - A 4D tensor representing the volumetric intensity data 
 *                                     with shape [depth, height, width, channels].
 * @param {number} threshold - A float value used to determine occupancy based on local intensity.
 * @param {number} blockSize - Determines the number of cells a block will have in each dimension
 * @returns {Promise<tf.Tensor>} - A 3D boolean tensor where `true` values represent occupied cell blocks.
 */
export async function computeOccupancyMap(extremaMap, threshold) 
{
    return tf.tidy(() =>
    {
        // compute min <= t && t <= Max as (min - t)(Max - t) <= 0
        return extremaMap.sub(threshold).prod(-1).expandDims(-1).lessEqual(0)
    })
}

export async function computeOccupancyMap2(intensityMap, threshold, blockSize) 
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
        return tf.logicalAnd(hasAbove, hasBellow)
    })
}

export async function computeOccupancyMap3(intensityMap, threshold, blockSize) 
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

/**
 * Computes the 3D axis-aligned bounding box of all non-zero (truthy) cells in a 4D occupancy tensor.
 *
 * The occupancy map is expected to have shape [depth, height, width, channels] (i.e., 4D),
 * where non-zero values represent "occupied" cells.
 *
 * This function collapses across each axis to find where the active cells are,
 * then finds the first and last active indices to define the bounding box.
 *
 * @param {tf.Tensor4D} occupancyMap - A binary tensor with shape [D, H, W, C].
 * @returns {Promise<{ minCoords: number[], maxCoords: number[] }>} - Bounding box coordinates [z, y, x].
 */
export async function computeBoundingBox(occupancyMap) 
{
    return tf.tidy(() => 
    {
        const occupancy = tf.cast(occupancyMap, 'bool')

        // Collapse occupancy map across axes to identify active voxels
        // For each axis, reduce all other axes and get a 1D boolean array
        const xOccupancy = occupancy.any([0, 1, 3]).arraySync().flat() 
        const yOccupancy = occupancy.any([0, 2, 3]).arraySync().flat() 
        const zOccupancy = occupancy.any([1, 2, 3]).arraySync().flat() 

        // Compute mix/max bounding box coords
        const minCoords = [xOccupancy.findIndex(Boolean), yOccupancy.findIndex(Boolean), zOccupancy.findIndex(Boolean)]
        const maxCoords = [xOccupancy.findLastIndex(Boolean), yOccupancy.findLastIndex(Boolean), zOccupancy.findLastIndex(Boolean)]

        return { minCoords, maxCoords }
    })
}

export async function computeBoundingBox2(occupancyMap) 
{
    return tf.tidy(() => 
    {
        // Collapse occupancy map across axes to identify active voxels
        // For each axis, reduce all other axes and get a 1D boolean array
        const xMin = occupancyMap.argMax(0).min().arraySync()
        const yMin = occupancyMap.argMax(1).min().arraySync()
        const zMin = occupancyMap.argMax(2).min().arraySync()


        const xMax = occupancyMap.shape[2] - 1 - occupancyMap.reverse(0).argMax(0).min().arraySync()
        const yMax = occupancyMap.shape[1] - 1 - occupancyMap.reverse(1).argMax(1).min().arraySync()
        const zMax = occupancyMap.shape[0] - 1 - occupancyMap.reverse(2).argMax(2).min().arraySync()

        // Compute mix/max bounding box coords
        const iMin = [xMin, yMin, zMin]
        const iMax = [xMax, yMax, zMax]

        return { minCoords: iMin, maxCoords: iMax }
    })
}

export async function computeBoundingBox3(occupancyMap) 
{
    return tf.tidy(() => 
    {    
        // Collapse occupancy map across axes to identify active voxels
        // For each axis, reduce all other axes and get a 1D boolean array
        const xOccupancy = occupancyMap.any([1, 2, 3])
        const yOccupancy = occupancyMap.any([0, 2, 3])
        const zOccupancy = occupancyMap.any([0, 1, 3])

        // Get argmin 
        const xMin = xOccupancy.argMax().arraySync()
        const yMin = yOccupancy.argMax().arraySync()
        const zMin = zOccupancy.argMax().arraySync()
        
        // Get argmax
        const xMax = occupancyMap.shape[2] - 1 - zOccupancy.argMax().arraySync()
        const yMax = occupancyMap.shape[1] - 1 - yOccupancy.argMax().arraySync()
        const zMax = occupancyMap.shape[0] - 1 - xOccupancy.argMax().arraySync()

        // Compute mix/max bounding box coords
        const iMin = [xMin, yMin, zMin]
        const iMax = [xMax, yMax, zMax]

        console.log({minCoords: iMin, maxCoords: iMax})

        return { minCoords: iMin, maxCoords: iMax }
    })
}

/**
 * Computes a Chebyshev distance map from a 3D binary occupancy map.
 *
 * The algorithm expands a wavefront from all occupied voxels, iterating up to
 * `maxDistance`. Each voxel is assigned the iteration step at which the wavefront
 * first arrives. Voxels not reached by the wavefront within `maxDistance` steps
 * are assigned `maxDistance`.
 *
 * @param {tf.Tensor4D} occupancyMap - 4D binary tensor indicating occupied voxels (1 = occupied, 0 = free) 
 *                                   with shape [depth, height, width, channels].
 * @param {number} maxDistance  - Maximum number of expansion steps (voxels)
 * @returns {Promise<tf.Tensor>} - An int32 tensor of the same shape as the input,
 *                                 where each voxel holds its Chebyshev distance
 *                                to the nearest occupied voxel
 */
export async function computeDistanceMap(occupancyMap, maxDistance) 
{
    return tf.tidy(() => 
    {
        // Initialize the frontier (occupied voxels) and the distance tensor
        let frontier  = tf.cast(occupancyMap, 'bool')
        let distances = tf.where(frontier, 0, maxDistance)
        
        for (let d = 1; d < maxDistance; d++) 
        {   
            // Compute the new frontier by expanding frontier regions
            const newFrontier = tf.maxPool3d(frontier, [3, 3, 3], 1, 'same')
                            
            // Identify the newly occupied voxel wavefront
            const wavefront = tf.notEqual(newFrontier, frontier)

            // Compute and add distances for the newly occupied voxels at this step
            const newDistances = tf.where(wavefront, d, distances)

            // Dispose old tensors 
            tf.dispose([distances, frontier, wavefront])

            // Update new tensors for the next iteration
            distances = newDistances
            frontier = newFrontier
        }

        return distances
    })
}

export async function computeDistanceMap2(occupancyMap, maxDistance) 
{
    return tf.tidy(() => 
    {
        // Initialize the frontier and  distance tensors
        let frontier  = tf.cast(occupancyMap, 'bool')
        let distances = tf.where(frontier, 0, 1)
        
        for (let distance = 2; distance <= maxDistance; distance++) 
        {   
            // Compute the new frontier by expanding frontier regions
            const newFrontier = tf.maxPool3d(frontier, [3, 3, 3], [1, 1, 1], 'same')

            // Identify the rest of the unvisited cells
            const backline = tf.logicalNot(newFrontier)

            // Update all backline cells with current distance
            const newDistances = tf.where(backline, distance, distances)

            // Dispose old tensors 
            tf.dispose([distances, frontier, backline])

            // Update new tensors for the next iteration
            distances = newDistances
            frontier = newFrontier
        }

        return distances
    })
}

export async function computeDistanceMap3(occupancyMap, maxDistance) 
{
    return tf.tidy(() => 
    {
        // Compute block kernel
        let filter = tf.ones([3, 3, 3, 1, 1], 'float32')
        
        // Initialize the frontier and  distance tensors
        let frontier  = tf.cast(occupancyMap, 'bool')
        let distances = tf.where(frontier, 0, 1)

        for (let distance = 1; distance <= maxDistance; distance++) 
        {   
            // Expand frontier with block kernel
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
}

export async function computeDirectional8DistanceMap(occupancyMap, maxDistance = 255, axes) 
{
    return tf.tidy(() => 
    {            
        // Initialize the frontier  and the distance tensor
        let source = tf.reverse(occupancyMap, axes)
        let frontier = tf.cast(source, 'bool')
        let distances = tf.where(frontier, 0, maxDistance)
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

export async function computeDirectional24DistanceMap(occupancyMap, maxDistance = 31, axes, index) 
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
        let frontier = tf.cast(source, 'bool')
        let distances = tf.where(frontier, 0, maxDistance)

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

export async function computeAnisotropicDistanceMap(occupancyMap, maxDistance) 
{  
    // compute octant distance maps with binary code order
    let distances = [
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 1, 0]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [1, 0]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 0]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [0]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [2, 1]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [1]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, [2]),
        await computeDirectional8DistanceMap(occupancyMap, maxDistance, []),
    ]

    // compute anisotropic distance map by concatenating octant distance maps in depth dimensions
    let distanceMap = tf.concat(distances, 0)
    tf.dispose(distances)

    return distanceMap
}

export async function computeExtendedAnisotropicDistanceMap(occupancyMap) 
{  
    // compute distance maps with binary code order
    const distances = [
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1, 0], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [1, 0], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 0], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [0], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [0], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [0], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2, 1], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [1], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [1], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [1], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [2], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [2], 0),
        ],
        [
            await computeDirectional24DistanceMap(occupancyMap, 31, [], 2),
            await computeDirectional24DistanceMap(occupancyMap, 31, [], 1),
            await computeDirectional24DistanceMap(occupancyMap, 31, [], 0),
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
        packedDistances.push( tf.tidy(() => uint5551(xDistances, yDistances, zDistances, occupancyMap)) ) 
        tf.dispose([xDistances, yDistances, zDistances])
    }

    // compute anisotropic distance map by concatenating octant distance maps in depth dimensions
    let distanceMap = tf.concat(packedDistances, 0)
    tf.dispose(packedDistances)

    return distanceMap
}

/**
 * Computes a distance map for a specific subregion of a 4D occupancy map tensor,
 * then pads the result back to match the original tensor's shape.
 *
 * Useful when only a small region of the occupancy map needs distance transformation,
 * but the final result should maintain the original shape (e.g., for merging or batching).
 *
 * @param {tf.Tensor4D} occupancyMap - The full 4D binary tensor (e.g., from voxel occupancy).
 * @param {number} maxDistance - The maximum distance to compute in the distance transform.
 * @param {number[]} begin - The starting indices of the slice in each dimension.
 * @param {number[]} sliceSize - The size of the slice in each dimension.
 * @returns {Promise<tf.Tensor4D>} - A padded 4D tensor with distance values in the sliced region.
 */
export async function computeDistanceMapFromSlice(occupancyMap, maxDistance, begin, sliceSize)
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

export async function downscaleLinear(tensor, scale)
{
    const newShape = tensor.shape.map((size) => Math.ceil(size / scale))
    
    const resized0 = await resizeLinear(tensor,   0, newShape[0])
    const resized1 = await resizeLinear(resized0, 1, newShape[1])
    const resized2 = await resizeLinear(resized1, 2, newShape[2])
    return resized2
}

export async function downscaleNearest(tensor, scale)
{
    const newShape = tensor.shape.map((size) => Math.ceil(size / scale))

    const resized0 = await resizeNearest(tensor,   0, newShape[0])
    const resized1 = await resizeNearest(resized0, 1, newShape[1])
    const resized2 = await resizeNearest(resized1, 2, newShape[2])
    return resized2
}

export async function resizeLinear(tensor, axis, newSize) 
{
    return tf.tidy(() => 
    {
        // Compute indices for interpolation
        const delta = 1 / newSize
        const indices = tf.linspace(0, newSize - 1, newSize)
        const percents = indices.add(0.5).mul(delta) // normalized indices
        
        // Compute the sample indices 
        const size = tensor.shape[axis]
        const samples = percents.mul(size).sub(0.5)
        const samplesFloor = tf.clipByValue(tf.floor(samples).toInt(), 0, size - 1)  // lower indices, clipped
        const samplesCeil = tf.clipByValue(tf.ceil(samples).toInt(), 0, size - 1)    // upper indices, clipped

        // Compute interpolation weights
        const lerpWeights = samples.sub(tf.floor(samples))   // fractional part for interpolation
        const lerpShape = new Array(tensor.shape.length).fill(1)
        lerpShape[axis] = lerpWeights.size // match dimensions along the interpolation axis

        // Gather slices along the specified axis
        const expandedFloor = tf.gather(tensor, samplesFloor, axis)
        const expandedCeil = tf.gather(tensor, samplesCeil, axis)
        const expandedWeights = tf.reshape(lerpWeights, lerpShape) // reshape for broadcasting

        // Perform linear interpolation
        const interpolated = mix(expandedFloor, expandedCeil, expandedWeights)
        return interpolated
    })
}

export async function resizeNearest(tensor, axis, newSize) 
{
    return tf.tidy(() => 
    {
        // Compute new indices in normalized space
        const delta = 1 / newSize
        const indices = tf.linspace(0, newSize - 1, newSize)
        const percents = indices.add(0.5).mul(delta) // normalized indices

        // Map to the original tensor index space
        const size = tensor.shape[axis]
        const samples = percents.mul(size).sub(0.5)

        // Use nearest neighbor rounding (instead of linear interpolation)
        const nearestIndices = tf.round(samples).toInt() // Round to nearest index
        const nearestClipped = tf.clipByValue(nearestIndices, 0, size - 1) // Ensure valid indices

        // Gather values from the original tensor
        const resized = tf.gather(tensor, nearestClipped, axis)
        return resized
    })
}

export function minPool3d(tensor, filterSize, strides, pad)
{
    return tf.tidy(() => tf.maxPool3d(tensor.neg(), filterSize, strides, pad).neg())
} 

export function mix(a, b, t)
{
    return tf.tidy(() => 
    {
        const difference = b.sub(a)
        const offset = difference.mul(t)
        const result = a.add(offset)
        
        return result
    })
}

export function map(min, max, x)
{
    return tf.tidy(() => 
    {
        const range = max - min        
        return x.sub(min).div(range)
    })
}

export function uint5551(r, g, b, a) 
{
    return tf.tidy(() => 
    {
        // Clamp and floor all channels to fit their bit-widths
        const r5 = r.clipByValue(0, 31) // R & 0x1F
        const g5 = g.clipByValue(0, 31) // G & 0x1F
        const b5 = b.clipByValue(0, 31) // B & 0x1F
        const a1 = a.clipByValue(0, 1)  // A & 0x1

        // Shift each channel to correct bit position
        const r11 = r5.mul(2048) // R << 11
        const g6  = g5.mul(64)   // G << 6
        const b1  = b5.mul(2)    // B << 1

        // Combine all into one 16-bit packed value
        return a1.add(b1).add(g6).add(r11)
    })
}