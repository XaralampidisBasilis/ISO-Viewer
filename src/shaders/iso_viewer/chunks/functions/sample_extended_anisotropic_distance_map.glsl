

int sample_extended_anisotropic_distance_map(in ivec3 coords, in int group)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    coords.z += group * u_distance_map.dimensions.z;
    return int(texelFetch(u_textures.ext_anisotropic_distance_map, coords, 0).r);
}

