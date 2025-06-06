

float roots[4];
float coeffs[4] = float[4](cubic.coeffs.x, cubic.coeffs.y, cubic.coeffs.z, cubic.coeffs.w);

poly3_roots(roots, coeffs, cubic.interval.x, cubic.interval.y);
cubic.roots = vec3(roots[0], roots[1], roots[2]);

float root = roots[3];
root = min(root, roots[0]);
root = min(root, roots[1]);
root = min(root, roots[2]);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
