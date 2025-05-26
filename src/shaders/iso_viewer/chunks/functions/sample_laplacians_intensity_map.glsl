/* Source
Beyond Trilinear Interpolation: Higher Quality for Free
(https://dl.acm.org/doi/10.1145/3306346.3323032)
*/

vec4 sample_laplacians_intensity_map(in vec3 position)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif
    
    // sample trilinearly interpolated laplace vector and intensity values
    vec3 uvw = position * u_intensity_map.inv_dimensions;
    vec4 laplacians_intensity = texture(u_textures.laplacians_intensity_map, uvw);

    // compute the correction vector
    vec3 x = position - 0.5;
    vec3 frac = x - floor(x);
    vec4 correction = vec4(frac * (frac - 1.0), 1.0);
    float corrected_intensity = dot(laplacians_intensity, correction);

    // return the improved intensity value based on laplacian information
    return vec4(laplacians_intensity.xyz, corrected_intensity);
    // return vec4(laplacians_intensity);
}
