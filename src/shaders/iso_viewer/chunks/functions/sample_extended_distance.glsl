
uvec4 unpack_extended_distance(in uint packed_sample)
{
    return uvec4(
        (packed_sample >> 11) & 0x1Fu, // extract bits 15–11 (5 bits)
        (packed_sample >>  6) & 0x1Fu, // extract bits 10–6  (5 bits)
        (packed_sample >>  1) & 0x1Fu, // extract bits 5–1   (5 bits)
        (packed_sample >>  0) & 0x1u   // extract bit 0
    );
}

ivec3 sample_extended_distance(in ivec3 coords, in int octant, out bool occupancy)
{
    // sample the correct distance map
    coords.z += octant * u_volume.blocks.z;
    uint packed_sample = texelFetch(u_textures.extended_distance_map, coords, 0).r;
    uvec4 unpacked_sample = unpack_extended_distance(packed_sample);
    ivec3 distances = ivec3(unpacked_sample.rgb);
    occupancy = bool(unpacked_sample.a);

    // return values
    return distances;
}
