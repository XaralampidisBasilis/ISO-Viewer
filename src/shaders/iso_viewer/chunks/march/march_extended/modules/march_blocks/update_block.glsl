
// compute coordinates
block.coords = ivec3(floor(block.exit_position + 0.5)) / u_distance_map.stride;
// block.coords = clamp(block.coords, ivec3(0), u_distance_map.dimensions -1);

// compute radius
block.radius = sample_ext_anisotropic_distance_map(block.coords, ray.group24);
block.occupied = block.radius == 0;
block.radius = max(block.radius, 1);

// compute box min/max coords
block.min_coords = block.coords - block.radius + 1;
block.max_coords = block.coords + block.radius;

// compute box min/max positions
block.min_position = vec3(block.min_coords * u_distance_map.stride) - 0.5;
block.max_position = vec3(block.max_coords * u_distance_map.stride) - 0.5;  

// inflate box to avoid boundaries when computing coordinates
block.min_position -= TOLERANCE.MILLI; 
block.max_position += TOLERANCE.MILLI;

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// compute exit from cell ray intersection 
block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.direction);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// Compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// update stats
#if STATS_ENABLED == 1
stats.num_blocks += 1;
#endif