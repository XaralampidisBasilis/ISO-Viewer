
trace.distance = ray.start_distance;
trace.position = camera.position + ray.direction * trace.distance;

cell.coords_step = ivec3(0);
cell.coords = ivec3(trace.position * u_intensity_map.inv_spacing + 0.5);
