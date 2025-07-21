
// compute the intensity samples inside the cell from the intensity map texture
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_trilinear_volume(position) - u_rendering.intensity;
}

// compute berstein coefficients from samples
cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

// If bernstein check allows roots, check analytically
if (sign_change(cubic.bernstein_coeffs))
{
    // check cubic intersection and sign crossings for degenerate cases 
    cell.intersected = sign_change(cubic.residuals) || split_bernstein_sign_change(cubic.coeffs);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
