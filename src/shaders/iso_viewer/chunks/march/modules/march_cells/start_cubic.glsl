
cubic.distances.w = cell.exit_distance;
cubic.values.w = sample_intensity(cell.exit_position);
cubic.errors.w = cubic.values.w - u_rendering.intensity;