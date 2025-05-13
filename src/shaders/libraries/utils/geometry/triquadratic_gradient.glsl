/* Source
    One Step Further Beyond Trilinear Interpolation and Central
    Differences: Triquadratic Reconstruction and its Analytic
    Derivatives at the Cost of One Additional Texture Fetch
*/

vec3 triquadratic_reconstruction(in sampler3D tex, in vec3 coordinates, out vec3 gradient)
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

    // Gradient
    return vec4(s_xyz_dxyz_xdyz.yz, s_xydz, s_xyz_dxyz_xdyz.x);
}