// Samples the base volume using standard trilinear interpolation.
// Assumes texture uses linear filtering and normalized coordinates.
#ifndef SAMPLE_TRILINEAR_VOLUME
#define SAMPLE_TRILINEAR_VOLUME

float sample_trilinear_volume(in ivec3 coords)
{
    // Sample red channel from trilinear volume texture
    #if INTERPOLATION_METHOD == 1
    return texelFetch(u_textures.trilinear_volume, coords, 0).r;
    #endif

    // Sample alpha channel from tricubic volume texture
    #if INTERPOLATION_METHOD == 2
    return texelFetch(u_textures.tricubic_volume, coords, 0).a;
    #endif
}

float sample_trilinear_volume(in vec3 coords)
{
    // Normalize coordinates to texture space [0,1]
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample red channel from trilinear volume texture
    #if INTERPOLATION_METHOD == 1
    return texture(u_textures.trilinear_volume, texture_coords).r;
    #endif

    // Sample alpha channel from tricubic volume texture
    #if INTERPOLATION_METHOD == 2
    return texture(u_textures.tricubic_volume, texture_coords).a;
    #endif
}

#endif