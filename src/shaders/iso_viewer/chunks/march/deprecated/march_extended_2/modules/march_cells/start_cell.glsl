
// start cell
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

// start cubic
cubic.distances.w = cell.exit_distance;
cubic.intensities.w = sample_intensity(cell.exit_position);
cubic.errors.w = cubic.intensities.w - u_rendering.intensity;
