// Advance one cell using the face distances initialized by start_cell.
#if DEBUG_ENABLED == 1
cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;
#endif

cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

cell.exit_distance = intersectCellFarDistances(cell.coords, cell_far_distances, cell.exit_normal);
cell.exit_position = camera.position + ray.direction * cell.exit_distance;
cell.span_distance = cell.exit_distance - cell.entry_distance;

cell.coords += cell.exit_normal * ray.signs;
cell_far_distances = advanceCellFarDistances(cell_far_distances, cell_step_distances, cell.exit_distance, cell.exit_normal);
cell.terminated = cell.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_cells += 1;
#endif
