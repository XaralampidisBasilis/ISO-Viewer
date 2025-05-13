/* Sources: 
    Efficient GPU-Based Texture Interpolation using Uniform B-Splines  
    (https://www.tandfonline.com/doi/abs/10.1080/2151237X.2008.10129269),

    GPU Gems 2, Chapter 20. Fast Third-Order Texture Filtering 
    (https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-20-fast-third-order-texture-filtering),
*/

float tricubic_sampling(in sampler3D tex, in vec3 coordinates)
{
    // Transform to voxel-centered coordinates
    vec3 size = vec3(textureSize(tex, 0));
    vec3 inv_size = 1.0 / size;

    // Compute basis weights
    vec3 aligned = coordinates - 0.5;
    vec3 index = floor(aligned);
    vec3 alpha = aligned - index;
    vec3 one_alpha = 1.0 - alpha;
    vec3 one_alpha2 = one_alpha * one_alpha;
    vec3 alpha2 = alpha * alpha;

    // 1D B-spline weights for each axis
    vec3 w0 = (1.0/6.0) * one_alpha2 * one_alpha;
    vec3 w1 = (2.0/3.0) - 0.5 * alpha2 * (2.0 - alpha);
    vec3 w2 = (2.0/3.0) - 0.5 * one_alpha2 * (2.0 - one_alpha);
    vec3 w3 = (1.0/6.0) * alpha2 * alpha;

    // 1D B-spline trilinear sampling weights
    vec3 g0 = w0 + w1;
    vec3 g1 = w2 + w3;

    // 1D B-spline trilinear sampling offsets
    // h0 = w1/g0 - 1, move from [-0.5, extent-0.5] to [0, extent]
    vec3 h0 = (w1 / g0) - 0.5 + index;
    vec3 h1 = (w3 / g1) + 1.5 + index;

    // Convert to normalized space
    vec3 p0 = h0 * inv_size;
    vec3 p1 = h1 * inv_size;

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
    g0.x);

    // Interpolate along y
    vec2 s_xyz0_xyz1 = mix(
        vec2(s_xy0z0_xy1z0_xy0z1_xy1z1.yw),
        vec2(s_xy0z0_xy1z0_xy0z1_xy1z1.xz),
    g0.y);

    // Interpolate along z
    float s_xyz = mix(
        s_xyz0_xyz1.y,
        s_xyz0_xyz1.x, 
    g0.z);

    // Intensity
    return s_xyz;
}

