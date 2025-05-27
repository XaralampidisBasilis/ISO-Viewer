#ifndef IS_QUINTIC_SOLVABLE
#define IS_QUINTIC_SOLVABLE

#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef EVAL_POLY
#include "../math/eval_poly"
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
    vec4 x0_x1_x2_x3 = quartic_roots_3(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    eval_poly(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // compute the quintic boundary values
    vec2 ya_yb;
    eval_poly(c, xa_xb, ya_yb);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    bvec4 sa_s0_s1_s2 = lessThan(ya_y0_y1_y2, vec4(0.0));
    bvec3 s2_s3_sb = lessThan(y2_y3_yb, vec3(0.0));

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = notEqual(sa_s0_s1_s2.xyz, sa_s0_s1_s2.yzw);
    bvec2 r23_r3b = notEqual(s2_s3_sb.xy, s2_s3_sb.yz);

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
    vec4 x0_x1_x2_x3 = quartic_roots_3(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    eval_poly(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    bvec4 sa_s0_s1_s2 = lessThan(ya_y0_y1_y2, vec4(0.0));
    bvec3 s2_s3_sb = lessThan(y2_y3_yb, vec3(0.0));

    // compute sign changes with intermediate value theorem to detect roots
    bvec3 ra0_r01_r12 = notEqual(sa_s0_s1_s2.xyz, sa_s0_s1_s2.yzw);
    bvec2 r23_r3b = notEqual(s2_s3_sb.xy, s2_s3_sb.yz);

    // detect any sign change
    bool ra012 = any(ra0_r01_r12);
    bool r23b = any(r23_r3b);
    bool ra0123b = ra012 || r23b;

    // return result
    return ra0123b;
}

bool is_quintic_solvable(in float c[6], in vec2 xa_xb, in vec2 ya_yb, out float nr)
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
    vec4 x0_x1_x2_x3 = quartic_roots_3(d, xa_xb.x);
    x0_x1_x2_x3 = clamp(x0_x1_x2_x3, xa_xb.x, xa_xb.y);

    // compute the quintic extrema values at the critical points
    vec4 y0_y1_y2_y3;
    eval_poly(c, x0_x1_x2_x3, y0_y1_y2_y3);

    // combine function values
    vec4 ya_y0_y1_y2 = vec4(ya_yb.x, y0_y1_y2_y3.xyz);
    vec3 y2_y3_yb = vec3(y0_y1_y2_y3.zw, ya_yb.y);

    // extract only signs for numerical stability
    vec4 sa_s0_s1_s2 = sign(ya_y0_y1_y2);
    vec3 s2_s3_sb = sign(y2_y3_yb);

    // compute sign changes with intermediate value theorem to detect roots
    vec3 ra0_r01_r12 = step(sa_s0_s1_s2.xyz * sa_s0_s1_s2.yzw, vec3(0.0));
    vec2 r23_r3b = step(s2_s3_sb.xy * s2_s3_sb.yz, vec2(0.0));

    // count the sign changes that correspond to roots
    nr = dot(vec3(1.0), ra0_r01_r12) +
         dot(vec2(1.0), r23_r3b);

    // return result
    return (nr > 0.5);
}

#endif
