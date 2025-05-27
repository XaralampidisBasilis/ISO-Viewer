

bool sample_occupancy(in ivec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    return bool(texelFetch(u_textures.occupancy_map, coords, 0).r);
}
