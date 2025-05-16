/* Sources
Shadertoy Quartic Reflections
(https://www.shadertoy.com/view/flBfzm)
The Art of Problem Solving Quartic Equation
(https://artofproblemsolving.com/wiki/index.php/Quartic_Equation?srsltid=AfmBOopSANTJHc7S64HX0aGEq-1givy_pDVC5sSkCsuzxnhjmFQ123q-)
*/

#ifndef QUARTIC_ROOTS
#define QUARTIC_ROOTS

#ifndef CUBIC_ROOTS
#include "./cubic_roots"
#endif
#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef PICK
#include "../math/pick"
#endif
#ifndef SSIGN
#include "../math/ssign"
#endif
#ifndef NAN
#define NAN uintBitsToFloat(0x7fc00000u)
#endif

// Solve quartic equation c0 + c1x^1 + c2x^2 + c3x^3 + c4x^4 = 0 
// using Ferrari's method assuming quartic coefficient is nonzero
vec4 quartic_roots(in float c0, in float c1, in float c2, in float c3, in float c4, in float x0) 
{
    // Solve for the smallest cubic term, this produces the least wild behavior.
    bool flip = abs(c3 * c0) >= abs(c1 * c4);
    vec4 coeff = (flip) ? 
        vec4(c4, c3, c2, c1) / c0 : // Solve for reciprocal
        vec4(c0, c1, c2, c3) / c4;

    // To simplify depressed quartic computations
    // e + dx^1 + cx^2 + 4bx^3 + x^4
    coeff.w /= 4.0;
    float w2 = coeff.w * coeff.w;

    // Depress the quartic e + dx^1 + cx^2 + 4bx^3 + x^4
    // to r + qy + py^2 + y^4 by substituting x = y - b
    float p = coeff.z - w2 * 6.0;
    float q = coeff.y - coeff.z * coeff.w * 2.0 + coeff.w * w2 * 8.0;
    float r = coeff.x - coeff.y * coeff.w + coeff.z * w2 - w2 * w2 * 3.0;

    // Solve for a root to (u^2)^3 + 2p(u^2)^2 + (p^2 - 4r)(u^2) - q^2 which resolves the
    // system of equations relating the product of two quadratics to the depressed quartic
    float ra =  2.0 * p;
    float rb =  p * p - 4.0 * r;
    float rc = -q * q;

    // Solve reduced cubic rc + rbU + raU^2 + U^3 where U = u^2
    vec4 cubic = vec4(ra, rb, rc, 1.0);
    vec3 U = cubic_roots(cubic, -1.0);

    // Take maximum root and check if positive
    float U_max = max(U.x, max(U.y, U.z));
    bool is_quat = U_max >= 0.0;

    // Compute factored quadratics coefficients
    // r + qy + py^2 + y^4 = (t + sy + y^2)(v + uy + y^2)
    float u = sqrt(max(U_max, 0.0));
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve in parallel the quadratics factored from the quartic 
    vec4 tsvu = vec4(t, s, v, u);
    tsvu.yw /= -2.0;
    
    // compute the fused quadratic discriminants
    vec2 d = tsvu.yw * tsvu.yw - tsvu.xz;
    vec2 sqrt_d = sqrt(d);
    vec2 q = tsvu.yw + sqrt_d * ssign(tsvu.yw);

    // compute the fused quadratic roots via stable formulas
    vec4 y = vec4(q, tsvu.xz / q);
    bvec2 d_pos = greaterThanEqual(d, 0.0);
    y = pick(d_pos.xyxy, y, vec4(NAN));

    // Return the transformation y = x + b
    // and flip solution if we solved for reciprocal
    vec4 x = y + coeff.w;
    x = (flip) ? 1.0/x : x;

    // Replace nan with fallback root
    x = pick(isnan(x), vec4(x0), x);

    // Return solutions
    return (is_quat) ? x : vec4(x0);
}

#endif