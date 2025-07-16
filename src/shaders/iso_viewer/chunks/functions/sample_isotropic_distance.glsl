

int sample_isotropic_distance(in ivec3 coords, out bool occupancy)
{
    int distance = int(texelFetch(u_textures.isotropic_distance_map, coords, 0).r);
    occupancy = (distance == 0);

    return distance;
}
