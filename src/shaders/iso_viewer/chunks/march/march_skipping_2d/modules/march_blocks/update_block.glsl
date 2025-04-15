
// Compute block coords from trace position
block.coords = ivec3(block.exit_position + 0.5) / u_distance_map.stride;

// Sample the distance map and compute if block is occupied
block.cheby_distance = sample_distance_map(block.coords);
block.occupied = block.cheby_distance == 0;

// Compute block min max coords in distance map
block.min_coords = block.coords - max(0, block.cheby_distance - 1);
block.max_coords = block.coords + max(0, block.cheby_distance - 0);

// compute box 
block.min_position = vec3(block.min_coords * u_distance_map.stride) - 0.5;
block.max_position = vec3(block.max_coords * u_distance_map.stride) - 0.5;  
block.min_position -= CENTI_TOLERANCE;
block.max_position += CENTI_TOLERANCE;

// compute entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// Compute block entry/exit positions
block.exit_distance = intersect_box_max(block.min_position, block.max_position, ray.start_position, ray.direction);
block.exit_position = ray.start_position + ray.direction * block.exit_distance;

// Compute termination condition
block.terminated = block.exit_distance > ray.span_distance;

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif