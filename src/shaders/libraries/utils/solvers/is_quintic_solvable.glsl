#ifndef IS_QUINTIC_SOLVABLE
#define IS_QUINTIC_SOLVABLE

#ifndef QUARTIC_SOLVER
#include "./quartic_solver"
#endif
#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif
#ifndef SORT
#include "../math/sort"
#endif

// compute if quintic polynomial c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y is solvable for x in [xa, xb]

bool is_quintic_solvable(in float c[6], in float y, in vec2 xa_xb, in vec2 ya_yb)
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y
    c[0] -= y;

    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_solver(d, 0.0, xa_xb.y);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));

    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // return result
    return ra0123b;
}

bool is_quintic_solvable(in float c[6], in float y, in vec2 xa_xb, in vec2 ya_yb, out float xa_x0_x1_x2_x3_xb[6], out float ya_y0_y1_y2_y3_yb[6], out bool ra0_r01_r12_r23_r3b[5])
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y
    c[0] -= y;

    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_solver(d, 0.0, xa_xb.y);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);
    sort(x0_x1_x2_x3);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));
    
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

// compute if strict quintic polynomial (c5 != 0) c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y is solvable for x in [xa, xb] and 

bool is_strict_quintic_solvable(in float c[6], in float y, in vec2 xa_xb, in vec2 ya_yb)
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y
    c[0] -= y;

    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots(d, xa_xb.y);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));

    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // return result
    return ra0123b;
}

bool is_strict_quintic_solvable(in float c[6], in float y, in vec2 xa_xb, in vec2 ya_yb, out float xa_x0_x1_x2_x3_xb[6], out float ya_y0_y1_y2_y3_yb[6], out bool ra0_r01_r12_r23_r3b[5])
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y
    c[0] -= y;

    // compute quintic derivative coefficients
    float d[5] = float[5](
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0, 
        c[5] * 5.0
    );

    // solve for the critical points of the quintic polynomial
    vec4 x0_x1_x2_x3 = quartic_roots(d, xa_xb.y);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);
    sort(x0_x1_x2_x3);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 r23_r3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));
    
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
