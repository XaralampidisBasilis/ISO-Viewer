
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

    cubic.residuals[3] = sample_value_trilinear(cell.exit_position);
    cubic.residuals[3] -= u_rendering.isovalue;

#endif
#if INTERPOLATION_METHOD == 2

    quintic.residuals[3] = sample_value_tricubic(cell.exit_position, quintic.features[3]);
    quintic.residuals[3] -= u_rendering.isovalue;

#endif

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif

