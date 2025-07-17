
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

// start interpolant
#if INTERPOLATION_METHOD == 1

    cubic.distances[3] = cell.exit_distance;
    cubic.values[3] = sample_trilinear_volume(cell.exit_position);
    cubic.residuals[3] = cubic.values[3] - u_rendering.intensity;

#endif

#if INTERPOLATION_METHOD == 2

    quintic.residuals[3] = sample_tricubic_volume(cell.exit_position, quintic.fxx_fyy_fzz_f[3]);
    quintic.residuals[3] -= u_rendering.intensity;

#endif

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif

