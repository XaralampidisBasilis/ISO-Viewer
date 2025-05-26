#ifndef IS_QUARTIC_SOLVABLE
#define IS_QUARTIC_SOLVABLE

#ifndef CUBIC_ROOTS
#include "./cubic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

// compute if quartic polynomial c0 + c1x + c2x^2 + c3x^3 + c4x^4 = y is solvable for x in [xa, xb]

bool is_quartic_solvable(in float c[5], in vec2 xa_xb)
{
    // compute quartic derivative coefficients
    vec4 d = vec4(
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0
    );

    // solve for the critical points of the quartic polynomial
    vec3 x0_x1_x2 = cubic_roots(d, xa_xb.x);
    x0_x1_x2 = clamp(x0_x1_x2, xa_xb.x, xa_xb.y);

    // compute the quartic extrema values at the critical points
    vec3 y0_y1_y2;
    poly_horner(c, x0_x1_x2, y0_y1_y2);

  // compute the quartic at the boundaries
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2);
    vec4 y0_y1_y2_yb = vec4(y0_y1_y2, ya_yb.y);

    // compute signs for better numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec4 s0_s1_s2_sb = sign(y0_y1_y2_yb);

    // compute sign changes for intermediate value theorem
    bvec4 ra0_r01_r12_r2b = lessThanEqual(sa_s0_s1_s2 * s0_s1_s2_sb, vec4(0.0));

    // return result
    return any(ra0_r01_r12_r2b);
}

bool is_quartic_solvable(in float c[5], in vec2 xa_xb, in vec2 ya_yb)
{
    // compute quartic derivative coefficients
    vec4 d = vec4(
        c[1], 
        c[2] * 2.0, 
        c[3] * 3.0, 
        c[4] * 4.0
    );

    // solve for the critical points of the quartic polynomial
    vec3 x0_x1_x2 = cubic_roots(d, xa_xb.x);
    x0_x1_x2 = clamp(x0_x1_x2, xa_xb.x, xa_xb.y);

    // compute the quartic extrema values at the critical points
    vec3 y0_y1_y2;
    poly_horner(c, x0_x1_x2, y0_y1_y2);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2);
    vec4 y0_y1_y2_yb = vec4(y0_y1_y2, ya_yb.y);

    // compute signs for better numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec4 s0_s1_s2_sb = sign(y0_y1_y2_yb);

    // compute sign changes for intermediate value theorem
    bvec4 ra0_r01_r12_r2b = lessThanEqual(sa_s0_s1_s2 * s0_s1_s2_sb, vec4(0.0));

    // return result
    return any(ra0_r01_r12_r2b);
}

#endif
