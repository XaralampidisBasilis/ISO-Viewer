
// start poly
cell.exit_distance = (block.occupied) ? block.entry_distance : block.exit_distance;
cell.exit_position = (block.occupied) ? block.entry_position : block.exit_position;

// start poly
poly.distances.w = cell.exit_distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif