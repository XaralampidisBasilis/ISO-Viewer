#ifndef SAMPLE_TRILINEAR_VOLUME
#define SAMPLE_TRILINEAR_VOLUME

// Samples the base volume using standard trilinear interpolation.
// Assumes texture uses linear filtering and normalized coordinates.
float sample_trilinear_volume(in vec3 coords)
{
    // Normalize coordinates to texture space [0,1]
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample red channel from trilinear volume texture
    #if INTERPOLATION_METHOD == 1
    float trilinear_sample = texture(u_textures.trilinear_volume, texture_coords).r;
    #endif

    // Sample alpha channel from tricubic volume texture
    #if INTERPOLATION_METHOD == 2
    float trilinear_sample = texture(u_textures.tricubic_volume, texture_coords).a;
    #endif

    return trilinear_sample;
}

#endif