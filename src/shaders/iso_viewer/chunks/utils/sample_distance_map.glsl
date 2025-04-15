

int sample_distance_map(in ivec3 coords)
{
    return texelFetch(u_textures.distance_map, coords, 0).r;
}
