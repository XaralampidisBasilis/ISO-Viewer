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
 * @param {number} blockSize - Determines the size of cell blocks
 * @returns {Promise<tf.Tensor>} - A 3D boolean tensor where `true` values represent occupied cell blocks.
 */
export async function computeOccupancyMap(intensityMap, threshold, blockSize) 
{
    // Prepare strides and size for pooling operations
    const strides = [blockSize, blockSize, blockSize]
    const filterSize = [blockSize + 1, blockSize + 1, blockSize + 1]

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
    const minPool = minPool3d(padded, filterSize, strides, 'valid')
    const isAbove = tf.greaterEqual(threshold, minPool)
    tf.dispose(minPool)
    await tf.nextFrame()

    // Max pooling for upper bound detection
    const maxPool = tf.maxPool3d(padded, filterSize, strides, 'valid')
    const isBellow = tf.lessEqual(threshold, maxPool)
    tf.dispose([maxPool, padded])
    await tf.nextFrame()

    // Logical AND to find isosurface occupied blocks
    const occupancyMap = tf.logicalAnd(isAbove, isBellow)
    tf.dispose([isAbove, isBellow])
    await tf.nextFrame()

    return occupancyMap
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

        // Return bounding box coordinates in [z, y, x] order
        return {
            minCoords: [zMin, yMin, xMin],
            maxCoords: [zMax, yMax, xMax],
        }
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