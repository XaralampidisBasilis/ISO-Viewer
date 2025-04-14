
cell.exit_distance = mix(block.exit_distance, block.entry_distance, block.occupied); 
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// Compute cell coordinates
cell.coords = ivec3(cell.exit_position * u_intensity_map.inv_spacing + 0.5);
poly.distances.w = cell.exit_distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif