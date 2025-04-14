
// compute distances
vec2 cell_intersections = intersect_box(cell.min_position, cell.max_position, camera.position, ray.direction);
cell_intersections = clamp(cell_intersections, box.entry_distance, box.exit_distance);
cell.entry_distance = cell_intersections.x;
cell.exit_distance = cell_intersections.y;
poly.distances = mmix(cell.entry_distance, cell.exit_distance, poly.weights);

// compute intensities
poly.intensities.x = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.x).r;
poly.intensities.y = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.y).r;
poly.intensities.z = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.z).r;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;

// compute coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// compute solution
vec3 iso_distances = cubic_solver(poly.coefficients, u_rendering.intensity);
bvec3 is_inside = inside_closed(0.0, 1.0, iso_distances);
float iso_distance = mmin(mmix(1.0, iso_distances, vec3(is_inside)));

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, iso_distance);
trace.position = camera.position + ray.direction * trace.distance; 
trace.uvw = trace.position * u_intensity_map.inv_size; 
trace.intensity = texture(u_textures.intensity_map, trace.uvw).r;
trace.error = trace.intensity - u_rendering.intensity;