float tricubic_sampling(in sampler3D tex, in vec3 coordinates, out vec3 gradient)
{
    // Transform to voxel-centered coordinates
    vec3 size = vec3(textureSize(tex, 0));
    vec3 inv_size = 1.0 / size;

    // Compute basis weights
    vec3 aligned = coordinates - 0.5;
    vec3 index = floor(aligned);
    vec3 alpha = aligned - index;
    vec3 one_alpha = 1.0 - alpha;
    vec3 one_alpha2 = one_alpha * one_alpha;
    vec3 alpha2 = alpha * alpha;

    // 1D B-spline and derivative weights for each axis
    vec3 w0 = (1.0/6.0) * one_alpha2 * one_alpha;
    vec3 w1 = (2.0/3.0) - 0.5 * alpha2 * (2.0 - alpha);
    vec3 w2 = (2.0/3.0) - 0.5 * one_alpha2 * (2.0 - one_alpha);
    vec3 w3 = (1.0/6.0) * alpha2 * alpha;
    vec3 dw0 = -0.5 * one_alpha2;
    vec3 dw1 = 0.5 * (3.0 * alpha2 - 4.0 * alpha);
    vec3 dw2 = 0.5 * one_alpha * (3.0 * alpha + 1.0);
    vec3 dw3 = 0.5 * alpha2;

    // 1D B-spline and derivative trilinear sampling weights
    vec3 g0 = w0 + w1;
    vec3 g1 = w2 + w3;
    vec3 dg0 = dw0 + dw1;
    vec3 dg1 = dw2 + dw3;

    // 1D B-spline and derivative trilinear sampling offsets
    // h0 = w1/g0 - 1, move from [-0.5, extent-0.5] to [0, extent]
    vec3 h0 = (w1 / g0) - 0.5 + index;
    vec3 h1 = (w3 / g1) + 1.5 + index;
    vec3 dh0 = (dw1 / dg0) - 0.5 + index;
    vec3 dh1 = (dw3 / dg1) + 1.5 + index;

    // Convert to normalized space
    vec3 p0 = h0 * inv_size;
    vec3 p1 = h1 * inv_size;
    vec3 dp0 = dh0 * inv_size;
    vec3 dp1 = dh1 * inv_size;
 
    // Interpolated intensity
    // Sample the 8 corner points of the interpolation cube 
    vec4 s0_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, p1.z)).r  // x0y1z1
    );

    vec4 s0_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, p1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s0_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s0_x1y0z0_x1y1z0_x1y0z1_x1y1z1,
        s0_x0y0z0_x0y1z0_x0y0z1_x0y1z1,
    g0.x);

    // Interpolate along y
    vec2 s0_xyz0_xyz1 = mix(
        vec2(s0_xy0z0_xy1z0_xy0z1_xy1z1.yw),
        vec2(s0_xy0z0_xy1z0_xy0z1_xy1z1.xz),
    g0.y);

    // Interpolate along z
    float s0_xyz = mix(
        s0_xyz0_xyz1.y,
        s0_xyz0_xyz1.x, 
    g0.z);

    // Partial derivative for x axis
    // Sample the 8 corner points of the interpolation cube 
    vec4 s1_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(dp0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(dp0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(dp0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(dp0.x, p1.y, p1.z)).r  // x0y1z1
    );

    vec4 s1_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(dp1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(dp1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(dp1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(dp1.x, p1.y, p1.z)).r  // x1y1z1
    );

    // Differentiate along x
    vec4 s1_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (s1_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - s1_x0y0z0_x0y1z0_x0y0z1_x0y1z1) * dg0.x;

    // Interpolate along y
    vec2 s1_dxyz0_dxyz1 = mix(
        vec2(s1_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec2(s1_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    g0.y);

    // Interpolate along z
    float s1_dxyz = mix(
        s1_dxyz0_dxyz1.y,
        s1_dxyz0_dxyz1.x, 
    g0.z);

    // Partial derivative for y axis
    // Sample the 8 corner points of the interpolation cube 
    vec4 s2_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, dp0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, dp1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, dp0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, dp1.y, p1.z)).r  // x0y1z1
    );

    vec4 s2_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, dp0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, dp1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, dp0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, dp1.y, p1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s2_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s2_x1y0z0_x1y1z0_x1y0z1_x1y1z1,
        s2_x0y0z0_x0y1z0_x0y0z1_x0y1z1,
    g0.x);

    // Differentiate along y
    vec2 s2_xdyz0_xdyz1 = (s2_xy0z0_xy1z0_xy0z1_xy1z1.yw - s2_xy0z0_xy1z0_xy0z1_xy1z1.xz) * dg0.y;

    // Interpolate along z
    float s2_xdyz = mix(
        s2_xdyz0_xdyz1.y,
        s2_xdyz0_xdyz1.x, 
    g0.z);

    // Partial derivative for z axis
     // Sample the 8 corner points of the interpolation cube 
    vec4 s3_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, dp0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, dp0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, dp1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, dp1.z)).r  // x0y1z1
    );

    vec4 s3_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, dp0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, dp0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, dp1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, dp1.z)).r  // x1y1z1
    );

    // Interpolate along x
    vec4 s3_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s3_x1y0z0_x1y1z0_x1y0z1_x1y1z1,
        s3_x0y0z0_x0y1z0_x0y0z1_x0y1z1,
    g0.x);

    // Interpolate along y
    vec2 s3_xyz0_xyz1 = mix(
        vec2(s3_xy0z0_xy1z0_xy0z1_xy1z1.yw),
        vec2(s3_xy0z0_xy1z0_xy0z1_xy1z1.xz),
    g0.y);

    // Differentiate along z
    float s3_xydz = (s3_xyz0_xyz1.y - s3_xyz0_xyz1.x) * dg0.z;

    // Gradient
    gradient = vec3(s1_dxyz, s2_xdyz, s3_xydz);

    // Reconstructed intensity
    // vec3 delta = alpha - 0.5;
    // float s0 = texture(tex, coordinates * inv_size).r;
    // float s0 = s0 + dot(gradient, delta);

    // Intensity
    return s0_xyz;
}