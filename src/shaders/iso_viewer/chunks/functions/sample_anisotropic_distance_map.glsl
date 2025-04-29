
int sample_anisotropic_distance_map(in ivec3 coords, in int group8)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    coords.z += group8 * u_distance_map.dimensions.z;

    return int(texelFetch(u_textures.anisotropic_distance_map, coords, 0).r);
}
