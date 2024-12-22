

// update position
trace.distance += ray.step_distance * u_rendering.min_step_scaling;
trace.position = camera.position + ray.step_direction * trace.distance; 

// update position
voxel.coords = ivec3(trace.position * u_volume.inv_spacing);
voxel.texture_coords = trace.position * u_volume.inv_size;
voxel.value = max(voxel.value, texture(u_textures.taylor_map, voxel.texture_coords).r);

// update conditions
trace.terminated = trace.distance > ray.end_distance;
// trace.exhausted = trace.step_count >= ray.max_step_count;
voxel.saturated = ray.max_value - voxel.value < MILLI_TOLERANCE;