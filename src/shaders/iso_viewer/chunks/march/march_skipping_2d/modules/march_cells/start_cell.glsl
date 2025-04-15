
// start poly
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;

// start poly
poly.distances.w = cell.exit_distance;
poly.intensities.w = sample_intensity_map(poly.distances.w);

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif