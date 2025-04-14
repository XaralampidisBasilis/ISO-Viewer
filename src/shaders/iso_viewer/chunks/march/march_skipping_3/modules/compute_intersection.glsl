
// Compute intersection solutions
poly.roots = cubic_solver(poly.coefficients, 0.0);

// Filter solutions
vec3 is_inside = vec3(inside_closed(0.0, 1.0, poly.roots));
float solution = mmin(mmix(1.0, poly.roots, is_inside));

// Compute trace position
trace.distance = mix(cell.entry_distance, cell.exit_distance, solution);
trace.position = camera.position + ray.direction * trace.distance; 
trace.uvw = trace.position * u_intensity_map.inv_size; 

// Compute trace intensity
trace.intensity = texture(u_textures.intensity_map, trace.uvw).r;
trace.error = trace.intensity - u_rendering.intensity;

// Compute trace gradient
#include "./compute_gradient"
