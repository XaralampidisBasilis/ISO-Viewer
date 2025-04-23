
// compute solution
vec3 solutions = cubic_solver(poly.coefficients, u_rendering.intensity);
bvec3 is_inside = inside_closed(0.0, 1.0, solutions);
float solution = mmin(select(is_inside, solutions, vec3(1.0)));

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, solution);
trace.position = camera.position + ray.direction * trace.distance; 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity_map(trace.position);
trace.error = trace.intensity - u_rendering.intensity;

