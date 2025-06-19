
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
vec3 y0_y1_y2 = vec3(
    quintic.errors[0], 
    quintic.errors[1], 
    quintic.errors[2]
);

vec3 y3_y4_y5 = vec3(
    quintic.errors[3], 
    quintic.errors[4], 
    quintic.errors[5]
);

vec2 y0_y5 = vec2(
    quintic.errors[0], 
    quintic.errors[5]
);

// Perform broken 6 x 6 matrix multiplication
vec3 c0_c1_c2 = quintic.inv_vander[0] * y0_y1_y2 + quintic.inv_vander[2] * y3_y4_y5;
vec3 c3_c4_c5 = quintic.inv_vander[1] * y0_y1_y2 + quintic.inv_vander[3] * y3_y4_y5;

// Compute resulted quintic interpolation polynomial coefficients
quintic.coeffs = float[6](
    c0_c1_c2[0], 
    c0_c1_c2[1], 
    c0_c1_c2[2], 
    c3_c4_c5[0], 
    c3_c4_c5[1], 
    c3_c4_c5[2]
);


// Compute berstein coefficients and check if no roots
vec3 b0_b1_b2 = quintic.pow_bernstein[0] * c0_c1_c2 + quintic.pow_bernstein[1] * c3_c4_c5;
vec3 b3_b4_b5 = quintic.pow_bernstein[2] * c3_c4_c5;    

// Compute resulted quintic bernstein polynomial coefficients
quintic.bcoeffs = float[6](
    b0_b1_b2[0], 
    b0_b1_b2[1], 
    b0_b1_b2[2], 
    b3_b4_b5[0], 
    b3_b4_b5[1], 
    b3_b4_b5[2]
);

// If bernstein bounds allow for a root
if ((mmin(quintic.bcoeffs) < 0.0) != (mmax(quintic.bcoeffs) < 0.0))
{
    // Compute sign changes for degenerate cases
    cell.intersected = 
        (quintic.errors[0] * quintic.errors[1] <= 0.0) ||
        (quintic.errors[1] * quintic.errors[2] <= 0.0) ||
        (quintic.errors[2] * quintic.errors[3] <= 0.0) ||
        (quintic.errors[3] * quintic.errors[4] <= 0.0) ||
        (quintic.errors[4] * quintic.errors[5] <= 0.0);

    // Compute analytic intersection.
    cell.intersected = cell.intersected || is_quintic_solvable(quintic.coeffs, quintic.interval, y0_y5);
}

