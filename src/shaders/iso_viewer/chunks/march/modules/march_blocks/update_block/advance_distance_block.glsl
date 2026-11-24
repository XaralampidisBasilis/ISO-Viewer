ivec3 exit_coords = positionToBlockCoords(block.exit_position);
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

#if MARCHING_METHOD == 0
// Keep incremental state for adjacent blocks and restart after a larger skip.
if (single_block_step && all(equal(block.coords, adjacent_block_coords)))
    block_far_distances = advanceBlockFarDistances(block_far_distances, block_step_distances, block.exit_distance, block.exit_normal);
else
    block_far_distances = distanceBlockCoordsToFarDistances(block.coords);
#endif
