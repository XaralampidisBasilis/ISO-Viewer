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
#ifndef PICK
#include "../math/pick"
#endif
#ifndef SSIGN
#include "../math/ssign"
#endif

// Solve resolvent cubic rc + rbU + raU^2 + U^3 
// for the max root U, where U = u^2
float resolvent_cubic_max_root(in float rc, in float rb, in float ra)
{
    // normalize coefficients
    vec4 c = vec3(rc, rb, ra, 1.0);
    vec3 nc = c.xyz;
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
    float U1 = 
        cbrt((-rc.x + sqrt_d) * 0.5) +
        cbrt((-rc.x - sqrt_d) * 0.5) -
        nc.z;

    // compute max cubic root from three real roots using complex number formula eq(0.14)  
    // revert transformation eq(0.2) and eq(0.16)
    float theta = atan(sqrt_d, -rc.x) / 3.0;
    float U3_max = cos(theta) * 2.0;
    U3_max = U3_max * sqrt(abs(-rc.y)) - nc.z; 

    // choose cubic roots based on discriminant sign 
    float U_max = (d >= 0.0) ? U3_max : U1;

    // Improve numerical stability of roots with Newton–Raphson correction
    float f, f1;
    poly_horner(c, U_max, f, f1);
    U_max -= f / f1; 
    poly_horner(c, U_max, f, f1);
    U_max -= f / f1; 

    return U_max;
}


// Solve the pair of factored quadratics in parallel
// t + sy + y^2, v + uy + y^2 where y = x + b
vec4 factored_quadratics_roots(in float t, in float s, in float v, in float u)
{
    // Solve in parallel the factored quadratics from the quartic 
    vec4 tsvu = vec4(t, s, v, u);
    tsvu.yw /= -2.0;
    
    // compute the fused quadratic discriminants
    // and solve roots via stable formulas
    vec2 d = tsvu.yw * tsvu.yw - tsvu.xz;
    vec2 q = tsvu.yw + sqrt(d) * ssign(tsvu.yw);
    vec4 y = vec4(q, tsvu.xz / q);

    return y;
}

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

    // Solve resolvent cubic rc + rbU + raU^2 + U^3 
    // for the max root U, where U = u^2
    float U_max = resolvent_cubic_max_root(rc, rb, ra);

    // Compute factored quadratics resulting from cubic solution
    // r + qy + py^2 + y^4 = (t + sy + y^2)(v + uy + y^2)
    float u = sqrt(U_max);
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve the pair of factored quadratics in parallel
    // t + sy + y^2, v + uy + y^2
    vec4 y = factored_quadratics_roots(t, s, v, u);

    // Return the transformation y = x + b
    // Flip solution if we solved for reciprocal
    // Replace degenerates with fallback root
    vec4 x = y + coeff.w;
    x = (flip) ? 1.0/x : x;
    x = pick(isnan(x), vec4(x0), x);

    // Return solutions
    return x;
}

#endif