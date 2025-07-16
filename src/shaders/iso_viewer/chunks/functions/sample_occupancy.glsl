

bool sample_occupancy(in ivec3 coords)
{
    bool occupancy = bool(texelFetch(u_textures.occupancy_map, coords, 0).r);

    return occupancy;
}
    