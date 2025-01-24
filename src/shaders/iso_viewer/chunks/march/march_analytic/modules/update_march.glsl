
// update previous
prev_trace = trace;

// update trace
trace.distance = cell.exit_distance;
trace.uvw = trace.position * u_volume.inv_size;
trace.position = camera.position + ray.step_direction * trace.distance; 
trace.intensity = cell.sample_intensities.y;
trace.error = trace.intensity - u_rendering.iso_intensity;

// update conditions
trace.terminated = trace.distance > ray.end_distance;
trace.exhausted = trace.step_count >= ray.max_step_count;

