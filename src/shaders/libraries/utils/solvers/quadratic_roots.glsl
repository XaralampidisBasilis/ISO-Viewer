/* Sources
Numerical Recipes in C: The Art of Scientific Computing, 2nd Edition Section: Chapter 5.6 – Quadratic and Cubic Equations
(https://www.cec.uchile.cl/cinetica/pcordero/MC_libros/NumericalRecipesinC.pdf),
*/

#ifndef QUADRATIC_ROOTS
#define QUADRATIC_ROOTS

#ifndef SSIGN
#include "../math/ssign"
#endif

// Solves the quadratic equation: c[0] + c[1]*x^1 + c[2]*x^2 = 0
// We assume non zero quadratic coefficient
// x0 is the fallback root

vec2 quadratic_roots(in vec3 c, in float x0)
{
    // adjust quadratic coefficients 
    c.y /= -2.0;

    // compute quadratic discriminant
    float d = c.y * c.y - c.z * c.x;
    float sqrt_d = sqrt(abs(d));
    float q = c.y + sqrt_d * ssign(c.y);

    // compute quadratic roots via stable formula
    vec2 x = vec2(c.x / q, q / c.z);
    // x = (x.y > x.x) ? x : x.yx;

    // select roots based on determinant
    x = (d >= 0.0) ? x : vec2(x0);

    // quadratic solutions
    return x;
}

// vec2 quadratic_roots(in vec3 c, in float x0)
// {
//     // normalize coefficients 
//     c.xy /= c.z;
//     c.y /= -2.0;

//     // compute quadratic discriminant
//     float d = c.y * c.y - c.x;
//     float sqrt_d = sqrt(abs(d));

//     // compute quadratic roots via stable formula
//     vec2 x = c.y + sqrt_d * vec2(-1.0, 1.0);
//     // x = (x.y > x.x) ? x : x.yx;

//     // select roots based on determinant
//     x = (d >= 0.0) ? x : vec2(x0);

//     // quadratic solutions
//     return x;
// }

#endif






