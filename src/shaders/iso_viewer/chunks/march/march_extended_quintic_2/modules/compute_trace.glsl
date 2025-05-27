

float root = newton_bisection_root(quintic.coefficients, cubic.interval);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_trilaplacian_intensity(trace.position).a;
trace.error = trace.intensity - u_rendering.intensity;
