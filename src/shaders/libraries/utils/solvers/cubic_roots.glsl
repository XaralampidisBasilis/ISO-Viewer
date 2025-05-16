
/* Sources
Based on Blinn's paper (https://courses.cs.washington.edu/courses/cse590b/13au/lecture_notes/solvecubic_p5.pdf),
Article by Christoph Peters (https://momentsingraphics.de/CubicRoots.html#_Blinn07b),
Shadertoy Cubic Equation Solver II (https://www.shadertoy.com/view/7tBGzK),
Shadertoy Quartic Reflections https://www.shadertoy.com/view/flBfzm,
*/

#ifndef CUBIC_ROOTS
#define CUBIC_ROOTS

#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif
#ifndef CBRT
#include "../math/cbrt"
#endif
#ifndef PICK
#include "../math/pick"
#endif
#ifndef SQRT_3
#define SQRT_3 1.73205080757
#endif
#ifndef NAN
#define NAN uintBitsToFloat(0x7fc00000u)
#endif

// Solves the cubic equation: c[0] + c[1]*x^1 + c[2]*x^2 + c[3]*x^3 = 0
// We assume non zero cubic coefficient
// x0 is the fallback root

vec3 cubic_roots(in vec4 c, in float x0)
{
    // Flip to minimize instability
    bool flip = abs(c.z * c.x) >= abs(c.y * c.w);
    c = (flip) ? c.wzyx : c;

    // normalize coefficients
    vec3 nc = c.xyz / c.w;
    nc.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 h = vec3(
        nc.y - nc.z * nc.z,                          // δ1 = c.w * c.y - c.z^2
        nc.x - nc.y * nc.z,                          // δ2 = c.w * c.x - c.y * c.z
        dot(vec2(nc.z, -nc.y), nc.xy)    // δ3 = c.z * c.x - c.y * c.x
    );

    // compute cubic discriminant eq(0.7)
    float d = dot(vec2(h.x * 4.0, -h.y), h.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_d = sqrt(abs(d));

    // compute depressed cubic eq(0.16), rc[0] + rc[1] * x + x^3 eq(0.11) eq(0.16)
    vec2 rc = vec2(h.y - nc.z * h.x * 2.0, h.x);
    
    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    float x1 = 
        cbrt((-rc.x + sqrt_d) * 0.5) +
        cbrt((-rc.x - sqrt_d) * 0.5) -
        nc.z;

    // compute cubic roots using complex number formula eq(0.14)  
    // compute three roots via rotation, applying complex root formula eq(0.14)
    float theta = atan(sqrt_d, -rc.x) / 3.0;
    vec2 x2 = vec2(cos(theta), sin(theta));
    vec3 x3 = vec3(
        x2.x,                                 // First root
        dot(vec2(-0.5, -0.5 * SQRT_3), x2),   // Second root (rotated by 120 degrees)
        dot(vec2(-0.5,  0.5 * SQRT_3), x2)    // Third root (rotated by -120 degrees)
    );

    // revert transformation eq(0.2) and eq(0.16)
    x3 = x3 * sqrt(max(0.0, -rc.y)) * 2.0 - nc.z; 

    // Improve numerical stability of roots with Newton–Raphson correction
    vec4 x3_x1 = vec4( x3, x1);
    vec4 f, f1;
    poly_horner(c, x3_x1, f, f1);
    x3_x1 -= f / f1; 
    poly_horner(c, x3_x1, f, f1);
    x3_x1 -= f / f1; 

    // choose cubic roots based on discriminant sign 
    vec3 x = (d >= 0.0) ? x3_x1.xyz : vec3(x3_x1.w, vec2(NAN));

    // flip back results and replace nan with fallback
    x = (flip) ? 1.0/x : x;
    x = pick(isnan(x), vec3(x0), x);

    // return result
    return x;
}

// vec3 cubic_roots(in vec4 c, in float x0)
// {
//     // normalize coefficients
//     vec3 nc = c.xyz / c.w;
//     nc.yz /= 3.0;

//     // compute hessian coefficients eq(0.4)
//     vec3 h = vec3(
//         nc.y - nc.z * nc.z,                          // δ1 = c.w * c.y - c.z^2
//         nc.x - nc.y * nc.z,                          // δ2 = c.w * c.x - c.y * c.z
//         dot(vec2(nc.z, -nc.y), nc.xy)    // δ3 = c.z * c.x - c.y * c.x
//     );

//     // compute cubic discriminant eq(0.7)
//     float d = dot(vec2(h.x * 4.0, -h.y), h.zy); // Δ = δ1 * δ3 - δ2^2
//     float sqrt_d = sqrt(abs(d));

//     // compute depressed cubic eq(0.16), rc[0] + rc[1] * x + x^3 eq(0.11) eq(0.16)
//     vec2 rc = vec2(h.y - nc.z * h.x * 2.0, h.x);
    
//     // compute real root using cubic root formula for one real and two complex roots eq(0.15)
//     float x1 = 
//         cbrt((-rc.x + sqrt_d) * 0.5) +
//         cbrt((-rc.x - sqrt_d) * 0.5) -
//         nc.z;

//     // compute cubic roots using complex number formula eq(0.14)  
//     // compute three roots via rotation, applying complex root formula eq(0.14)
//     float theta = atan(sqrt_d, -rc.x) / 3.0;
//     vec2 x2 = vec2(cos(theta), sin(theta));
//     vec3 x3 = vec3(
//         x2.x,                                 // First root
//         dot(vec2(-0.5, -0.5 * SQRT_3), x2),   // Second root (rotated by 120 degrees)
//         dot(vec2(-0.5,  0.5 * SQRT_3), x2)    // Third root (rotated by -120 degrees)
//     );

//     // revert transformation eq(0.2) and eq(0.16)
//     x3 = x3 * sqrt(max(0.0, -rc.y)) * 2.0 - nc.z; 

//     // choose cubic roots based on discriminant sign 
//     vec3 x = (d >= 0.0) ? x3 : vec3(x1, vec2(x0));

//     // return result
//     return x;
// }

#endif





