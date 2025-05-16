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
// xf is the fallback root

vec2 quadratic_roots(in vec3 c, in float xf)
{
    // adjust quadratic coefficients 
    c.y /= -2.0;

    // compute quadratic discriminant
    float d = c.y * c.y - c.z * c.x;
    float sqrt_d = sqrt(abs(d));
    float q = c.y + sqrt_d * ssign(c.y);

    // compute quadratic roots via stable formula
    vec2 x = vec2(q / c.z, c.x / q);
    x = (d >= 0.0) ? x : vec2(xf);

    // quadratic solutions
    return x;
}

#endif






