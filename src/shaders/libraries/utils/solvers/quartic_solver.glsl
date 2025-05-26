

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

// Solve general quartic equation c[0] + c1x^1 + c2x^2 + c3x^3 + c4x^4 = y
// x0 is the fallback root

// vec3 quartic_solver(in float c[5], in float y, in float x0)
// {
//     // normalize equation 
//     // c0 + c1x + c2x^2 + c3x^3 + c4x^4 = y
//     c[0] -= y;

//     // compute case flags
//     bool is_quar = abs(c[4]) > MICRO_TOLERANCE;
//     bool is_cube = abs(c[3]) > MICRO_TOLERANCE;
//     bool is_quad = abs(c[2]) > MICRO_TOLERANCE;
//     bool is_line = abs(c[1]) > MICRO_TOLERANCE;

//     // compute case roots
//     vec3  x4 = quartic_roots(c, x0);
//     vec3  x3 = cubic_roots(vec4(c[0], c[1], c[2], c[3]), x0);
//     vec2  x2 = quadratic_roots(vec3(c[0], c[1], c[2]), x0);
//     float x1 = linear_root(vec2(c[0], c[1]));

//     // branchless solution 
//     float r1 = (is_line) ? x1 : x0;
//     vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);
//     vec3  r3 = (is_cube) ? x3 : vec3(r2, x0);
//     vec4  r4 = (is_quar) ? x4 : vec4(r3, x0);

//     return r4;
// }

// branching
vec4 quartic_solver(in float c[5], in float y, in float x0)
{
    // normalize equation 
    // c0 + c1x + c2x^2 + c3x^3 + c4x^4 = y
    c[0] -= y;

    // solutions
    if (abs(c[4]) > MICRO_TOLERANCE)
    {
        return quartic_roots(c, x0);
    }
    if (abs(c[3]) > MICRO_TOLERANCE)
    {
        return vec4(cubic_roots(vec4(c[0], c[1], c[2], c[3]), x0), x0);
    }
    if (abs(c[2]) > MICRO_TOLERANCE)
    {
        return vec4(quadratic_roots(vec3(c[0], c[1], c[2]), x0), vec2(x0));
    }
    if (abs(c[1]) > MICRO_TOLERANCE)
    {
        return vec4(linear_root(vec2(c[0], c[1])), vec3(x0));
    }
    
    return vec4(x0);
}

#endif






