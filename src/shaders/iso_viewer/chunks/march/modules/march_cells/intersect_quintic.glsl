#if HYBRID_METHOD == 1

    quintic.distances[1] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[1]);
    quintic.distances[4] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[4]);

    quintic.intensities[1] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[1], quintic.corrections[1]);
    quintic.intensities[4] = sample_trilaplacian_intensity(camera.position + ray.direction * quintic.distances[4], quintic.corrections[4]);

    quintic.errors[1] = quintic.intensities[1] - u_rendering.intensity;
    quintic.errors[4] = quintic.intensities[4] - u_rendering.intensity;

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

#endif

poly5_roots(quintic.roots, quintic.coeffs, cubic.interval.x, cubic.interval.y);

float hit_distance = quintic.roots[5];
hit_distance = min(hit_distance, quintic.roots[0]);
hit_distance = min(hit_distance, quintic.roots[1]);
hit_distance = min(hit_distance, quintic.roots[2]);
hit_distance = min(hit_distance, quintic.roots[3]);
hit_distance = min(hit_distance, quintic.roots[4]);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, hit_distance);
trace.position = mix(cell.entry_position, cell.exit_position, hit_distance);
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_trilaplacian_intensity(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
