
// compute the intensity samples inside the cell from the intensity map texture
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_trilinear_volume(position) - u_rendering.intensity;
}

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
cubic.coeffs = cubic.residuals * cubic_inv_vander;

// check cubic intersection and sign crossings for degenerate cases
cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_tests += 1;
#endif
