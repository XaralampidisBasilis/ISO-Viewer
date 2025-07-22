
// Compute cubic coefficients
cubic.coeffs = cubic.residuals * cubic_inv_vander;

// Compute cubic polynomial roots in [0, 1]
poly3_roots(cubic.roots, cubic.coeffs, 0.0, 1.0);

