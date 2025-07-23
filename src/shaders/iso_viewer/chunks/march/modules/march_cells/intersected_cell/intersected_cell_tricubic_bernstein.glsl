// Reuse the shared features vector at t = 0 by copying the last sample from the previous cell
quintic.features[0] = quintic.features[3];

// Sample the tricubic function at interior positions along the ray segment
#pragma unroll
for (int i = 1; i < 4; i++) 
{
    // Compute sampling position along the ray at normalized location sampling_points[i]
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    // Sample the packed tricubic features: (fxx, fyy, fzz, f)
    quintic.features[i] = sample_volume_tricubic_features(position);

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

// Convert the residual polynomial to Bernstein basis using precomputed transformation matrices
mat4x3 bernstein_coeffs = quad_bernstein * residuals * cubic_bernstein;

// Apply element-wise scaling to map products of Bernstein bases to the quintic Bernstein basis
bernstein_coeffs = matrixCompMult(bernstein_coeffs, bernstein_product_to_quintic);

// Collapse the Bernstein coefficient matrix into a coefficients vector by summing anti-diagonals
sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

// Compute sign change in berstein coefficients
if (sign_change(quintic.bernstein_coeffs))
{
    // Compute quintic coefficient matrix and sum the anti diagonals
    mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
    sum_anti_diags(coeffs, quintic.coeffs);

    // Compute quintic intersection by evaluating sign changes
    cell.intersected = eval_poly_sign_change(quintic.coeffs);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


