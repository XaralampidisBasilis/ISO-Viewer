#ifndef TRILINEAR_SOBEL_FILTER
#define TRILINEAR_SOBEL_FILTER

/* Sources
MRIcroGL Gradients
(https://github.com/neurolabusc/blog/blob/main/GL-gradients/README.md),

GPU Gems 2, Chapter 20. Fast Third-Order Texture Filtering 
(https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-20-fast-third-order-texture-filtering),
*/

// Trilinear sobel interpolation basis

void trilinear_sobel_basis(in sampler3D tex, in vec3 coords, out vec3 p0, out vec3 p1)
{
    // Get size and normalized step
    vec3 size = vec3(textureSize(tex, 0));
    vec3 t = 1.0 / size;

    // 1D B-spline filter normalized positions for each axis
    vec3 p = coords * t;
    p0 = p - 0.5 * t;
    p1 = p + 0.5 * t;
}

// Trilinear sobel interpolation samples

void trilinear_sobel_samples(in sampler3D tex, in vec3 p0, in vec3 p1, out vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, out vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1)
{
    // Sample the 8 corner points of the interpolation cube based on p0, p1

    s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        texture(tex, vec3(p0.x, p0.y, p0.z)).r, // x0y0z0
        texture(tex, vec3(p0.x, p1.y, p0.z)).r, // x0y1z0
        texture(tex, vec3(p0.x, p0.y, p1.z)).r, // x0y0z1
        texture(tex, vec3(p0.x, p1.y, p1.z)).r  // x0y1z1
    );

    s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        texture(tex, vec3(p1.x, p0.y, p0.z)).r, // x1y0z0
        texture(tex, vec3(p1.x, p1.y, p0.z)).r, // x1y1z0
        texture(tex, vec3(p1.x, p0.y, p1.z)).r, // x1y0z1
        texture(tex, vec3(p1.x, p1.y, p1.z)).r  // x1y1z1
    );
}

// Trilinear sobel interpolation of value    

float trilinear_sobel_xyz(in sampler3D tex, in vec3 p0, in vec3 p1)
{
    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    0.5);

    // Interpolate along y
    vec2 s_xyz0_xyz1 = mix(
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw,
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz,
    0.5);

    // Interpolate along z
    float s_xyz = mix(
        s_xyz0_xyz1.y,
        s_xyz0_xyz1.x, 
    0.5);

    // Intensity
    return s_xyz;
}

// Trilinear sobel interpolation of gradient

vec3 trilinear_sobel_dxyz_xdyz_xydz(in sampler3D tex, in vec3 p0, in vec3 p1)
{
    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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
    vec2 s_xdyz0_xdyz1 = (
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw - 
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz
    );

    // Interpolate along z
    vec2 s_dxyz_xdyz = mix(
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1.y),
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1.x), 
    0.5);

    // Differentiate across z
    float s_xydz = (
        s_xyz0_xyz1_dxyz0_dxyz1.y - 
        s_xyz0_xyz1_dxyz0_dxyz1.x
    );

    // Gradient
    return vec3(s_dxyz_xdyz, s_xydz);
}

// Trilinear sobel interpolation of hessian

vec3 trilinear_sobel_xdydz_dxydz_dxdyz(in sampler3D tex, in vec3 p0, in vec3 p1)
{
    // Mixed second derivatives of xyz axes

    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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
    vec2 s_dxyz0_dxyz1 = mix(
        s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw,
        s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz,
    0.5);

    // Differentiate across y
    vec4 s_xdyz0_xdyz1_dxdyz0_dxdyz1 = (
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw) - 
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz)
    );

    // Interpolate along z
    float s_dxdyz = mix(
        s_xdyz0_xdyz1_dxdyz0_dxdyz1.w,
        s_xdyz0_xdyz1_dxdyz0_dxdyz1.z,
    0.5);

    // Differentiate across z 
    vec2 s_xdydz_dxydz = (
        vec2(s_xdyz0_xdyz1_dxdyz0_dxdyz1.y, s_dxyz0_dxyz1.y) - 
        vec2(s_xdyz0_xdyz1_dxdyz0_dxdyz1.x, s_dxyz0_dxyz1.x)
    );

    // Mixes derivatives
    return vec3(s_xdydz_dxydz, s_dxdyz);
}

vec3 trilinear_sobel_d2x_d2y_d2z(in sampler3D tex, in vec3 coords)
{
    // Pure second derivatives of xyz axes

    // Get size, normalized position and step
    vec3 size = vec3(textureSize(tex, 0));
    vec3 t = 1.0 / size;
    vec3 p = coords * t;

    // Central differences samples
    float s = texture(tex, p).r;

    vec3 s_x0_y0_z0 = vec3(
        texture(tex, vec3(p.x - t.x, p.y, p.z)).r,
        texture(tex, vec3(p.x, p.y - t.y, p.z)).r,
        texture(tex, vec3(p.x, p.y, p.z - t.z)).r
    );

    vec3 s_x1_y1_z1 = vec3(
        texture(tex, vec3(p.x + t.x, p.y, p.z)).r,
        texture(tex, vec3(p.x, p.y + t.y, p.z)).r,
        texture(tex, vec3(p.x, p.y, p.z + t.z)).r
    );

    // Pure second derivatives
    vec3 s_d2x_d2y_d2z = s_x0_y0_z0 + s_x1_y1_z1 - s * 2.0;

    return s_d2x_d2y_d2z;
}

