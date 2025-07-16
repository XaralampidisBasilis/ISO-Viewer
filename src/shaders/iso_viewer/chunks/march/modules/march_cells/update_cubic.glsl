
// given the start and exit compute the sampling distances inside the cell
cubic.distances[0] = cubic.distances[3];
cubic.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, cubic.points.yzw);

// compute the intensity samples inside the cell from the intensity map texture
cubic.values[0] = cubic.values[3];
cubic.values[1] = sample_intensity(camera.position + ray.direction * cubic.distances[1]);
cubic.values[2] = sample_intensity(camera.position + ray.direction * cubic.distances[2]);
cubic.values[3] = sample_intensity(camera.position + ray.direction * cubic.distances[3]);
    
// compute intensity errors based on iso value
cubic.residuals[0] = cubic.residuals[3];
cubic.residuals.yzw = cubic.values.yzw - u_rendering.intensity;

#if BERNSTEIN_SKIP_ENABLED == 0
// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic.inv_vander * cubic.residuals;

// check cubic intersection and sign crossings for degenerate cases
cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);

#if STATS_ENABLED == 1
stats.num_checks += 1;
#endif

#else
// compute berstein coefficients from samples
cubic.bcoeffs = cubic.sample_bernstein * cubic.residuals;

// If bernstein check allows roots, check analytically
if (sign_change(cubic.bcoeffs))
{
    // from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
    cubic.coeffs = cubic.inv_vander * cubic.residuals;

    cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, cubic.interval, cubic.residuals.xw);

    #if STATS_ENABLED == 1
    stats.num_checks += 1;
    #endif
}

#endif

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
