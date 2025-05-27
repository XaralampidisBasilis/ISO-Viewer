#ifndef IS_QUINTIC_SOLVABLE
#define IS_QUINTIC_SOLVABLE

#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif
#ifndef SORT
#include "../math/sort"
#endif

// compute if quintic polynomial c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = 0 is solvable for x in [xa, xb]

bool is_quintic_solvable(in float c[6], in vec2 xa_xb)
{
    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots_2(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // compute the quintic boundary values
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec3 s2_s3_sb = sign(y2_y3_yb);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(sa_s0_s1_s2.xyz * sa_s0_s1_s2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(s2_s3_sb.xy * s2_s3_sb.yz, vec2(0.0));

    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // return result
    return ra0123b;
}

bool is_quintic_solvable(in float c[6], in vec2 xa_xb, in vec2 ya_yb)
{
    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots_2(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec3 s2_s3_sb = sign(y2_y3_yb);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(sa_s0_s1_s2.xyz * sa_s0_s1_s2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(s2_s3_sb.xy * s2_s3_sb.yz, vec2(0.0));

    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // return result
    return ra0123b;
}

bool is_quintic_solvable(in float c[6], in vec2 xa_xb, out float xa_x0_x1_x2_x3_xb[6], out float ya_y0_y1_y2_y3_yb[6], out bool ra0_r01_r12_r23_r3b[5])
{
    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots_2(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);
    sort(x0_x1_x2_x3);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // compute the quintic boundary values
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec3 s2_s3_sb = sign(y2_y3_yb);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(sa_s0_s1_s2.xyz * sa_s0_s1_s2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(s2_s3_sb.xy * s2_s3_sb.yz, vec2(0.0));
    
    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // outputs
    xa_x0_x1_x2_x3_xb = float[6](xa_xb.x, x0_x1_x2_x3.x, x0_x1_x2_x3.y, x0_x1_x2_x3.z, x0_x1_x2_x3.w, xa_xb.y);
    ya_y0_y1_y2_y3_yb = float[6](ya_yb.x, ya_y0_y1_y2.x, ya_y0_y1_y2.y, ya_y0_y1_y2.z, ya_y0_y1_y2.w, ya_yb.y);
    ra0_r01_r12_r23_r3b = bool[5](ra0_r01_r12.x, ra0_r01_r12.y, ra0_r01_r12.z, r23_r3b.x, r23_r3b.y);

    // return result
    return ra0123b;
}

bool is_quintic_solvable(in float c[6], in vec2 xa_xb, in vec2 ya_yb, out float xa_x0_x1_x2_x3_xb[6], out float ya_y0_y1_y2_y3_yb[6], out bool ra0_r01_r12_r23_r3b[5])
{
    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots_2(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);
    sort(x0_x1_x2_x3);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec3 s2_s3_sb = sign(y2_y3_yb);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(sa_s0_s1_s2.xyz * sa_s0_s1_s2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(s2_s3_sb.xy * s2_s3_sb.yz, vec2(0.0));
    
    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // outputs
    xa_x0_x1_x2_x3_xb = float[6](xa_xb.x, x0_x1_x2_x3.x, x0_x1_x2_x3.y, x0_x1_x2_x3.z, x0_x1_x2_x3.w, xa_xb.y);
    ya_y0_y1_y2_y3_yb = float[6](ya_yb.x, ya_y0_y1_y2.x, ya_y0_y1_y2.y, ya_y0_y1_y2.z, ya_y0_y1_y2.w, ya_yb.y);
    ra0_r01_r12_r23_r3b = bool[5](ra0_r01_r12.x, ra0_r01_r12.y, ra0_r01_r12.z, r23_r3b.x, r23_r3b.y);

    // return result
    return ra0123b;
}

#endif
