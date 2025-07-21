
// given the start and exit compute the sampling distances inside the cell
cubic.distances = cell.entry_distance + cell.span_distance * cubic.points;

// compute the intensity samples inside the cell from the intensity map texture
cubic.residuals[0] = cubic.residuals[3];
cubic.residuals[1] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[1]) - u_rendering.intensity;
cubic.residuals[2] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[2]) - u_rendering.intensity;
cubic.residuals[3] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[3]) - u_rendering.intensity;
    
// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic.residuals * cubic_inv_vander;

// check cubic intersection and sign crossings for degenerate cases
cell.intersected = is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw) || sign_change(cubic.residuals);

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_tests += 1;
#endif
