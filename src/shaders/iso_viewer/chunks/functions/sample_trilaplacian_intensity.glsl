/* Source
Beyond Trilinear Interpolation: Higher Quality for Free (https://dl.acm.org/doi/10.1145/3306346.3323032)
*/
float sample_trilaplacian_intensity(in vec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    // sample the augmented volume    
    vec3 uvw = coords * u_intensity_map.inv_dimensions;
    vec4 fxx_fyy_fzz_f = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute correction terms
    vec3 a = fract(coords - 0.5);
    vec3 aa = a * (a - 1.0) / 2.0;

    // compute correction
    float c = dot(fxx_fyy_fzz_f.xyz, aa);
    float fc = fxx_fyy_fzz_f.a + c;

    // return the improved intensity value
    return fc;
}

float sample_trilaplacian_intensity(in vec3 coords, out float c)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    // sample the augmented volume    
    vec3 uvw = coords * u_intensity_map.inv_dimensions;
    vec4 fxx_fyy_fzz_f = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute correction terms
    vec3 a = fract(coords - 0.5);
    vec3 aa = a * (a - 1.0) / 2.0;

    // compute correction
    c = dot(fxx_fyy_fzz_f.xyz, aa);
    float fc = fxx_fyy_fzz_f.a + c;

    // return the improved intensity value
    return fc;
}

float sample_trilaplacian_intensity(in vec3 coords, out vec4 fxx_fyy_fzz_f, out vec4 gxx_gyy_gzz_g)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif

    // sample the augmented volume    
    vec3 uvw = coords * u_intensity_map.inv_dimensions;
    fxx_fyy_fzz_f = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute correction terms
    vec3 g = fract(coords - 0.5);
    gxx_gyy_gzz_g = vec4(g * (g - 1.0) / 2.0, 1.0);

    // compute correction
    float fc = dot(fxx_fyy_fzz_f, gxx_gyy_gzz_g);

    // return the improved intensity value
    return fc;
}

