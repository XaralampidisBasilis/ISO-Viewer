
// start trace
trace.distance = ray.start_distance;
trace.position = camera.position + ray.step_direction * trace.distance;
prev_trace = trace;

// start cell
cell.coords = ivec3(ray.start_position * u_volume.inv_spacing + 0.5);
cell.exit_distance = ray.start_distance;
cell.sample_distances.w = ray.start_distance;
cell.sample_intensities.w = texture(u_textures.intensity_map, camera.texture_position + ray.texture_direction * cell.distances.w).r;
