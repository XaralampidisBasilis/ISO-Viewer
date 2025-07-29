// Samples the base volume using standard trilinear interpolation.
// Assumes texture uses linear filtering and normalized coordinates.
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    // Normalize coordinates to texture space [0,1]
    coords *= u_volume.inv_dimensions;

    // Sample red channel from trilinear volume texture
    #if INTERPOLATION_METHOD == 1
    float value = texture(u_textures.trilinear_volume, coords).r;
    #endif

    // Sample alpha channel from tricubic volume texture
    #if INTERPOLATION_METHOD == 2
    float value = texture(u_textures.tricubic_volume, coords).a;
    #endif

    return value;
}

#endif