// Analytic reconstruction of the gradient and hessian from the interpolation field 
void sample_trilaplacian_gradient_hessian(in vec3 coords, out vec3 gradient, out mat3 hessian)
{
    // Convert to voxel-space and compute local coordinates
    vec3 x = coords - 0.5;
    vec3 i = floor(x);
    vec3 a = x - i;
    vec3 aa = a * (a - 1.0) / 2.0;
    vec3 da = a - 0.5;
    vec3 p0 = (i + 0.5) * u_intensity_map.inv_dimensions;
    vec3 p1 = (i + 1.5) * u_intensity_map.inv_dimensions;

    // Take cube samples
    vec4 fxx_fyy_fzz_f_x0y0z0 = texture(u_textures.trilaplacian_intensity_map, vec3(p0.x, p0.y, p0.z));
    vec4 fxx_fyy_fzz_f_x0y1z0 = texture(u_textures.trilaplacian_intensity_map, vec3(p0.x, p1.y, p0.z));
    vec4 fxx_fyy_fzz_f_x0y0z1 = texture(u_textures.trilaplacian_intensity_map, vec3(p0.x, p0.y, p1.z));
    vec4 fxx_fyy_fzz_f_x0y1z1 = texture(u_textures.trilaplacian_intensity_map, vec3(p0.x, p1.y, p1.z));

    vec4 fxx_fyy_fzz_f_x1y0z0 = texture(u_textures.trilaplacian_intensity_map, vec3(p1.x, p0.y, p0.z));
    vec4 fxx_fyy_fzz_f_x1y1z0 = texture(u_textures.trilaplacian_intensity_map, vec3(p1.x, p1.y, p0.z));
    vec4 fxx_fyy_fzz_f_x1y0z1 = texture(u_textures.trilaplacian_intensity_map, vec3(p1.x, p0.y, p1.z));
    vec4 fxx_fyy_fzz_f_x1y1z1 = texture(u_textures.trilaplacian_intensity_map, vec3(p1.x, p1.y, p1.z));

    // Interpolate along x
    vec4 fxx_fyy_fzz_f_xy0z0 = mix(fxx_fyy_fzz_f_x0y0z0, fxx_fyy_fzz_f_x1y0z0, a.x);
    vec4 fxx_fyy_fzz_f_xy1z0 = mix(fxx_fyy_fzz_f_x0y1z0, fxx_fyy_fzz_f_x1y1z0, a.x);
    vec4 fxx_fyy_fzz_f_xy0z1 = mix(fxx_fyy_fzz_f_x0y0z1, fxx_fyy_fzz_f_x1y0z1, a.x);
    vec4 fxx_fyy_fzz_f_xy1z1 = mix(fxx_fyy_fzz_f_x0y1z1, fxx_fyy_fzz_f_x1y1z1, a.x);

    // Differentiate across x
    vec4 fxx_fyy_fzz_f_dxy0z0 = fxx_fyy_fzz_f_x1y0z0 - fxx_fyy_fzz_f_x0y0z0;
    vec4 fxx_fyy_fzz_f_dxy1z0 = fxx_fyy_fzz_f_x1y1z0 - fxx_fyy_fzz_f_x0y1z0;
    vec4 fxx_fyy_fzz_f_dxy0z1 = fxx_fyy_fzz_f_x1y0z1 - fxx_fyy_fzz_f_x0y0z1;
    vec4 fxx_fyy_fzz_f_dxy1z1 = fxx_fyy_fzz_f_x1y1z1 - fxx_fyy_fzz_f_x0y1z1;

    // Interpolate along y
    vec4 fxx_fyy_fzz_f_xyz0  = mix(fxx_fyy_fzz_f_xy0z0,  fxx_fyy_fzz_f_xy1z0,  a.y);
    vec4 fxx_fyy_fzz_f_xyz1  = mix(fxx_fyy_fzz_f_xy0z1,  fxx_fyy_fzz_f_xy1z1,  a.y);
    vec4 fxx_fyy_fzz_f_dxyz0 = mix(fxx_fyy_fzz_f_dxy0z0, fxx_fyy_fzz_f_dxy1z0, a.y);
    vec4 fxx_fyy_fzz_f_dxyz1 = mix(fxx_fyy_fzz_f_dxy0z1, fxx_fyy_fzz_f_dxy1z1, a.y);

    // Differentiate across y
    vec4 fxx_fyy_fzz_f_xdyz0  = fxx_fyy_fzz_f_xy1z0  - fxx_fyy_fzz_f_xy0z0;
    vec4 fxx_fyy_fzz_f_xdyz1  = fxx_fyy_fzz_f_xy1z1  - fxx_fyy_fzz_f_xy0z1;
    vec4 fxx_fyy_fzz_f_dxdyz0 = fxx_fyy_fzz_f_dxy1z0 - fxx_fyy_fzz_f_dxy0z0;
    vec4 fxx_fyy_fzz_f_dxdyz1 = fxx_fyy_fzz_f_dxy1z1 - fxx_fyy_fzz_f_dxy0z1;

    // Interpolate along z
    vec4 fxx_fyy_fzz_f_xyz   = mix(fxx_fyy_fzz_f_xyz0,   fxx_fyy_fzz_f_xyz1,   a.z);
    vec4 fxx_fyy_fzz_f_dxyz  = mix(fxx_fyy_fzz_f_dxyz0,  fxx_fyy_fzz_f_dxyz1,  a.z);
    vec4 fxx_fyy_fzz_f_xdyz  = mix(fxx_fyy_fzz_f_xdyz0,  fxx_fyy_fzz_f_xdyz1,  a.z);
    vec4 fxx_fyy_fzz_f_dxdyz = mix(fxx_fyy_fzz_f_dxdyz0, fxx_fyy_fzz_f_dxdyz1, a.z);

    // Differentiate across z
    vec4 fxx_fyy_fzz_f_xydz  = fxx_fyy_fzz_f_xyz1  - fxx_fyy_fzz_f_xyz0;
    vec4 fxx_fyy_fzz_f_dxydz = fxx_fyy_fzz_f_dxyz1 - fxx_fyy_fzz_f_dxyz0;
    vec4 fxx_fyy_fzz_f_xdydz = fxx_fyy_fzz_f_xdyz1 - fxx_fyy_fzz_f_xdyz0;

    // First partial derivatives
    float sx_xyz = dot(fxx_fyy_fzz_f_dxyz, vec4(aa, 1.0));
    float sy_xyz = dot(fxx_fyy_fzz_f_xdyz, vec4(aa, 1.0));
    float sz_xyz = dot(fxx_fyy_fzz_f_xydz, vec4(aa, 1.0));

    sx_xyz += fxx_fyy_fzz_f_xyz.x * da.x;
    sy_xyz += fxx_fyy_fzz_f_xyz.y * da.y;
    sz_xyz += fxx_fyy_fzz_f_xyz.z * da.z;

    // Second mixed derivatives
    float sxy_xyz = dot(fxx_fyy_fzz_f_dxdyz, vec4(aa, 1.0));
    float syz_xyz = dot(fxx_fyy_fzz_f_xdydz, vec4(aa, 1.0));
    float sxz_xyz = dot(fxx_fyy_fzz_f_dxydz, vec4(aa, 1.0));

    sxy_xyz += dot(vec2(fxx_fyy_fzz_f_xdyz.x, fxx_fyy_fzz_f_dxyz.y), da.xy);
    syz_xyz += dot(vec2(fxx_fyy_fzz_f_xydz.y, fxx_fyy_fzz_f_xdyz.z), da.yz);
    sxz_xyz += dot(vec2(fxx_fyy_fzz_f_dxyz.z, fxx_fyy_fzz_f_xydz.x), da.zx);

    // Second pure derivatives
    float sxx_xyz = fxx_fyy_fzz_f_xyz.x;
    float syy_xyz = fxx_fyy_fzz_f_xyz.y;
    float szz_xyz = fxx_fyy_fzz_f_xyz.z;

    sxx_xyz += fxx_fyy_fzz_f_dxyz.x * da.x * 2.0;
    syy_xyz += fxx_fyy_fzz_f_xdyz.y * da.y * 2.0;
    szz_xyz += fxx_fyy_fzz_f_xydz.z * da.z * 2.0;

    // Gradient
    gradient = vec3(sx_xyz, sy_xyz, sz_xyz);

    // Hessian
    hessian = mat3(
       sxx_xyz, sxy_xyz, sxz_xyz,  
       sxy_xyz, syy_xyz, syz_xyz,  
       sxz_xyz, syz_xyz, szz_xyz     
   );
}