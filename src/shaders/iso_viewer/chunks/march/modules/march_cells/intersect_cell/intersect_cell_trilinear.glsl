
poly3_roots(cubic.roots, cubic.coeffs, 0.0, 1.0);

// update trace 
trace.distance = mmin(cubic.roots);
trace.distance = mix(cell.entry_distance, cell.exit_distance, trace.distance);
trace.position = camera.position + ray.direction * trace.distance;
trace.intersected = (ray.start_distance < trace.distance || trace.distance < ray.end_distance);

// compute error
trace.value = sample_trilinear_volume(trace.position);
trace.error = trace.value - u_rendering.intensity;
