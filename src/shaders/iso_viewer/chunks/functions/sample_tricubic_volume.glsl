#ifndef SAMPLE_TRICUBIC_VOLUME
#define SAMPLE_TRICUBIC_VOLUME

/* Source:
   Beyond Trilinear Interpolation: Higher Quality for Free
   https://dl.acm.org/doi/10.1145/3306346.3323032
*/
float sample_tricubic_volume(in vec3 coords)
{
    // Normalize coordinates to texture space
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    vec4 tricubic_basis = texture(u_textures.tricubic_volume, texture_coords).rgba;

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 tricubic_weights = vec4(quadratic_bias(coords), 1.0);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(tricubic_weights, tricubic_basis);

    return tricubic_sample;
}       

float sample_tricubic_volume(in vec3 coords, out vec4 tricubic_basis)
{
    // Normalize coordinates to texture space
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    // Sample the precomputed augmented volume texture (fxx, fyy, fzz, f)
    tricubic_basis = texture(u_textures.tricubic_volume, texture_coords).rgba;

    // Compute interpolation weights (quadratic bias terms + constant)
    vec4 tricubic_weights = vec4(quadratic_bias(coords), 1.0);

    // Compute corrected sample using dot product of coefficients and weights
    float tricubic_sample = dot(tricubic_weights, tricubic_basis);

    return tricubic_sample;
}

#endif