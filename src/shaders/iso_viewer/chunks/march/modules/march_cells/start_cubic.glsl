
cubic.distances.w = cell.exit_distance;
cubic.intensities.w = sample_intensity(cell.exit_position);
cubic.errors.w = cubic.intensities.w - u_rendering.intensity;