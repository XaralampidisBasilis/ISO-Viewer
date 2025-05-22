
// Copy shared parameters between adjacent cells
quintic.distances[0] = quintic.distances[5];
quintic.intensities[0] = quintic.intensities[5];
quintic.errors[0] = quintic.errors[5];
// for (int i = 1; i < 6; ++i) {
//     quintic.coefficients[0] += quintic.coefficients[i];
// }

// Compute sampling distances inside the cell
#pragma unroll
for (int i = 1; i < 6; ++i) {
    quintic.distances[i] = mix(cell.entry_distance, cell.exit_distance, quintic.weights[i]);
}

// Sample triquadratic corrected intensities at each distance
#pragma unroll
for (int i = 1; i < 6; ++i) {
    quintic.intensities[i] = sample_laplace_intensity_map(camera.position + ray.direction * quintic.distances[i]).a;
    quintic.errors[i] = quintic.intensities[i] - u_rendering.intensity;
}

// Compute resulted quintic interpolation polynomial coefficients
vec3 i0_i1_i2 = vec3(quintic.intensities[0], quintic.intensities[1], quintic.intensities[2]);
vec3 i3_i4_i5 = vec3(quintic.intensities[3], quintic.intensities[4], quintic.intensities[5]);

vec3 c0_c1_c2 = quintic.inv_vander[0] * i0_i1_i2 + quintic.inv_vander[1] * i3_i4_i5;
vec3 c3_c4_c5 = quintic.inv_vander[2] * i0_i1_i2 + quintic.inv_vander[3] * i3_i4_i5;

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

vec2 i0_i5 = vec2(quintic.intensities[0], quintic.intensities[5]);
cell.intersected = cell.intersected || is_quintic_solvable(quintic.coefficients, u_rendering.intensity, quintic.interval, i0_i5);

