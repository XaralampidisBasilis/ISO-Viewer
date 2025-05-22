
// Copy shared parameters between adjacent cells
quintic.distances[0] = quintic.distances[5];
quintic.intensities[0] = quintic.intensities[5];
quintic.errors[0] = quintic.errors[5];

// Compute sampling distances inside the cell
#pragma unroll
for (int i = 1; i < 6; ++i) {
    quintic.distances[i] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[i]);
}

// Sample triquadratic corrected intensities at each distance
#pragma unroll
for (int i = 1; i < 6; ++i) {
    quintic.intensities[i] = sample_intensity_map(camera.position + ray.direction * quintic.distances[i]);
    quintic.errors[i] = quintic.intensities[i] - u_rendering.intensity;
}

// Compute resulted quintic interpolation polynomial coefficients
vec3 y0_y1_y2 = vec3(quintic.errors[0], quintic.errors[1], quintic.errors[2]);
vec3 y3_y4_y5 = vec3(quintic.errors[3], quintic.errors[4], quintic.errors[5]);

vec3 c0_c1_c2 = quintic.inv_vander[0] * y0_y1_y2 + quintic.inv_vander[1] * y3_y4_y5;
vec3 c3_c4_c5 = quintic.inv_vander[2] * y0_y1_y2 + quintic.inv_vander[3] * y3_y4_y5;

quintic.coefficients = float[6](
    c0_c1_c2[0], c0_c1_c2[1], c0_c1_c2[2], 
    c3_c4_c5[0], c3_c4_c5[1], c3_c4_c5[2]
);

// Detect sign changes between samples. If none, compute analytic intersection with the triquadratic isosurface.
cell.intersected = false;
#pragma unroll
for (int i = 0; i < 5; ++i) {
    cell.intersected = cell.intersected || (quintic.errors[i] * quintic.errors[i + 1] <= 0.0);
}

vec2 y0_y5 = vec2(quintic.errors[0], quintic.errors[5]);
cell.intersected = cell.intersected || is_quintic_solvable(quintic.coefficients, 0.0, quintic.interval, y0_y5);

