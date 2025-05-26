
ivec3 sample_extended_distance(in ivec3 coords, in int group8, out bool occupied)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    // sample the correct distance map
    coords.z += group8 * u_distance_map.dimensions.z;
    uint packed_5_5_5_1 = texelFetch(u_textures.extended_anisotropic_distance_map, coords, 0).r;

    // unpack bits  from sample
    uint r = (packed_5_5_5_1 >> 11) & 0x1Fu; // Extract bits 15–11 (5 bits)
    uint g = (packed_5_5_5_1 >> 6)  & 0x1Fu; // Extract bits 10–6  (5 bits)
    uint b = (packed_5_5_5_1 >> 1)  & 0x1Fu; // Extract bits 5–1   (5 bits)
    uint a = packed_5_5_5_1         & 0x1u;  // Extract bit 0

    // return values
    occupied = bool(a);
    return ivec3(r, g, b);
}
