
// compute solution
vec3 solutions = cubic_solver(poly.coefficients, u_rendering.intensity);
bvec3 is_inside = inside_closed(0.0, 1.0, solutions);
float min_solution = mmin(mmix(1.0, solutions, vec3(is_inside)));

// update trace 
trace.distance = mix(poly.distances.x, poly.distances.w, min_solution);
trace.position = ray.start_position + ray.direction * trace.distance; 
trace.intensity = sample_intensity_map(trace.distance);
trace.error = trace.intensity - u_rendering.intensity;

#include "./compute_gradient"

