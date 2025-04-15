
vec3 _ray_origin = ray.start_distance * u_intensity_map.inv_dimensions;
vec3 _ray_direction = ray.ray_direction * u_intensity_map.inv_dimensions;

float sample_intensity_map(in float x)
{
    return texture(u_textures.intensity_map, _ray_origin + _ray_direction * x).r;
}

float sample_intensity_map(in vec3 p)
{
    return texture(u_textures.intensity_map, p * u_intensity_map.inv_dimensions).r;
}
