
uvec4 unpack_extended_distance(in uint packed_sample)
{
    return uvec4(
        (packed_sample >> 11) & 0x1Fu, // extract bits 15–11 (5 bits)
        (packed_sample >> 6)  & 0x1Fu, // extract bits 10–6  (5 bits)
        (packed_sample >> 1)  & 0x1Fu, // extract bits 5–1   (5 bits)
        (packed_sample >> 0)  & 0x1u   // extract bit 0
    );
}

ivec3 sample_extended_distance(in ivec3 coords, in int octant, out bool occupied)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    // sample the correct distance map
    coords.z += octant * u_distance_map.dimensions.z;
    uvec4 distances = unpack_extended_distance(texelFetch(u_textures.extended_anisotropic_distance_map, coords, 0).r);

    // return values
    occupied = bool(distances.w);
    return ivec3(distances.xyz);
}
