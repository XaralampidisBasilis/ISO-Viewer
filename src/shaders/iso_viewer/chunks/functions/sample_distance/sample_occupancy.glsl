#ifndef SAMPLE_OCCUPANCY
#define SAMPLE_OCCUPANCY

// Samples the occupancy texture at the given integer coordinates.
bool sample_occupancy(in ivec3 block_coords)
{    
#if DEBUG_ENABLED == 1
    stats.num_occupancy_reads += 1;
#endif
    return (texelFetch(u_textures.occupancy_map, block_coords, 0).r > 0u);
}

#endif
