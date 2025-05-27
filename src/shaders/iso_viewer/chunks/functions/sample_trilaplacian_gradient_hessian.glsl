
/* Sources
MRIcroGL Gradients
(https://github.com/neurolabusc/blog/blob/main/GL-gradients/README.md),

GPU Gems 2, Chapter 20. Fast Third-Order Texture Filtering 
(https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-20-fast-third-order-texture-filtering),
*/

void sample_trilaplacian_intensity_central(in vec3 coords, out float s_x1y1z1, out vec3 s_x0y1z1_x1y0z1_x1y1z0, out vec3 s_x2y1z1_x1y2z1_x1y1z2)
{
    // Get normalized position and step
    vec3 t = u_intensity_map.inv_dimensions;
    vec3 p = coords * u_intensity_map.inv_dimensions;

    // Center sample
    s_x1y1z1 = sample_trilaplacian_intensity(p).a; // x1y1z1

    // Central differences samples
    s_x0y1z1_x1y0z1_x1y1z0 = vec3(
        sample_trilaplacian_intensity(vec3(p.x - t.x, p.y, p.z)).a, //x0y1z1
        sample_trilaplacian_intensity(vec3(p.x, p.y - t.y, p.z)).a, //x1y0z1
        sample_trilaplacian_intensity(vec3(p.x, p.y, p.z - t.z)).a  //x1y1z0
    );

    s_x2y1z1_x1y2z1_x1y1z2 = vec3(
        sample_trilaplacian_intensity(vec3(p.x + t.x, p.y, p.z)).a, //x2y1z1
        sample_trilaplacian_intensity(vec3(p.x, p.y + t.y, p.z)).a, //x1y2z1
        sample_trilaplacian_intensity(vec3(p.x, p.y, p.z + t.z)).a  //x1y1z2
    );
}

void sample_trilaplacian_intensity_cube(in vec3 coords, out vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, out vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1)
{
    // Get normalized position and step
    vec3 t = u_intensity_map.inv_dimensions;
    vec3 p = coords * u_intensity_map.inv_dimensions;

    // 1D B-spline filter normalized positions for each axis
    vec3 p0 = p - 0.5 * t;
    vec3 p1 = p + 0.5 * t;

    // Cube samples
    s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_trilaplacian_intensity(vec3(p0.x, p0.y, p0.z)).a, // x0y0z0
        sample_trilaplacian_intensity(vec3(p0.x, p1.y, p0.z)).a, // x0y1z0
        sample_trilaplacian_intensity(vec3(p0.x, p0.y, p1.z)).a, // x0y0z1
        sample_trilaplacian_intensity(vec3(p0.x, p1.y, p1.z)).a  // x0y1z1
    );

    s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_trilaplacian_intensity(vec3(p1.x, p0.y, p0.z)).a, // x1y0z0
        sample_trilaplacian_intensity(vec3(p1.x, p1.y, p0.z)).a, // x1y1z0
        sample_trilaplacian_intensity(vec3(p1.x, p0.y, p1.z)).a, // x1y0z1
        sample_trilaplacian_intensity(vec3(p1.x, p1.y, p1.z)).a  // x1y1z1
    );
}

void sample_trilaplacian_gradient_hessian(in vec3 coords, out vec3 gradient, out mat3 hessian)
{
    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    sample_trilaplacian_intensity_cube(coords, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

  // Sample central cross
    float s_x1y1z1; vec3 s_x0y1z1_x1y0z1_x1y1z0, s_x2y1z1_x1y2z1_x1y1z2;
    sample_trilaplacian_intensity_central(coords, s_x1y1z1, s_x0y1z1_x1y0z1_x1y1z0, s_x2y1z1_x1y2z1_x1y1z2);

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
    vec3 s_d2x_d2y_d2z = s_x2y1z1_x1y2z1_x1y1z2 + s_x0y1z1_x1y0z1_x1y1z0 - s_x1y1z1 * 2.0;

    // Gradient
    gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
       s_dxyz_xdyz_dxdyz.z, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
       s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
   );
}
