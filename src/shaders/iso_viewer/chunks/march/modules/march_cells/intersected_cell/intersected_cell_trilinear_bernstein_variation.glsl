
#include "./update_cubic"

// compute berstein coefficients from samples
cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

// If bernstein check allows roots, check analytically
if (sign_change(cubic.bernstein_coeffs))
{
    // check cubic intersection and sign crossings for degenerate cases 
    cell.intersected = sign_change(cubic.residuals) || split_bernstein_sign_change(cubic.bernstein_coeffs);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif
