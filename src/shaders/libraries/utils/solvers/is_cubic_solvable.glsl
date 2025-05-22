#ifndef IS_CUBIC_SOLVABLE
#define IS_CUBIC_SOLVABLE

#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

// compute if cubic polynomial c0 + c1x + c2x^2 + c3x^3 = y is solvable for x in [xa, xb]

bool is_cubic_solvable(in vec4 c, in float y, in vec2 xa_xb)
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 = y
    c.x -= y;

    // compute cubic derivative coefficients
    vec3 d = c.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 x0_x1 = quadratic_roots(d, xa_xb.x);
    x0_x1 = clamp(x0_x1, xa_xb.x, xa_xb.y);

    // compute the cubic extrema values at the critical points
    vec2 y0_y1;
    poly_horner(c, x0_x1, y0_y1);

  // compute the cubic at the boundaries
    vec2 ya_yb;
    poly_horner(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_yb = vec4(ya_yb.x, y0_y1, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec3 sa0_s01_s1b = lessThanEqual(ya_y0_y1_yb.xyz * ya_y0_y1_yb.yzw, vec3(0.0));

    // return result
    return any(sa0_s01_s1b);
}

bool is_cubic_solvable(in vec4 c, in float y, in vec2 xa_xb, in vec2 ya_yb)
{
    // normalize equation c0 + c1x + c2x^2 + c3x^3 = y
    c.x -= y;
    ya_yb -= y;

    // compute cubic derivative coefficients
    vec3 d = c.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 x0_x1 = quadratic_roots(d, xa_xb.x);
    x0_x1 = clamp(x0_x1, xa_xb.x, xa_xb.y);

    // compute the cubic extrema values at the critical points
    vec2 y0_y1;
    poly_horner(c, x0_x1, y0_y1);

    // combine function values
    vec4 ya_y0_y1_yb = vec4(ya_yb.x, y0_y1, ya_yb.y);

    // compute sign changes for intermediate value theorem
    bvec3 sa0_s01_s1b = lessThanEqual(ya_y0_y1_yb.xyz * ya_y0_y1_yb.yzw, vec3(0.0));

    // return result
    return any(sa0_s01_s1b);
}

#endif
