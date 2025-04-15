
// Sample the distance map and compute if block is occupied
block.cheby_distance = texelFetch(u_textures.distance_map, block.coords, 0).r;
block.occupied = block.cheby_distance == 0;

// Compute block min max coords in distance map
block.cheby_distance = max(block.cheby_distance, 1);
block.min_coords = block.coords - block.cheby_distance;
block.max_coords = block.coords + block.cheby_distance;

// Compute block min max position in model space  
block.min_position = (vec3(block.min_coords + 1) - MILLI_TOLERANCE) * u_distance_map.spacing - u_intensity_map.spacing * 0.5;
block.max_position = (vec3(block.max_coords + 0) + MILLI_TOLERANCE) * u_distance_map.spacing - u_intensity_map.spacing * 0.5;  

// Compute block entry from previous exit
block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

// Compute block exit
block.exit_distance = intersect_box_max(block.min_position, block.max_position, camera.position, ray.direction, block.axis);
block.exit_position = camera.position + ray.direction * block.exit_distance;

// Compute termination condition
block.terminated = block.exit_distance > ray.end_distance;

// Compute next coordinates
block.coords = ivec3((block.exit_position + u_intensity_map.spacing * 0.5) * u_distance_map.inv_spacing);

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif