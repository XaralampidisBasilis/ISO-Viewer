
float sample_distance_map(in vec3 uvw)
{
    return texture(u_textures.distance_map, uvw).r;
}
