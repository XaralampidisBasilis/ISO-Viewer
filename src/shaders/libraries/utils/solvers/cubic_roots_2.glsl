
/* Soures
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

// Solves the cubic equation: c0 + c1*x^1 + c2*x^2 + c3x^3 = 0
// We assume non zero cubic coefficient
// x0 is the fallback root

float cubic_roots(in vec4 coef, in float x0)
{
    // compute cubic derivative coefficients
    vec3 c = coef.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 x0_x1, y0_y1, d0_d1;
    x0_x1 = quadratic_roots_2(c, 0.0);
    poly_horner(c, x0_x1, y0_y1, d0_d1);

    // perform newtons bisection method to find root between critical points
    float m, x, y, d;

    #pragma unroll
    for (int i = 0; i < 3; ++i)
    {
        // newtons
        x = x0_x1.x - y0_y1.x / d0_d1.y;

        // bisection
        m = (x0_x1.x + x0_x1.y) * 0.5;

        // chose newton if inside, bisection otherwise and compute polynomial
        x = (x0_x1.x < x && x < x0_x1.y) ? x : m;
        poly_horner(coef, x, y, d);

        // detect sign change
        bool b = (y0_y1.x < 0) != (y < 0);

        // update bracket based on sign change
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
        d0_d1 = b ? vec2(d0_d1.x, d) : vec2(d, d0_d1.y);
    }

    
    return x;
}


#endif





