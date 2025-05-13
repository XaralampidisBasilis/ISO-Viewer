/* Sources: 
    One Step Further Beyond Trilinear Interpolation and Central
    Differences: Triquadratic Reconstruction and its Analytic
    Derivatives at the Cost of One Additional Texture Fetch 
    (https://onlinelibrary.wiley.com/doi/10.1111/cgf.14753),

    GPU Gems 2, Chapter 20. Fast Third-Order Texture Filtering 
    (https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-20-fast-third-order-texture-filtering),
*/

float triquadratic_sampling(in sampler3D tex, in vec3 coordinates)
{
    // Transform to voxel-centered coordinates
    vec3 size = vec3(textureSize(tex, 0));
    vec3 inv_size = 1.0 / size;
    vec3 alligned = coordinates - 0.5;
    vec3 beta = alligned - round(alligned);

    // Interpolation weights and symmetric offsets
    vec3 gamma0 = 0.5 - beta;
    vec3 delta0 = (0.5 + beta) * 0.5;

    // Compute two sampling positions (min and max corners of interpolation cube)
    vec3 p = coordinates * inv_size;
    vec3 p0 = p - delta0 * inv_size;
    vec3 p1 = p0 + 0.5 * inv_size;

    // Sample the 8 corner points of the interpolation cube 
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, p1.z)).r  // x0y1z1
    );
    
    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, p1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    gamma0.x);

    // Interpolate along y
    vec2 s_xyz0_xyz1 = mix(
        vec2(s_xy0z0_xy1z0_xy0z1_xy1z1.yw),
        vec2(s_xy0z0_xy1z0_xy0z1_xy1z1.xz),
    gamma0.y);

    // Interpolate along z
    float s_xyz = mix(
        s_xyz0_xyz1.y,
        s_xyz0_xyz1.x, 
    gamma0.z);

    // Intensity
    return s_xyz;
}

float triquadratic_sampling(in sampler3D tex, in vec3 coordinates, out vec3 gradient)
{
    // Transform to voxel-centered coordinates
    vec3 size = vec3(textureSize(tex, 0));
    vec3 inv_size = 1.0 / size;
    vec3 alligned = coordinates - 0.5;
    vec3 beta = alligned - round(alligned);

    // Interpolation weights and symmetric offsets
    vec3 gamma0 = 0.5 - beta;
    vec3 delta0 = (0.5 + beta) * 0.5;

    // Compute two sampling positions (min and max corners of interpolation cube)
    vec3 p = coordinates * inv_size;
    vec3 p0 = p - delta0 * inv_size;
    vec3 p1 = p0 + 0.5 * inv_size;

    // Sample the 8 corner points of the interpolation cube 
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, p1.z)).r  // x0y1z1
    );
    
    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, p1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    gamma0.x);

    // Differentiate along x
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - s_x0y0z0_x0y1z0_x0y0z1_x0y1z1) * 2.0;

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    gamma0.y);

    // Differentiate along y
    vec2 s_xdyz0_xdyz1 = (s_xy0z0_xy1z0_xy0z1_xy1z1.yw - s_xy0z0_xy1z0_xy0z1_xy1z1.xz) * 2.0;

    // Final interpolation along z, building value and partials
    vec3 s_xyz_dxyz_xdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1.y),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1.x), 
    gamma0.z);

    // Differentiate along z
    float s_xydz = (s_xyz0_xyz1_dxyz0_dxyz1.y - s_xyz0_xyz1_dxyz0_dxyz1.x) * 2.0;

    // Gradient
    gradient = vec3(s_xyz_dxyz_xdyz.yz, s_xydz);

    // Intensity
    return s_xyz_dxyz_xdyz.x;
}

float triquadratic_sampling(in sampler3D tex, in vec3 coordinates, out vec3 gradient, out mat3 hessian)
{
    // Transform to voxel-centered coordinates
    vec3 size = vec3(textureSize(tex, 0));
    vec3 inv_size = 1.0 / size;
    vec3 alligned = coordinates - 0.5;
    vec3 beta = alligned - round(alligned);

    // Interpolation weights and symmetric offsets
    vec3 gamma0 = 0.5 - beta;
    vec3 delta0 = (0.5 + beta) * 0.5;

    // Compute two sampling positions (min and max corners of interpolation cube)
    vec3 p = coordinates * inv_size;
    vec3 p0 = p - delta0 * inv_size;
    vec3 p1 = p0 + 0.5 * inv_size;

    // Sample the 8 corner points of the interpolation cube 
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, p1.z)).r  // x0y1z1
    );
    
    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, p1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    gamma0.x);

    // Differentiate along x
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - s_x0y0z0_x0y1z0_x0y0z1_x0y1z1) * 2.0;

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    gamma0.y);

    // Differentiate along y
    vec2 s_xdyz0_xdyz1 = (s_xy0z0_xy1z0_xy0z1_xy1z1.yw - s_xy0z0_xy1z0_xy0z1_xy1z1.xz) * 2.0;

    // Final interpolation along z, building value and partials
    vec3 s_xyz_dxyz_xdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1.y),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1.x), 
    gamma0.z);

    // Differentiate along z
    float s_xydz = (s_xyz0_xyz1_dxyz0_dxyz1.y - s_xyz0_xyz1_dxyz0_dxyz1.x) * 2.0;

    // Differentiate across y
    vec2 s_dxdyz0_dxdyz1 = (s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw - s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz) * 2.0;

    // Interpolate along z
    float s_dxdyz = mix(
        s_dxdyz0_dxdyz1.x,
        s_dxdyz0_dxdyz1.y,
    gamma0.z);

    // Differentiate along z
    float s_dxydz = (s_xyz0_xyz1_dxyz0_dxyz1.w - s_xyz0_xyz1_dxyz0_dxyz1.z) * 2.0;

    // Differentiate along z
    float s_xdydz = (s_xdyz0_xdyz1.y - s_xdyz0_xdyz1.x) * 2.0;

    // Sample the 6 central differences
    float s = texture(tex, p).r;
    vec2 s_x = vec2(
        texture(tex, vec3(p.x - inv_size.x, p.y, p.z)).r,
        texture(tex, vec3(p.x + inv_size.x, p.y, p.z)).r
    );
    vec2 s_y = vec2(
        texture(tex, vec3(p.x, p.y - inv_size.y, p.z)).r,
        texture(tex, vec3(p.x, p.y + inv_size.y, p.z)).r
    );
    vec2 s_z = vec2(
        texture(tex, vec3(p.x, p.y, p.z - inv_size.z)).r,
        texture(tex, vec3(p.x, p.y, p.z + inv_size.z)).r
    );

    // Pure second derivatives
    vec3 s_d2x_d2y_d2z = vec3(
       s_x.x + s_x.y - 2.0 * s,
       s_y.x + s_y.y - 2.0 * s,
       s_z.x + s_z.y - 2.0 * s
    );

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_dxdyz, s_dxydz,  
       s_dxdyz, s_d2x_d2y_d2z.y, s_xdydz,  
       s_dxydz, s_xdydz, s_d2x_d2y_d2z.z     
   );

    // Gradient
    gradient = vec3(s_xyz_dxyz_xdyz.yz, s_xydz);
        
    // Intensity
    return s_xyz_dxyz_xdyz.x;
}