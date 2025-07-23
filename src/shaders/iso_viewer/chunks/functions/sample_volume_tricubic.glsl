/* Source:
   Beyond Trilinear Interpolation: Higher Quality for Free
   https://dl.acm.org/doi/10.1145/3306346.3323032
*/
#ifndef SAMPLE_VOLUME_TRICUBIC
#define SAMPLE_VOLUME_TRICUBIC

vec4 sample_volume_tricubic_features(in ivec3 coords)
{
    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    return texelFetch(u_textures.tricubic_volume, coords, 0);
}

vec4 sample_volume_tricubic_features(in vec3 coords)
{
    // Normalize coordinates to texture space
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    return texture(u_textures.tricubic_volume, texture_coords);
}

float sample_volume_tricubic(in vec3 coords)
{
    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    vec4 features = sample_volume_tricubic_features(coords);

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 bias = tricubic_bias(coords);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(bias, features);

    return tricubic_sample;
}       

float sample_volume_tricubic(in vec3 coords, out vec4 features)
{
    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    features = sample_volume_tricubic_features(coords);

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 bias = tricubic_bias(coords);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(bias, features);

    return tricubic_sample;
}    

#endif