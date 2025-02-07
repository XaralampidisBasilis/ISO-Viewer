
// compute solution
vec3 solutions = cubic_solver(cell.intensity_coeffs, u_rendering.intensity);
vec3 is_inside = inside_closed(0.0, 1.0, solutions);
float min_solution = mmin(mmix(1.0, solutions, is_inside));

// update trace 
trace.distance = mix(cell.sample_distances.x, cell.sample_distances.w, min_solution);
trace.position = camera.position + ray.direction * trace.distance; 
trace.uvw = trace.position * u_intensity_map.inv_size; 
trace.intensity = texture(u_textures.intensity_map, trace.uvw).r;
trace.error = trace.intensity - u_rendering.intensity;
