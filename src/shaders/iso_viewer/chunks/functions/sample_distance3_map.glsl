

ivec3 sample_distance3_map(in ivec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    return texelFetch(u_textures.distance3_map, coords, 0).rgb;
}
