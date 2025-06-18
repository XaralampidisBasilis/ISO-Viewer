
// start cell
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position));

// start cubic
cubic.distances.w = cell.exit_distance;
cubic.intensities.w = sample_intensity(cell.exit_position);
cubic.errors.w = cubic.intensities.w - u_rendering.intensity;
