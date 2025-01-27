
void update_trace_from_distance(in float distance)
{
    trace.distance = distance;
    trace.position = camera.position + ray.step_direction * trace.distance; 
    trace.uvw = trace.position * u_volume.inv_size; 
    trace.intensity = texture(u_textures.intensity_map, voxel.texture_coords).r;
    trace.error = trace.intensity - u_rendering.iso_intensity;
}