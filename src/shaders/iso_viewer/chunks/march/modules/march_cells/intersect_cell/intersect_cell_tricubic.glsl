
// Construct the quintic coefficients
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.isovalue;
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
sum_anti_diags(coeffs, quintic.coeffs);

// Compute quintic polynomial roots in [0, 1]
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
