
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);

// update trace 
trace.distance = mmin(quintic.roots);
trace.distance = mix(cell.entry_distance, cell.exit_distance, trace.distance);
trace.position = camera.position + ray.direction * trace.distance;
trace.intersected = (ray.start_distance < trace.distance || trace.distance < ray.end_distance);

// compute error
trace.intensity = compute_tricubic_value(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
