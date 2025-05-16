

#ifndef QUARTIC_SOLVER
#define QUARTIC_SOLVER

#ifndef LINEAR_ROOT
#include "./linear_root"
#endif
#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef CUBIC_ROOTS
#include "./cubic_roots"
#endif
#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

// Solve quartic equation c0 + c1x^1 + c2x^2 + c3x^3 + c4x^4 = y
// x0 is the fallback root

// vec3 quartic_solver(in float c0, in float c1, in float c2, in float c3, in float c4, in float y, in float x0)
// {
//     // normalize equation 
//     // c0 - y + c1x^1 + c2x^2 + c3x^3 + c4x^4 = 0
//     c0 -= y;

//     // compute case flags
//     bool is_quar = abs(c4) > MICRO_TOLERANCE;
//     bool is_cube = abs(c3) > MICRO_TOLERANCE;
//     bool is_quad = abs(c2) > MICRO_TOLERANCE;
//     bool is_line = abs(c1) > MICRO_TOLERANCE;

//     // compute case roots
//     vec3  x4 = quartic_roots(c0, c1, c2, c3, c4, x0);
//     vec3  x3 = cubic_roots(vec4(c0, c1, c2, c3), x0);
//     vec2  x2 = quadratic_roots(vec3(c0, c1, c2), x0);
//     float x1 = linear_root(vec2(c0, c1));

//     // branchless solution 
//     float r1 = (is_line) ? x1 : x0;
//     vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);
//     vec3  r3 = (is_cube) ? x3 : vec3(r2, x0);
//     vec4  r4 = (is_quar) ? x4 : vec4(r3, x0);

//     return r4;
// }

// branching
vec3 quartic_solver(in float c0, in float c1, in float c2, in float c3, in float c4, in float y, in float x0)
{
    // normalize equation 
    // c0 - y + c1x^1 + c2x^2 + c3x^3 + c4x^4 = 0
    c0 -= y;

    // solutions
    if (abs(c4) > MICRO_TOLERANCE)
    {
        return quartic_roots(c0, c1, c2, c3, c4, x0);
    }
    if (abs(c3) > MICRO_TOLERANCE)
    {
        return vec4(cubic_roots(vec4(c0, c1, c2, c3), x0), x0);
    }
    if (abs(c2) > MICRO_TOLERANCE)
    {
        return vec4(quadratic_roots(vec3(c0, c1, c2), x0), vec2(x0));
    }
    if (abs(c1) > MICRO_TOLERANCE)
    {
        return vec4(linear_root(vec2(c0, c1)), vec3(x0));
    }
    
    return vec4(x0);
}

#endif






