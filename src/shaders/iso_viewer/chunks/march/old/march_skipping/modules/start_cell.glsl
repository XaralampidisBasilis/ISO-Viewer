
// compute cell at ray start position
cell.coords_step = ivec3(0);
cell.coords = ivec3(trace.position * u_intensity_map.inv_spacing + 0.5);
cell.exit_distance = trace.distance;
poly.distances.w = trace.distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif