
// compute occupancy
block.occupied = sample_occupancy(block.coords);
block.skip_coords = ivec3(1);

// compute min/max coords
block.min_coords = block.coords;
block.max_coords = block.coords;

// compute min/max positions
block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// compute exit from cell ray intersection 
block.exit_distance = intersectBlockFarDistances(block.coords, block_far_distances, block.exit_normal);
block_far_distances = advanceBlockFarDistances(block_far_distances, block_step_distances, block.exit_distance, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// compute span distance
block.span_distance = block.exit_distance - block.entry_distance;

// compute next coordinates
block.coords += block.exit_normal * ray.signs;

// compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// update stats
#if DEBUG_ENABLED == 1
stats.num_blocks += 1;
#endif
