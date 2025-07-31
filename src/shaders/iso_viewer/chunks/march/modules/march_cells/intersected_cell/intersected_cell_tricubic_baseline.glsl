
#include "./update_quintic"

// Reconstruct the quintic polynomial coefficients from the residual matrix
// Using inverse Vandermonde matrices for quadratic and cubic interpolation
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;

// Extract final quintic coefficients by summing the anti-diagonals of the matrix
// Each anti-diagonal corresponds to a coefficient basis term
sum_anti_diags(coeffs, quintic.coeffs);

// Perform root detection in [0,1] by checking sign changes:
// First on sampled residuals (fast), then refined on polynomial coefficients (fallback)
cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);

// Update fetch/test counters for performance statistics
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_tests += 1;
#endif
