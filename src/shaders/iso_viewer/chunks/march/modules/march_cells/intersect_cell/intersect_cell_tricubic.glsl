
// Construct the quintic coefficients
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.intensity;
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
sum_anti_diags(coeffs, quintic.coeffs);

// Compute quintic polynomial roots in [0, 1]
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);

// update trace 
trace.distance = mmin(quintic.roots);
trace.distance = mix(cell.entry_distance, cell.exit_distance, trace.distance);
trace.position = camera.position + ray.direction * trace.distance;
trace.intersected = (ray.start_distance < trace.distance || trace.distance < ray.end_distance);

// compute error
trace.value = sample_tricubic_volume(trace.position);
trace.error = trace.value - u_rendering.intensity;
