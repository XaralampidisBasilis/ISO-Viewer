

#ifndef CUBIC_SOLVER
#define CUBIC_SOLVER

#ifndef LINEAR_ROOT
#include "./linear_root"
#endif
#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef CUBIC_ROOTS
#include "./cubic_roots"
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

// Solves the general cubic equation: c[0] + c[1]*x^1 + c[2]*x^2 + c[3]*x^3 = y
// x0 is the fallback root

// vec3 cubic_solver(in vec4 c, in float y, in float x0)
// {
//     // normalize equation 
//     // c.x - y + c.y*t + c.z*t^2 + c.w*t^3 = 0
//     c.x -= y;

//     // compute case flags
//     bool is_cube = abs(c.w) > MICRO_TOLERANCE;
//     bool is_quad = abs(c.z) > MICRO_TOLERANCE;
//     bool is_line = abs(c.y) > MICRO_TOLERANCE;

//     // compute case roots
//     vec3  x3 = cubic_roots(c, x0);
//     vec2  x2 = quadratic_roots(c.xyz, x0);
//     float x1 = linear_root(c.xy);

//     // branchless solution 
//     float r1 = (is_line) ? x1 : x0;
//     vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);
//     vec3  r3 = (is_cube) ? x3 : vec3(r2, x0);

//     return r3;
// }

// branching
vec3 cubic_solver(in vec4 c, in float y, in float x0)
{
    // normalize equation 
    // c.x - y + c.y*t + c.z*t^2 + c.w*t^3 = 0
    c.x -= y;

    // solutions
    if (abs(c.w) > MICRO_TOLERANCE)
    {
        return cubic_roots(c, x0);
    }
    if (abs(c.z) > MICRO_TOLERANCE)
    {
        return vec3(quadratic_roots(c.xyz, x0), x0);
    }
    if (abs(c.y) > MICRO_TOLERANCE)
    {
        return vec3(linear_root(c.xy), vec2(x0));
    }
    
    return vec3(x0);
}

#endif






