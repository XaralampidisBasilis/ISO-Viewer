
// start cell
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

// start quartic
quintic.distances[5] = cell.exit_distance;
quintic.intensities[5] = sample_trilaplacian_intensity(cell.exit_position);
quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;