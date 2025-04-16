
// Compute block coords from trace position
block.coords = cell.coords / u_distance_map.stride;

// Sample the distance map and compute if block is occupied
block.radius = texelFetch(u_textures.distance_map, block.coords, 0).r;
block.occupied = block.radius == 0;

// Compute block min max coords in distance map
block.min_coords = block.coords - block.radius;
block.max_coords = block.coords + block.radius;

// Compute block min max position in model space  
block.min_position = vec3(block.min_coords + 1) * u_distance_map.spacing - u_intensity_map.spacing * 0.5;
block.max_position = vec3(block.max_coords + 0) * u_distance_map.spacing - u_intensity_map.spacing * 0.5;  

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif