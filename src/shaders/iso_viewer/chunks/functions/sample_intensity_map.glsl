
float sample_intensity_map(in vec3 uvw)
{
    return texture(u_textures.intensity_map, uvw).r;
}
