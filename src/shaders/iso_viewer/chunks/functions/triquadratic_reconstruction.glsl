/* Source
    One Step Further Beyond Trilinear Interpolation and Central
    Differences: Triquadratic Reconstruction and its Analytic
    Derivatives at the Cost of One Additional Texture Fetch
*/

float triquadratic_reconstruction(in sampler3D tex, in vec3 coordinates, out vec3 gradient, out mat3 hessian)
{
    // Transform to voxel-centered coordinates
    vec3 inv_size = 1.0 / vec3(textureSize(tex, 0));
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
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - s_x0y0z0_x0y1z0_x0y0z1_x0y1z1;

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    gamma0.y);

    // Differentiate along y
    vec2 s_xdyz0_xdyz1 = s_xy0z0_xy1z0_xy0z1_xy1z1.yw - s_xy0z0_xy1z0_xy0z1_xy1z1.xz;

    // Final interpolation along z, building value and partials
    vec3 s_xyz_dxyz_xdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1.y),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1.x), 
    gamma0.z);

    float s_dxyz = s_xyz_dxyz_xdyz.y;
    float s_xdyz = s_xyz_dxyz_xdyz.z;

    // Differentiate along z
    float s_xydz = s_xyz0_xyz1_dxyz0_dxyz1.y - s_xyz0_xyz1_dxyz0_dxyz1.x;

    // Differentiate across y
    vec2 s_dxdyz0_dxdyz1 = s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw - s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz;

    // Interpolate along z
    float s_dxdyz = mix(
        s_dxdyz0_dxdyz1.x,
        s_dxdyz0_dxdyz1.y,
    gamma0.z);

    // Differentiate along z
    float s_dxydz = s_xyz0_xyz1_dxyz0_dxyz1.w - s_xyz0_xyz1_dxyz0_dxyz1.z;

    // Differentiate along z
    float s_xdydz = s_xdyz0_xdyz1.y - s_xdyz0_xdyz1.x;

    // Intensity
    float s_xyz = s_xyz_dxyz_xdyz.x;

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
    float s_d2x = s_x.x + s_x.y - s * 2.0;
    float s_d2y = s_y.x + s_y.y - s * 2.0;
    float s_d2z = s_z.x + s_z.y - s * 2.0;

    // Gradient
    gradient[0] = s_dxyz;
    gradient[1] = s_xdyz;
    gradient[2] = s_xydz;

    // Hessian
    hessian[0][0] = s_d2x;
    hessian[1][1] = s_d2y;
    hessian[2][2] = s_d2z;
    hessian[0][1] = s_dxdyz;
    hessian[0][2] = s_dxydz;
    hessian[1][2] = s_xdydz;
    hessian[1][0] = hessian[0][1];
    hessian[2][0] = hessian[0][2];
    hessian[2][1] = hessian[1][2];
        
    // Intensity
    return s_xyz;
}