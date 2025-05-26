
// start cell
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position));

// start quartic
quintic.distances[5] = cell.exit_distance;
quintic.intensities[5] = sample_laplacians_intensity_map(cell.exit_position).a;
quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;