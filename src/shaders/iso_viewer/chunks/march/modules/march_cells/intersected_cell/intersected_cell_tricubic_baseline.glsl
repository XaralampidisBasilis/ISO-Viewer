// Reuse the shared features vector at t = 0 by copying the last sample from the previous cell
quintic.features[0] = quintic.features[3];

// Sample the tricubic function at interior positions along the ray segment
#pragma unroll
for (int i = 1; i < 4; i++) 
{
    // Compute sampling position along the ray at normalized location sampling_points[i]
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    // Sample the packed tricubic features: (fxx, fyy, fzz, f)
    quintic.features[i] = tricubic_features(position);

    // Compute the bias vector corresponding to quadratic correction terms
    quintic.biases[i - 1] = tricubic_bias(position);
}

// Construct the residual matrix: subtract isovalue from interpolated samples
// Resulting residuals encode scalar deviation from the isovalue at each sample point
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.isovalue;

// Extract the residual values along the diagonal
// Also propagate the initial sample from the previous cell
quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

// Compute sign change between residual values
// If sign change detected terminate and declare intersection
if (sign_change(quintic.residuals))
{
    cell.intersected = true;
    break;
}

// Reconstruct the quintic polynomial coefficients from the residual matrix
// Using inverse Vandermonde matrices for quadratic and cubic interpolation
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;

// Extract final quintic coefficients by summing the anti-diagonals of the matrix
// Each anti-diagonal corresponds to a coefficient basis term
sum_anti_diags(coeffs, quintic.coeffs);

// Perform root detection in [0,1] by checking sign changes:
// First on sampled residuals (fast), then refined on polynomial coefficients (fallback)
cell.intersected = eval_poly_sign_change(quintic.coeffs);

// Update fetch/test counters for performance statistics
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_tests += 1;
#endif
