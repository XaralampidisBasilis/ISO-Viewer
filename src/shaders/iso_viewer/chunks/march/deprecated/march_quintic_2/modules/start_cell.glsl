
// start cell
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position));

// start quartic
quintic.distances[5] = cell.exit_distance;
quintic.values[5] = sample_trilaplacian_intensity(cell.exit_position);
quintic.errors[5] = quintic.values[5] - u_rendering.intensity;