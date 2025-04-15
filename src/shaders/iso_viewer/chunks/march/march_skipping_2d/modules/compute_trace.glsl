
// compute solution
vec3 solutions = cubic_solver(poly.coefficients, u_rendering.intensity);
vec3 is_inside = inside_closed(0.0, 1.0, solutions);
float min_solution = mmin(select(is_inside, solutions, vec3(1.0)));

// update trace 
trace.distance = mix(poly.distances.x, poly.distances.w, min_solution);
trace.position = ray.start_position + ray.direction * trace.distance; 
trace.terminated = trace.distance > ray.span_distance;
trace.intersected = !trace.terminated;


