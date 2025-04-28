
int sample_ext_anisotropic_distance_map(in ivec3 coords, in int group)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    coords.z += group * u_distance_map.dimensions.z;
    return texelFetch(u_textures.ext_anisotropic_distance_map, coords, 0).r;
}

// int sample_ext_anisotropic_distance_map(in ivec3 coords, in int octant, out bool occupied)
// {
//     #if STATS_ENABLED == 1
//     stats.num_fetches += 1;
//     #endif

//     // sample the correct distance map
//     coords.z += octant * u_distance_map.dimensions.z;
//     uint packed = texelFetch(u_textures.ext_anisotropic_distance_map, coords, 0).r;

//     // unpack bits 
//     uint r = (packed >> 11) & 0x1Fu; // Extract bits 15–11 (5 bits)
//     uint g = (packed >> 6)  & 0x1Fu; // Extract bits 10–6  (5 bits)
//     uint b = (packed >> 1)  & 0x1Fu; // Extract bits 5–1   (5 bits)
//     uint a = packed         & 0x1u;  // Extract bit 0

//     // return values
//     occupied = a == 0;

//     return ivec3(r, g, b)
// }
