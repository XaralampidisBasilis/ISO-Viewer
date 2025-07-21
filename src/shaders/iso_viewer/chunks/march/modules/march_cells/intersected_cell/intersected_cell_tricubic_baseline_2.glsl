
vec3 p1 = mix(cell.entry_position, cell.exit_position, quintic.points[1]);
vec3 p2 = mix(cell.entry_position, cell.exit_position, quintic.points[2]);
vec3 p3 = mix(cell.entry_position, cell.exit_position, quintic.points[3]);

quintic.features[0] = quintic.features[3];
quintic.features[1] = sample_tricubic_volume(p1);
quintic.features[2] = sample_tricubic_volume(p2);
quintic.features[3] = sample_tricubic_volume(p3);

quintic.biases[0] = tricubic_bias(p1);
quintic.biases[1] = tricubic_bias(p2);
quintic.biases[2] = tricubic_bias(p3);

// Construct the trilinear cubic coefficients
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.intensity;

// Compute quintic coefficient matrix and sum the anti diagonals
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
sum_anti_diags(coeffs, quintic.coeffs);

// Compute quintic intersection by evaluating sign changes
float t = 0.0;
float t2 = t * t;
float t3 = t2 * t;
vec4 pt = vec4(1.0, t, t2, t3);
float value = dot(pt.xyz, coeffs * pt);

#pragma unroll
for (int i = 1; i <= 16; i++)
{
    float t = float(i)/16.0;
    float t2 = t * t;
    float t3 = t2 * t;
    vec4 pt = vec4(1.0, t, t2, t3);

    float temp = dot(pt.xyz, coeffs * pt);
    cell.intersected = cell.intersected || sign_change(temp, value);
    value = temp;
}

// update stats
#if STATS_ENABLED == 1
stats.num_fetches += 3;
stats.num_tests += 1;
#endif



