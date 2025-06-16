
float cubic_roots[4];
float cubic_coeffs[4] = float[4](cubic.coeffs.x, cubic.coeffs.y, cubic.coeffs.z, cubic.coeffs.w);
poly3_roots(cubic_roots, cubic_coeffs, cubic.interval.x, cubic.interval.y);
cubic.roots = vec3(cubic_roots[0], cubic_roots[1], cubic_roots[2]);

float hit_distance = cubic_roots[3];
hit_distance = min(hit_distance, cubic_roots[0]);
hit_distance = min(hit_distance, cubic_roots[1]);
hit_distance = min(hit_distance, cubic_roots[2]);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, hit_distance);
trace.position = mix(cell.entry_position, cell.exit_position, hit_distance);
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
