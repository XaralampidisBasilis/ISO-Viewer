
#include "./update_cubic"

// compute berstein coefficients from samples
cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

// If bernstein check allows roots, check analytically
if (sign_change(cubic.bernstein_coeffs))
{
    // from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
    cubic.coeffs = cubic.residuals * cubic_inv_vander;

    // check cubic intersection and sign crossings for degenerate cases 
    cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
