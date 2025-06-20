
// Compute sampling distances inside the cell
quintic.distances[0] = quintic.distances[5];
quintic.distances[1] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[1]);
quintic.distances[2] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[2]);
quintic.distances[3] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[3]);
quintic.distances[4] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[4]);
quintic.distances[5] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[5]);

// Sample triquadratic corrected intensities at each distance
quintic.intensities[0] = quintic.intensities[5];
quintic.intensities[1] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[1]);
quintic.intensities[2] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[2]);
quintic.intensities[3] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[3]);
quintic.intensities[4] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[4]);
quintic.intensities[5] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[5]);

// errors
quintic.errors[0] = quintic.errors[5];
quintic.errors[1] = quintic.intensities[1] - u_rendering.intensity;
quintic.errors[2] = quintic.intensities[2] - u_rendering.intensity;
quintic.errors[3] = quintic.intensities[3] - u_rendering.intensity;
quintic.errors[4] = quintic.intensities[4] - u_rendering.intensity;
quintic.errors[5] = quintic.intensities[5] - u_rendering.intensity;

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

vec2 r0_r5 = vec2(
    quintic.errors[0], 
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

    // Compute analytic intersection.
    cell.intersected = is_quintic_solvable(quintic.coeffs, quintic.interval, r0_r5);

    // Compute sign changes for degenerate cases
    cell.intersected = cell.intersected  ||
    (quintic.errors[0] < 0.0) != (quintic.errors[1] < 0.0) ||
    (quintic.errors[1] < 0.0) != (quintic.errors[2] < 0.0) ||
    (quintic.errors[2] < 0.0) != (quintic.errors[3] < 0.0) ||
    (quintic.errors[3] < 0.0) != (quintic.errors[4] < 0.0) ||
    (quintic.errors[4] < 0.0) != (quintic.errors[5] < 0.0);

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

    // Compute berstein coefficients signs check to detect no intersection
    cell.intersected = (mmin(quintic.bcoeffs) < 0.0) != (mmax(quintic.bcoeffs) < 0.0);

    // If bernstein check allows roots, check analytically
    if (cell.intersected)
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

        // Compute analytic intersection.
        cell.intersected = is_quintic_solvable(quintic.coeffs, quintic.interval, r0_r5);

        // Compute sign changes for degenerate cases
        cell.intersected = cell.intersected  ||
        (quintic.errors[0] < 0.0) != (quintic.errors[1] < 0.0) ||
        (quintic.errors[1] < 0.0) != (quintic.errors[2] < 0.0) ||
        (quintic.errors[2] < 0.0) != (quintic.errors[3] < 0.0) ||
        (quintic.errors[3] < 0.0) != (quintic.errors[4] < 0.0) ||
        (quintic.errors[4] < 0.0) != (quintic.errors[5] < 0.0);
    }   

#endif
