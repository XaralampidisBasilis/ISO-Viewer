
// Samples the isotropic distance texture at given integer coordinates.
int sample_isotropic_distance(in ivec3 block_coords, out bool occupancy)
{
    // Fetch red channel value from the 3D texture
    uint texture_sample = texelFetch(u_textures.isotropic_distance, block_coords, 0).r;

    // Convert to integer distance by flooring 
    int distance = int(texture_sample);

    // Determine if block is occupied 
    occupancy = (distance == 0);

    return distance;
}