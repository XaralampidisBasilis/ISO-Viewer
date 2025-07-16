
// start cell
#if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position));
#endif

#if INTERPOLATION_METHOD == 0
cubic.distances[3] = cell.exit_distance;
cubic.values[3] = sample_intensity(cell.exit_position);
cubic.residuals[3] = cubic.values[3] - u_rendering.intensity;
#endif

#if INTERPOLATION_METHOD == 1
poly.residuals[3] = sample_trilaplacian_intensity(cell.exit_position, poly.fxx_fyy_fzz_f[3]);
poly.residuals[3] -= u_rendering.intensity;
#endif

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif

