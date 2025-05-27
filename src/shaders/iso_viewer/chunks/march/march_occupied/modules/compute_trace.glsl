
// compute minimum intersection inside the cell
cubic.roots = degenerate_roots(cubic.coefficients, cubic.interval.y);

bvec3 is_inside = inside_closed(cubic.interval.x, cubic.interval.y, cubic.roots);
cubic.roots = pick(is_inside, cubic.roots, cubic.interval.y);
float root = mmin(cubic.roots);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
