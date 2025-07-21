#ifndef SAMPLE_TRICUBIC_VOLUME
#define SAMPLE_TRICUBIC_VOLUME

/* Source:
   Beyond Trilinear Interpolation: Higher Quality for Free
   https://dl.acm.org/doi/10.1145/3306346.3323032
*/
vec4 sample_tricubic_features(in vec3 coords)
{
    // Normalize coordinates to texture space
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    return texture(u_textures.tricubic_volume, texture_coords);
}

float sample_tricubic_volume(in vec3 coords)
{
    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    vec4 features = sample_tricubic_features(coords);

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 bias = tricubic_bias(coords);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(bias, features);

    return tricubic_sample;
}       

float sample_tricubic_volume(in vec3 coords, out vec4 features)
{
    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    features = sample_tricubic_features(coords);

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 bias = tricubic_bias(coords);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(bias, features);

    return tricubic_sample;
}    

#endif