
// compute radii
block.radii = sample_extended_distance(block.coords, ray.group8, block.occupied);
block.radii = max(block.radii, 1);

// compute min/max coords
block.min_coords = block.coords - block.radii + 1;
block.max_coords = block.coords + block.radii;

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
block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.inv_direction, block.axes);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// compute next coordinates
ivec3 coordinates = ivec3(round(block.exit_position)) / u_distance_map.stride;
block.coords += block.radii * block.axes * ray.signs;
block.coords = pick(bvec3(block.axes), block.coords, coordinates);

// update stats
#if STATS_ENABLED == 1
stats.num_blocks += 1;
#endif
