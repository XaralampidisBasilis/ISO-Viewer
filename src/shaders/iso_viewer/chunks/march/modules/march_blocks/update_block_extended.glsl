
// compute radii
block.skip_distances = sample_extended_distance(block.coords, ray.octant, block.occupied);
block.skip_distances = max(block.skip_distances, 1);

// compute min/max coords
block.min_coords = (block.coords - block.skip_distances) + 1;
block.max_coords = (block.coords + block.skip_distances);

// compute min/max positions
block.min_position = vec3(block.min_coords * u_distance_map.stride) - 0.5;
block.max_position = vec3(block.max_coords * u_distance_map.stride) - 0.5;  

// inflate to avoid boundaries
block.min_position -= TOLERANCE.MILLI;
block.max_position += TOLERANCE.MILLI; 

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// compute exit from cell ray intersection 
block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_face);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// compute next coordinates
ivec3 stepped_coords = block.coords + block.exit_face * block.skip_distances * ray.signs;
ivec3 snapped_coords = ivec3(round(block.exit_position)) / u_distance_map.stride;
block.coords = snapped_coords + block.exit_face * (stepped_coords - snapped_coords);

// update stats
#if STATS_ENABLED == 1
stats.num_blocks += 1;
#endif