// Trilinear sobel interpolations

void trilinear_sobel_value(in sampler3D tex, in vec3 coords, out float value)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);

    // Value
    value = trilinear_sobel_xyz(tex, p0, p1);
}

void trilinear_sobel_gradient(in sampler3D tex, in vec3 coords,  out vec3 gradient)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);
 
    // Gradient
    gradient = trilinear_sobel_dxyz_xdyz_xydz(tex, p0, p1);
}
 
void trilinear_sobel_hessian(in sampler3D tex, in vec3 coords, out mat3 hessian)
{
    vec3 p0; vec3 p1; 
    trilinear_sobel_basis(tex, coords, p0, p1);
 
    // Mixed derivatives
    vec3 s_xdydz_dxydz_dxdyz = trilinear_sobel_xdydz_dxydz_dxdyz(tex, p0, p1);

    // Pure derivatives
    vec3 s_d2x_d2y_d2z = trilinear_sobel_d2x_d2y_d2z(tex, coords);

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_xdydz_dxydz_dxdyz.z, s_xdydz_dxydz_dxdyz.y,  
       s_xdydz_dxydz_dxdyz.z, s_d2x_d2y_d2z.y, s_xdydz_dxydz_dxdyz.x,  
       s_xdydz_dxydz_dxdyz.y, s_xdydz_dxydz_dxdyz.x, s_d2x_d2y_d2z.z     
   );
}

void trilinear_sobel_value_hessian(in sampler3D tex, in vec3 coords, out float value, out mat3 hessian)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);

    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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
    vec2 s_xyz_dxdyz = mix(
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.y, s_xdyz0_xdyz1_dxdyz0_dxdyz1.w),
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.x, s_xdyz0_xdyz1_dxdyz0_dxdyz1.z),
    0.5);

    // Differentiate across z
    vec2 s_dxydz_xdydz = (
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    );

    // Pure derivatives
    vec3 s_d2x_d2y_d2z = trilinear_sobel_d2x_d2y_d2z(tex, coords);

    // Value
    value = s_xyz_dxdyz.x;

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_xyz_dxdyz.y, s_dxydz_xdydz.x,  
       s_xyz_dxdyz.y, s_d2x_d2y_d2z.y, s_dxydz_xdydz.y,  
       s_dxydz_xdydz.x, s_dxydz_xdydz.y, s_d2x_d2y_d2z.z     
   );
}

void trilinear_sobel_value_gradient(in sampler3D tex, in vec3 coords, out float value, out vec3 gradient)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);

    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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
    vec2 s_xdyz0_xdyz1 = (
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw - 
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz
    );

    // Interpolate along z
    vec3 s_xyz_dxyz_xdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1.y),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1.x), 
    0.5);

    // Differentiate across z
    float s_xydz = (
        s_xyz0_xyz1_dxyz0_dxyz1.y - 
        s_xyz0_xyz1_dxyz0_dxyz1.x
    );

    // Value
    value = s_xyz_dxyz_xdyz.x;

    // Gradient
    gradient = vec3(s_xyz_dxyz_xdyz.yz, s_xydz);
}

void trilinear_sobel_gradient_hessian(in sampler3D tex, in vec3 coords, out vec3 gradient, out mat3 hessian)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);

    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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

    // Pure derivatives
    vec3 s_d2x_d2y_d2z = trilinear_sobel_d2x_d2y_d2z(tex, coords);

    // Gradient
    gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
       s_dxyz_xdyz_dxdyz.z, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
       s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
   );
}

void trilinear_sobel_value_gradient_hessian(in sampler3D tex, in vec3 coords, out float value, out vec3 gradient, out mat3 hessian)
{
    vec3 p0; vec3 p1;
    trilinear_sobel_basis(tex, coords, p0, p1);

    // Sample cube
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1; vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1;
    trilinear_sobel_samples(tex, p0, p1, s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, s_x1y0z0_x1y1z0_x1y0z1_x1y1z1);

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
    vec4 s_xyz_dxyz_xdyz_dxdyz = mix(
        vec4(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.yw),
        vec4(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.xz),
    0.5);

    // Differentiate across z
    vec3 s_xydz_dxydz_xdydz = (
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    );

    // Pure derivatives
    vec3 s_d2x_d2y_d2z = trilinear_sobel_d2x_d2y_d2z(tex, coords);

    // Value
    value = s_xyz_dxyz_xdyz_dxdyz.x;

    // Gradient
    gradient = vec3(s_xyz_dxyz_xdyz_dxdyz.yz, s_xydz_dxydz_xdydz.x);

    // Hessian
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_xyz_dxyz_xdyz_dxdyz.w, s_xydz_dxydz_xdydz.y,  
       s_xyz_dxyz_xdyz_dxdyz.w, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
       s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
   );
}

#endif