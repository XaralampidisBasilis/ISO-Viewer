
cubic.distances[3] = cell.exit_distance;
cubic.values[3] = sample_intensity(cell.exit_position);
cubic.errors[3] = cubic.values[3] - u_rendering.intensity;