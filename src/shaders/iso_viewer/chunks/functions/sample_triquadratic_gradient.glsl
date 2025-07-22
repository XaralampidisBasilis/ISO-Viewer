/* Sources
One Step Further Beyond Trilinear Interpolation and Central
Differences: Triquadratic Reconstruction and its Analytic
Derivatives at the Cost of One Additional Texture Fetch 
(https://onlinelibrary.wiley.com/doi/10.1111/cgf.14753),

GPU Gems 2, Chapter 20. Fast Third-Order Texture Filtering 
(https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-20-fast-third-order-texture-filtering),
*/

#ifndef SAMPLE_TRIQUADRATIC_GRADIENT
#define SAMPLE_TRIQUADRATIC_GRADIENT

#ifndef SAMPLE_TRILINEAR_VOLUME
#include "./sample_trilinear_volume"
#endif
#ifndef SAMPLE_TRICUBIC_VOLUME
#include "./sample_tricubic_volume"
#endif

void compute_triquadratic_parameters(in vec3 p, out vec3 p0, out vec3 p1, out vec3 g0)
{
    // Convert to voxel-space and compute local coordinates
    vec3 x = p - 0.5;
    vec3 b = x - round(x);

    // 1D B-spline filter coefficients for each axis
    g0 = 0.5 - b;

    // 1D B-spline filter offsets for each axis
    vec3 h0 = (0.5 + b) * 0.5;

    // 1D B-spline filter normalized positions for each axis
    p0 = p - h0;
    p1 = p0 + 0.5;
}

vec3 compute_hessian_diagonal(in vec3 p)
{
    #if INTERPOLATION_METHOD == 1

        // Central differencing samples
        vec3 s_x0yz_xy0z_xyz0 = vec3(
            sample_trilinear_volume(vec3(p.x - 1.0, p.y, p.z)),
            sample_trilinear_volume(vec3(p.x, p.y - 1.0, p.z)),
            sample_trilinear_volume(vec3(p.x, p.y, p.z - 1.0))
        );

        vec3 s_x1yz_xy1z_xyz1 = vec3(
            sample_trilinear_volume(vec3(p.x + 1.0, p.y, p.z)),
            sample_trilinear_volume(vec3(p.x, p.y + 1.0, p.z)),
            sample_trilinear_volume(vec3(p.x, p.y, p.z + 1.0))
        );

        // Pure second derivatives
        return s_x0yz_xy0z_xyz0 + s_x1yz_xy1z_xyz1 - sample_trilinear_volume(p) * 2.0;

    #endif

    #if INTERPOLATION_METHOD == 2

        return sample_tricubic_features(p).xyz;

    #endif
}

vec2 compute_principal_curvatures(in vec3 gradient, in mat3 hessian)
{
    vec3 normal = normalize(gradient);

    // create a linearly independent vector from normal 
    vec3 independent = (abs(normal.x) < abs(normal.y)) 
        ? (abs(normal.x) < abs(normal.z) ? vec3(1, 0, 0) : vec3(0, 0, 1)) 
        : (abs(normal.y) < abs(normal.z) ? vec3(0, 1, 0) : vec3(0, 0, 1));

    // compute arbitrary orthogonal tangent space
    mat2x3 tangent;
    tangent[0] = normalize(independent - normal * dot(independent, normal)); 
    tangent[1] = cross(normal, tangent[0]);

    // compute shape operator projected into the tangent space
    mat2 shape = (transpose(tangent) * hessian) * tangent / length(gradient);
    float determinant = determinant(shape);
    float trace = (shape[0][0] + shape[1][1]) * 0.5;

    // compute principal curvatures as eigenvalues of shape operator
    float discriminant = sqrt(abs(trace * trace - determinant));
    vec2 curvatures = trace + discriminant * vec2(-1, 1);

    // return curvatures
    return curvatures;
}

vec3 sample_triquadratic_gradient(in vec3 p)
{
    vec3 p0, p1, g0;
    compute_triquadratic_parameters(p, p0, p1, g0);
 
    // Cube samples
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_trilinear_volume(vec3(p0.x, p0.y, p0.z)), 
        sample_trilinear_volume(vec3(p0.x, p1.y, p0.z)), 
        sample_trilinear_volume(vec3(p0.x, p0.y, p1.z)), 
        sample_trilinear_volume(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_trilinear_volume(vec3(p1.x, p0.y, p0.z)), 
        sample_trilinear_volume(vec3(p1.x, p1.y, p0.z)), 
        sample_trilinear_volume(vec3(p1.x, p0.y, p1.z)), 
        sample_trilinear_volume(vec3(p1.x, p1.y, p1.z))  
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    g0.x);

    // Differentiate across x
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    ) * 2.0;

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    g0.y);

    // Differentiate across y
    vec2 s_xdyz0_xdyz1 = (
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw - 
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz
    ) * 2.0;

    // Interpolate along z
    vec2 s_dxyz_xdyz = mix(
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1.y),
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1.x), 
    g0.z);

    // Differentiate across z
    float s_xydz = (
        s_xyz0_xyz1_dxyz0_dxyz1.y - 
        s_xyz0_xyz1_dxyz0_dxyz1.x
    ) * 2.0;

    // Gradient
    vec3 gradient = vec3(s_dxyz_xdyz, s_xydz);

    // Scale from grid to physical space
    gradient /= normalize(u_volume.spacing);

    return gradient;
}
 
vec3 sample_triquadratic_gradient(in vec3 p, out vec2 curvatures)
{
    vec3 p0, p1, g0;
    compute_triquadratic_parameters(p, p0, p1, g0);

    // Cube samples
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_trilinear_volume(vec3(p0.x, p0.y, p0.z)), 
        sample_trilinear_volume(vec3(p0.x, p1.y, p0.z)), 
        sample_trilinear_volume(vec3(p0.x, p0.y, p1.z)), 
        sample_trilinear_volume(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_trilinear_volume(vec3(p1.x, p0.y, p0.z)), 
        sample_trilinear_volume(vec3(p1.x, p1.y, p0.z)), 
        sample_trilinear_volume(vec3(p1.x, p0.y, p1.z)), 
        sample_trilinear_volume(vec3(p1.x, p1.y, p1.z))  
    );

    // Interpolate along x
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    g0.x);

    // Differentiate across x
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    ) * 2.0;

    // Interpolate along y
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    g0.y);

    // Differentiate across y
    vec4 s_xdyz0_xdyz1_dxdyz0_dxdyz1 = (
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw) -
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz)
    ) * 2.0;

    // Interpolate along z
    vec3 s_dxyz_xdyz_dxdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1_dxdyz0_dxdyz1.yw),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1_dxdyz0_dxdyz1.xz), 
    g0.z);

    // Differentiate across z
    vec3 s_xydz_dxydz_xdydz = (
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    ) * 2.0;

    // Pure second derivatives
    vec3 s_ddx_ddy_ddz = compute_hessian_diagonal(p);

    // Gradient
    vec3 gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    // Hessian
    mat3 hessian = mat3(
        s_ddx_ddy_ddz.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
        s_dxyz_xdyz_dxdyz.z, s_ddx_ddy_ddz.y, s_xydz_dxydz_xdydz.z,  
        s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_ddx_ddy_ddz.z     
    );

    // Scale from grid to physical space
    vec3 scale = normalize(u_volume.spacing);
    hessian /= outerProduct(scale, scale);
    gradient /= scale;

    // Principal curvatures
    curvatures = compute_principal_curvatures(gradient, hessian);

    // Return Gradient
    return gradient;
}

#endif