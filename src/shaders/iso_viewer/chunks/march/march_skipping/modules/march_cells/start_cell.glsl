
// start cell
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;

// start poly
poly.distances.w = cell.exit_distance;
poly.intensities.w = sample_intensity_map(cell.exit_position);
