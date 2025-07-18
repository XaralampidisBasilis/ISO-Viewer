
// given the start and exit compute the sampling distances inside the cell
cubic.distances = cell.entry_distance + cell.span_distance * cubic.points;

// compute the intensity samples inside the cell from the intensity map texture
cubic.values[0] = cubic.values[3];
cubic.values[1] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[1]);
cubic.values[2] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[2]);
cubic.values[3] = sample_trilinear_volume(camera.position + ray.direction * cubic.distances[3]);
    
// compute intensity errors based on iso value
cubic.residuals = cubic.values - u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic_inv_vander * cubic.residuals;

// check cubic intersection and sign crossings for degenerate cases
cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);

// update stats
#if STATS_ENABLED == 1
stats.num_tests += 1;
stats.num_fetches += 3;
#endif
