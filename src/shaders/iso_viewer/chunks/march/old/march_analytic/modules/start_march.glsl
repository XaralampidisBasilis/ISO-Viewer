
// compute trace at ray start position
trace.distance = ray.start_distance;
trace.position = camera.position + ray.direction * trace.distance;
trace.uvw = trace.position * u_intensity_map.inv_size;

// compute cell at ray start position
cell.coords_step = ivec3(0);
cell.coords = ivec3(ray.start_position * u_intensity_map.inv_spacing + 0.5);
cell.exit_distance = ray.start_distance;

// start poly interpolation
poly.distances.w = ray.start_distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;
