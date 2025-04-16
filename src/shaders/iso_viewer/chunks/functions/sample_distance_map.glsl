

int sample_distance_map(in ivec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    return texelFetch(u_textures.distance_map, coords, 0).r;
}
