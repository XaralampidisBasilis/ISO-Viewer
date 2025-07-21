
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    quintic.features[i] = sample_tricubic_features(position);
    quintic.biases[i-1] = tricubic_bias(position);
}

// Construct the trilinear cubic coefficients
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.intensity;
quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

// Compute berstein coefficients matrix 
mat4x3 bernstein_coeffs = quad_bernstein * residuals * cubic_bernstein;
bernstein_coeffs = matrixCompMult(bernstein_coeffs, quintic_bernstein_weights);

// Compute berstein coefficients by summing the anti diagonals
sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

// Compute sign change in berstein coefficients
if (sign_change(quintic.bernstein_coeffs))
{
    // Compute quintic intersection by evaluating sign changes
    cell.intersected = sign_change(quintic.residuals) || split_bernstein_sign_change(quintic.bernstein_coeffs);

    #if STATS_ENABLED == 1
    stats.num_tests += 1;
    #endif
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
#endif


