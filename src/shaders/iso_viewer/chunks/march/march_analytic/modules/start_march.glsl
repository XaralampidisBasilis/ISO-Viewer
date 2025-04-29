
// start cell
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position));

// start poly
poly.distances.w = cell.exit_distance;
poly.intensities.w = sample_intensity_map(cell.exit_position);
