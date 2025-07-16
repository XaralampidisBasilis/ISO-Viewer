
int sample_anisotropic_distance(in ivec3 coords, in int octant, out bool occupancy)
{
    coords.z += octant * u_volume.blocks.z;
    int distance = int(texelFetch(u_textures.anisotropic_distance_map, coords, 0).r);
    occupancy = (distance == 0);

    return distance;
}
