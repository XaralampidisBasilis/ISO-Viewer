
// compute minimum intersection inside the cell
vec3 roots = degenerate_roots(poly.coefficients, poly.interval.y);
bvec3 is_inside = inside_closed(poly.interval.x, poly.interval.y, roots);
roots = pick(is_inside, roots, poly.interval.y);
float root = mmin(roots);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity_map(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
