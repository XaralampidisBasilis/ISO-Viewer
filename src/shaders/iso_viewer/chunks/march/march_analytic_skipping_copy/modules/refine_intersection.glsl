Trace temp = trace;
vec2 errors = vec2(0.0);
vec2 distances = vec2(0.0);

// update previous trace
temp.distance = trace.distance - ray.step_distance * DECI_TOLERANCE;
distances.x = max(ray.start_distance, temp.distance);
temp.position = camera.position + ray.step_direction * distances.x;
temp.uvw =  temp.position * u_volume.inv_size;
errors.x = texture(u_textures.intensity_map, temp.uvw).r - u_rendering.iso_intensity;

// update next trace 
temp.distance = trace.distance + ray.step_distance * DECI_TOLERANCE;
distances.y = min(ray.end_distance, temp.distance);
temp.position = camera.position + ray.step_direction * distances.y;
temp.uvw = temp.position * u_volume.inv_size;
errors.y = texture(u_textures.intensity_map, temp.uvw).r - u_rendering.iso_intensity;

// Compute iterative bisection method
for (int iter = 0; iter < 10; iter++) 
{
    // update trace
    temp.distance = mix(distances.x, distances.y, 0.5);
    temp.position = camera.position + ray.step_direction * temp.distance;
    temp.uvw = temp.position * u_volume.inv_size;
    temp.intensity = texture(u_textures.intensity_map, temp.uvw).r;
    temp.error = temp.intensity - u_rendering.iso_intensity;

    // update interval
    float interval = step(0.0, errors.x * temp.error);

    errors = mix(
        vec2(errors.x, temp.error), 
        vec2(temp.error, errors.y), 
        interval);

    distances = mix(
        vec2(distances.x, temp.distance), 
        vec2(temp.distance, distances.y), 
        interval);
}

if (abs(trace.error) > abs(temp.error)) 
{
    trace = temp;
}
