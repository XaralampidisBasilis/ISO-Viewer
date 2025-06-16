
// start cell
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

// start quartic
quintic.distances[5] = cell.exit_distance;
quintic.intensities[5] = sample_trilaplacian_intensity(cell.exit_position).a;
quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;

#if INTERPOLATION_METHOD == 0
    cubic.distances.w = cell.exit_distance;
    cubic.intensities.w = sample_intensity(cell.exit_position);
    cubic.errors.w = cubic.intensities.w - u_rendering.intensity;

#elif INTERPOLATION_METHOD == 1
    quintic.distances[5] = cell.exit_distance;
    quintic.intensities[5] = sample_trilaplacian_intensity(cell.exit_position).a;
    quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;
#endif