/* Source
Beyond Trilinear Interpolation: Higher Quality for Free (https://dl.acm.org/doi/10.1145/3306346.3323032)
*/
float sample_trilaplacian_intensity(in vec3 coords)
{
    // sample the augmented volume    
    vec3 uvw = coords * u_volume.inv_dimensions;
    vec4 fxx_fyy_fzz_f = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute correction terms
    vec4 gx_gy_gz_g = vec4(quadratic_bias(coords), 1.0);

    // compute correction
    float fc = dot(fxx_fyy_fzz_f, gx_gy_gz_g);

    // return the improved intensity value
    return fc;
}


float sample_trilaplacian_intensity(in vec3 coords, out vec4 fxx_fyy_fzz_f)
{
    // sample the augmented volume    
    vec3 uvw = coords * u_volume.inv_dimensions;
    fxx_fyy_fzz_f = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute correction terms
    vec4 gx_gy_gz_g = vec4(quadratic_bias(coords), 1.0);

    // compute correction
    float fc = dot(fxx_fyy_fzz_f, gx_gy_gz_g);

    // return the improved intensity value
    return fc;
}
