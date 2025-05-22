#ifndef IS_QUADRATIC_SOLVABLE
#define IS_QUADRATIC_SOLVABLE

#ifndef LINEAR_ROOTS
#include "./linear_root"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

// compute if quadratic polynomial c0 + c1x + c2x^2 = y is solvable for x in [xa, xb]

bool is_quadratic_solvable(in vec3 c, in float y, in vec2 xa_xb)
{
    // normalize equation c0 + c1x + c2x^2 = y
    c.x -= y;

    // compute quadratic derivative coefficients
    vec2 d = vec2(c.y, c.z * 2.0);

    // solve for the critical point of the quadratic polynomial
    float x0 = linear_root(d);
    x0 = clamp(x0, xa_xb.x, xa_xb.y);

    // compute the quadratic extrema value at the critical point
    float y0;
    poly_horner(c, x0, y0);

    // compute the quadratic at the boundaries
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values into a single vector
    vec3 ya_y0_yb = vec3(ya_yb.x, y0, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec2 sa0_s0b = lessThanEqual(ya_y0_yb.xy * ya_y0_yb.yz, vec2(0.0));

    // return result
    return any(sa0_s0b);
}

bool is_quadratic_solvable(in vec3 c, in float y, in vec2 xa_xb, in vec2 ya_yb)
{
    // normalize equation c0 + c1x + c2x^2 = y
    c.x -= y;
    ya_yb -= y;

    // compute quadratic derivative coefficients
    vec2 d = vec2(c.y, c.z * 2.0);

    // solve for the critical point of the quadratic polynomial
    float x0 = linear_root(d);
    x0 = clamp(x0, xa_xb.x, xa_xb.y);

    // compute the quadratic extrema value at the critical point
    float y0;
    poly_horner(c, x0, y0);

    // combine function values into a single vector
    vec3 ya_y0_yb = vec3(ya_yb.x, y0, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec2 sa0_s0b = lessThanEqual(ya_y0_yb.xy * ya_y0_yb.yz, vec2(0.0));

    // return result
    return any(sa0_s0b);
}

#endif
