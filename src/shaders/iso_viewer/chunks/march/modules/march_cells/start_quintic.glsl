
quintic.distances[5] = cell.exit_distance;
quintic.intensities[5] = sample_trilaplacian_intensity(cell.exit_position, quintic.corrections[5]);
quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;