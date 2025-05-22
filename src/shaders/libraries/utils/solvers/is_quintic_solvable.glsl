#ifndef IS_QUINTIC_SOLVABLE
#define IS_QUINTIC_SOLVABLE

#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

// compute if quintic polynomial c0 + c1x + c2x^2 + c3x^3 + c4x^4 + c5x^5 = y is solvable for x in [xa, xb]

bool is_quintic_solvable(in float c[6], in float y, in vec2 xa_xb)
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
    vec4 x0_x1_x2_x3 = quartic_roots(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // compute the quintic at the boundaries
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec3 sa0_s01_s12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 s23_s3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));
    
    // detect any sign change
    bool sa012 = any(sa0_s01_s12);
    bool s23b = any(s23_s3b);

    // return result
    return sa012 || s23b;
}

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
    vec4 x0_x1_x2_x3 = quartic_roots(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    poly_horner(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec3 sa0_s01_s12 = lessThanEqual(ya_y0_y1_y2.xyz * ya_y0_y1_y2.yzw, vec3(0.0));
    bvec2 s23_s3b = lessThanEqual(y2_y3_yb.xy * y2_y3_yb.yz, vec2(0.0));

    // detect any sign change
    bool sa012 = any(sa0_s01_s12);
    bool s23b = any(s23_s3b);

    // return result
    return sa012 || s23b;
}

#endif
