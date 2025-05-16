
#ifndef LINEAR_SOLVER
#define LINEAR_SOLVER

#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif
#ifndef LINEAR_ROOT
#include "./linear_root"
#endif

// Solves the general linear equation: c[0] + c[1]*x = y
// xf is the fallback root

float linear_solver(in vec2 c, in float y, in float xf)
{
    // normalize equation c.x - y + c.y*t = 0
    c.x -= y;

    // compute linear root
    float x = linear_root(c);

    // check if linear equation
    bool is_line = abs(c.y) > MICRO_TOLERANCE;
   
    // solution
    return (is_line) ? x : xf;
}

// // branching
// float linear_solver(in vec2 c, in float y, in float xf)
// {
//     // normalize equation c.x - y + c.y*t = 0
//     c.x -= y;

//     // solutions
//     if (abs(c.y) > MICRO_TOLERANCE)
//     {
//         return linear_root(c);
//     }

//     return xf;
// }

#endif






