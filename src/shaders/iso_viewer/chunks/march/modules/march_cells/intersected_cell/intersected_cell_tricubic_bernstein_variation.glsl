
#include "./update_quintic"

// Convert the residual polynomial to Bernstein basis using precomputed transformation matrices
mat4x3 bernstein_coeffs = matrixCompMult(quad_bernstein * residuals * cubic_bernstein, quintic_bernstein_weights);

// Collapse the Bernstein coefficient matrix into a coefficients vector by summing anti-diagonals
sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

// Perform early rejection, if all Bernstein coefficients share the same sign, skip intersection
if (sign_change(quintic.bernstein_coeffs))
{
    // Perform root detection in [0,1] by firstly checking sign changes 
    // on sampled residuals, then refined using Bernstein subdivision root finding
    cell.intersected = sign_change(quintic.residuals) || split_bernstein_sign_change(quintic.bernstein_coeffs);

    // Update tests counters for performance statistics
    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// Update fetch counters for performance statistics
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


