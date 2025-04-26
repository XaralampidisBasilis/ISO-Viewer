import * as tf from '@tensorflow/tfjs'

/**
 * Computes an occupancy map by identifying blocks in a 3D intensity map
 * where the specified threshold value lies within the local minimum and 
 * maximum intensity values of cell blocks.
 * This method is useful for detecting iso-surfaces or transitions in volumetric data.
 *
 * @param {tf.Tensor4D} intensityMap - A 4D tensor representing the volumetric intensity data 
 *                                     with shape [depth, height, width, channels].
 * @param {number} threshold - A float value used to determine occupancy based on local intensity.
 * @param {number} blockStride - Determines the number of cells a block will have in each dimension
 * @returns {Promise<tf.Tensor>} - A 3D boolean tensor where `true` values represent occupied cell blocks.
 */
export async function computeOccupancyMap(intensityMap, threshold, blockStride) 
{
    return tf.tidy(() =>
    {
        // Prepare strides and size for pooling operations
        const shape = intensityMap.shape
        const strides = [blockStride, blockStride, blockStride]
        const filterSize = strides.map((x) => x + 1)

        // Compute shape in order to be appropriate for valid pool operations
        const numBlocks = shape.map((dimension) => Math.ceil((dimension - 1) / blockStride))
        const newShape = numBlocks.map((blockCount) => blockCount * blockStride + 1)

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

export async function computeDistanceMap(occupancyMap, maxDistance) 
{
    return tf.tidy(() => 
    {
        // Initialize the frontier and  distance tensors
        let distances = tf.where(occupancyMap, 0, 1)
        let frontier  = tf.cast(occupancyMap, 'bool')
        
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

export async function computeDistanceMap(occupancyMap, maxDistance) 
{
    return tf.tidy(() => 
    {
        // Compute block kernel
        let filter = tf.ones([3, 3, 3, 1, 1], 'float32')
        
        // Initialize the frontier and  distance tensors
        let distances = tf.where(occupancyMap, 0, 1)
        let frontier  = tf.cast(occupancyMap, 'bool')

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

export async function computeAxialDistanceMap(occupancyMap, maxDistance, axis) 
{
    return tf.tidy(() => 
    {
        // Compute an positive x-axis aligned kernel cone
        let filter = tf.tensor([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1], [3, 3, 3, 1, 1], 'float32')
        
        // Initialize the frontier and  distance tensors
        let distances = tf.where(occupancyMap, 0, maxDistance)
        let frontier  = tf.cast(occupancyMap, 'bool')

        for (let distance = 1; distance < maxDistance; distance++) 
        {   
            // Expand frontier with a positive x-axis aligned kernel cone
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

export async function computeOctantDistanceMap(occupancyMap, maxDistance, axes) 
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
            const newFrontier = tf.maxPool3d(frontier, [2, 2, 2], [1, 1, 1], 'same')
                            
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

export async function computePrismalDistanceMap(occupancyMap, maxDistance, axes) 
{
    return tf.tidy(() => 
    {            
        // Compute a x-axis octant prismal kernel
        let filter = tf.tensor([1, 0, 0, 0, 1, 1, 1, 1], [2, 2, 2, 1, 1], 'float32')
        
        let source = tf.reverse(occupancyMap, axes)
        // Initialize the frontier  and the distance tensor
        let distances = tf.where(source, 0, maxDistance)
        let frontier = tf.cast(source, 'bool')

        for (let distance = 1; distance < maxDistance; distance++) 
        {   
            // Expand frontier with kernel
            const expansion = tf.conv3d(frontier, filter, [1, 1, 1], 'same')
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
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, []),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [2]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [1]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [2, 1]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [0]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [2, 0]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [1, 0]),
        await this.computeOctantDistanceMap(occupancyMap, maxDistance, [2, 1, 0]),
    ]

    // compute anisotropic distance map by concatenating octant distance maps in depth dimensions
    let distanceMap = tf.concat(distances, 0)
    tf.dispose(distances)

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
    await tf.nextFrame()

    return distanceMap
}

export async function downscaleLinear(intensityMap, scale)
{
    const newShape = intensityMap.shape.map((size) => Math.ceil(size / scale))

    const resized0 = await resizeLinear(intensityMap, 0, newShape[0])
    await tf.nextFrame()

    const resized1 = await resizeLinear(resized0, 1, newShape[1])
    tf.dispose(resized0)
    await tf.nextFrame()

    const resized2 = await resizeLinear(resized1, 2, newShape[2])
    tf.dispose(resized1)
    await tf.nextFrame()

    const resized3 = await resizeLinear(resized2, 3, newShape[3])
    tf.dispose(resized2)
    await tf.nextFrame()

    return resized3
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