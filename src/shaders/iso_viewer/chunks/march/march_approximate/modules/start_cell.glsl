
// compute cell at ray start position
cell.coords_step = ivec3(0);
cell.coords = ivec3(trace.position * u_intensity_map.inv_spacing + 0.5);
cell.exit_distance = trace.distance;
cell.sample_distances.z = trace.distance;
cell.sample_intensities.z = texture(u_textures.intensity_map, camera.uvw + ray.uvw_direction * cell.sample_distances.z).r;

// Update stats
#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif