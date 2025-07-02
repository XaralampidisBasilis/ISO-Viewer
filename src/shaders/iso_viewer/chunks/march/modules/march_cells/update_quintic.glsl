
// Compute sampling distances inside the cell
quintic.distances[0] = quintic.distances[5];
quintic.distances[1] = mix(cell.entry_distance, cell.exit_distance, quintic.points[1]);
quintic.distances[2] = mix(cell.entry_distance, cell.exit_distance, quintic.points[2]);
quintic.distances[3] = mix(cell.entry_distance, cell.exit_distance, quintic.points[3]);
quintic.distances[4] = mix(cell.entry_distance, cell.exit_distance, quintic.points[4]);
quintic.distances[5] = mix(cell.entry_distance, cell.exit_distance, quintic.points[5]);

// Sample triquadratic corrected intensities at each distance
quintic.values[0] = quintic.values[5];
quintic.values[1] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[1]);
quintic.values[2] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[2]);
quintic.values[3] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[3]);
quintic.values[4] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[4]);
quintic.values[5] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[5]);

// errors
quintic.errors[0] = quintic.errors[5];
quintic.errors[1] = quintic.values[1] - u_rendering.intensity;
quintic.errors[2] = quintic.values[2] - u_rendering.intensity;
quintic.errors[3] = quintic.values[3] - u_rendering.intensity;
quintic.errors[4] = quintic.values[4] - u_rendering.intensity;
quintic.errors[5] = quintic.values[5] - u_rendering.intensity;

// Compute resulted quintic interpolation polynomial coefficients
vec3 r0_r1_r2 = vec3(
    quintic.errors[0], 
    quintic.errors[1], 
    quintic.errors[2]
);

vec3 r3_r4_r5 = vec3(
    quintic.errors[3], 
    quintic.errors[4], 
    quintic.errors[5]
);

#if BERNSTEIN_SKIP_ENABLED == 0

    // Perform broken 6 x 6 matrix multiplication
    vec3 c0_c1_c2 = quintic.inv_vander[0] * r0_r1_r2 + quintic.inv_vander[2] * r3_r4_r5;
    vec3 c3_c4_c5 = quintic.inv_vander[1] * r0_r1_r2 + quintic.inv_vander[3] * r3_r4_r5;

    // Compute resulted quintic interpolation polynomial coefficients
    quintic.coeffs[0] = c0_c1_c2[0];
    quintic.coeffs[1] = c0_c1_c2[1];
    quintic.coeffs[2] = c0_c1_c2[2];
    quintic.coeffs[3] = c3_c4_c5[0];
    quintic.coeffs[4] = c3_c4_c5[1];
    quintic.coeffs[5] = c3_c4_c5[2];

    // Compute analytic intersection, and sign crossings for degenerate cases
    cell.intersected = eval_poly_sign_change(quintic.coeffs);

    #if STATS_ENABLED == 1
    stats.num_checks += 1;
    #endif

#else

    // Compute berstein coefficients and check if no roots
    vec3 b0_b1_b2 = quintic.sample_bernstein[0] * r0_r1_r2 + quintic.sample_bernstein[2] * r3_r4_r5;
    vec3 b3_b4_b5 = quintic.sample_bernstein[1] * r0_r1_r2 + quintic.sample_bernstein[3] * r3_r4_r5;

    // Compute resulted quintic bernstein polynomial coefficients
    quintic.bcoeffs[0] = b0_b1_b2[0];
    quintic.bcoeffs[1] = b0_b1_b2[1];
    quintic.bcoeffs[2] = b0_b1_b2[2];
    quintic.bcoeffs[3] = b3_b4_b5[0];
    quintic.bcoeffs[4] = b3_b4_b5[1];
    quintic.bcoeffs[5] = b3_b4_b5[2];

    // If bernstein check allows roots, check analytically
    if (sign_change(quintic.bcoeffs))
    {
        // Perform broken 6 x 6 matrix multiplication
        vec3 c0_c1_c2 = quintic.inv_vander[0] * r0_r1_r2 + quintic.inv_vander[2] * r3_r4_r5;
        vec3 c3_c4_c5 = quintic.inv_vander[1] * r0_r1_r2 + quintic.inv_vander[3] * r3_r4_r5;

        // Compute resulted quintic interpolation polynomial coefficients
        quintic.coeffs[0] = c0_c1_c2[0];
        quintic.coeffs[1] = c0_c1_c2[1];
        quintic.coeffs[2] = c0_c1_c2[2];
        quintic.coeffs[3] = c3_c4_c5[0];
        quintic.coeffs[4] = c3_c4_c5[1];
        quintic.coeffs[5] = c3_c4_c5[2];

        // Compute analytic intersection, and sign crossings for degenerate cases
        cell.intersected = eval_poly_sign_change(quintic.coeffs);

        #if STATS_ENABLED == 1
        stats.num_checks += 1;
        #endif
    }   

#endif

