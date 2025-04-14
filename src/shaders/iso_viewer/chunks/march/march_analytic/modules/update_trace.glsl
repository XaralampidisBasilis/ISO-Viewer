
// update trace
trace.distance = cell.exit_distance;
trace.position = camera.position + ray.direction * trace.distance; 
trace.uvw = trace.position * u_intensity_map.inv_size;

trace.intensity = poly.intensities.w;
trace.error = trace.intensity - u_rendering.intensity;

// update conditions
trace.terminated = trace.distance > ray.end_distance;

