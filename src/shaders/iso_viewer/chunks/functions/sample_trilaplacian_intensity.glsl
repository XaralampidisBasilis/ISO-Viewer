/* Source
Beyond Trilinear Interpolation: Higher Quality for Free (https://dl.acm.org/doi/10.1145/3306346.3323032)
*/

vec4 sample_trilaplacian_intensity(in vec3 coords)
{
    #if STATS_ENABLED == 1
    stats.num_fetches += 1;
    #endif
    
    // sample trilinearly interpolated laplace vector and intensity values
    vec3 uvw = coords * u_intensity_map.inv_dimensions;
    vec4 trilaplacian_intensity = texture(u_textures.trilaplacian_intensity_map, uvw);
    
    // compute the correction vector
    vec3 x = coords - 0.5;
    vec3 frac = x - floor(x);
    vec4 correction = vec4(frac * (frac - 1.0), 1.0);
    float intensity = dot(trilaplacian_intensity, correction);

    // return the improved intensity value based on laplacian information
    return vec4(trilaplacian_intensity.xyz, intensity);
}

void sample_trilaplacian_gradient_hessian(in vec3 coords, out vec3 gradient, out mat3 hessian)
{
    // 1D B-spline filter normalized positions for each axis
    vec3 p0 = coords - 0.5;
    vec3 p1 = coords + 0.5;

    // Cube samples
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_trilaplacian_intensity(vec3(p0.x, p0.y, p0.z)).a, // x0y0z0
        sample_trilaplacian_intensity(vec3(p0.x, p1.y, p0.z)).a, // x0y1z0
        sample_trilaplacian_intensity(vec3(p0.x, p0.y, p1.z)).a, // x0y0z1
        sample_trilaplacian_intensity(vec3(p0.x, p1.y, p1.z)).a  // x0y1z1
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_trilaplacian_intensity(vec3(p1.x, p0.y, p0.z)).a, // x1y0z0
        sample_trilaplacian_intensity(vec3(p1.x, p1.y, p0.z)).a, // x1y1z0
        sample_trilaplacian_intensity(vec3(p1.x, p0.y, p1.z)).a, // x1y0z1
        sample_trilaplacian_intensity(vec3(p1.x, p1.y, p1.z)).a  // x1y1z1
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    0.5);

    // Differentiate across x
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    );

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    0.5);

    // Differentiate across y
    vec4 s_xdyz0_xdyz1_dxdyz0_dxdyz1 = (
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw) -
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz)
    );

    // Interpolate along z
    vec3 s_dxyz_xdyz_dxdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1_dxdyz0_dxdyz1.yw),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1_dxdyz0_dxdyz1.xz), 
    0.5);

    // Differentiate across z
    vec3 s_xydz_dxydz_xdydz = (
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    );
  
    // Pure second derivatives
    vec3 s_d2x_d2y_d2z = sample_trilaplacian_intensity(coords).xyz * 2.0;

    // Gradient
    gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
       s_dxyz_xdyz_dxdyz.z, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
       s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
   );
}
