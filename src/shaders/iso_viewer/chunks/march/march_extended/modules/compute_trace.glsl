
// compute minimum intersection inside the cell
vec3 roots = cubic_solver(poly.coefficients, u_rendering.intensity);
bvec3 is_inside = inside_closed(poly.interval.x, poly.interval.y, roots);
vec3 valid_roots = mix(vec3(poly.interval.y), roots, is_inside);
float root = mmin(valid_roots);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity_map(trace.position);
trace.error = trace.intensity - u_rendering.intensity;

