/* Sources
Numerical Recipes in C: The Art of Scientific Computing, 2nd Edition Section: Chapter 5.6 – Quadratic and Cubic Equations
(https://www.cec.uchile.cl/cinetica/pcordero/MC_libros/NumericalRecipesinC.pdf),
*/

#ifndef QUADRATIC_SOLVER
#define QUADRATIC_SOLVER

#ifndef LINEAR_ROOT
#include "./linear_root"
#endif
#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

// Solves the general quadratic equation: c[0] + c[1]*x^1 + c[2]*x^2 = y
// x0 is the fallback root

// vec2 quadratic_solver(in vec3 c, in float y, in float x0)
// {
//     // normalize equation 
//     // c.x - y + c.y*t + c.z*t^2 = 0
//     c.x -= y;

//     // compute case flags
//     bool is_quad = abs(c.z) > MICRO_TOLERANCE;
//     bool is_line = abs(c.y) > MICRO_TOLERANCE;

//     // compute roots for each case
//     vec2  x2 = quadratic_roots(c, x0);
//     float x1 = linear_root(c.xy);

//     // branchless solution 
//     float r1 = (is_line) ? x1 : x0;
//     vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);

//     return r2;
// }

// branching
vec2 quadratic_solver(in vec3 c, in float y, in float x0)
{
    // normalize equation 
    // c.x - y + c.y*t + c.z*t^2 = 0
    c.x -= y;

    // solutions
    if (abs(c.z) > MICRO_TOLERANCE)
    {
        return quadratic_roots(c, x0);
    }
    if (abs(c.y) > MICRO_TOLERANCE)
    {
        return vec2(linear_root(c.xy), x0);
    }
    
    return vec2(x0);
}

#endif






