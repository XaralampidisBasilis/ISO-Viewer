/* Sources
Shadertoy Quartic Reflections
(https://www.shadertoy.com/view/flBfzm)
The Art of Problem Solving Quartic Equation
(https://artofproblemsolving.com/wiki/index.php/Quartic_Equation?srsltid=AfmBOopSANTJHc7S64HX0aGEq-1givy_pDVC5sSkCsuzxnhjmFQ123q-),
Wikipedia quartic equation
(https://www.wikiwand.com/en/articles/Quartic_equation)
*/

#ifndef QUARTIC_ROOTS
#define QUARTIC_ROOTS

#ifndef PICK
#include "../math/pick"
#endif
#ifndef SSIGN
#include "../math/ssign"
#endif
#ifndef NAN
#define NAN uintBitsToFloat(0x7fc00000u)
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

// Solve the depressed quartic when q = 0 resulting in a biquadratic
// r + qy + py^2 + y^4 = r + pz + z^2 where z = y^2

vec4 degenerate_biquadratic_roots(in float r, in float p)
{
    // biquadratic coefficients
    vec2 c = vec2(r, p);
    c.y /= -2.0;
    
    // compute the biquadratic discriminant
    // and solve roots via stable formulas
    float d = c.y * c.y - c.x;
    float q = c.y + sqrt(d) * ssign(c.y); // can produce Nan
    vec2 z = vec2(q, c / q);

    // compute the y roots
    vec2 sqrt_z = sqrt(z); // can produce Nan
    vec4 y = vec4(-sqrt_z, sqrt_z);

    return y;
}

// Solve resolvent cubic rc + rbU + raU^2 + U^3 
// for the max root U, where U = u^2

float resolvent_cubic_max_root(in float rc, in float rb, in float ra)
{
    // normalize coefficients
    vec4 c = vec4(rc, rb, ra, 1.0);
    vec3 n = c.xyz;
    n.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 h = vec3(
        n.y - n.z * n.z,                          // δ1 = c.w * c.y - c.z^2
        n.x - n.y * n.z,                          // δ2 = c.w * c.x - c.y * c.z
        dot(vec2(n.z, -n.y), n.xy)    // δ3 = c.z * c.x - c.y * c.x
    );

    // compute cubic discriminant eq(0.7)
    float d = dot(vec2(h.x * 4.0, -h.y), h.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_d = sqrt(abs(d));

    // compute depressed cubic eq(0.16), rc[0] + rc[1] * x + x^3 eq(0.11) eq(0.16)
    vec2 r = vec2(h.y - n.z * h.x * 2.0, h.x);
    
    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    float U1 = 
        cbrt((-r.x + sqrt_d) * 0.5) +
        cbrt((-r.x - sqrt_d) * 0.5) -
        n.z;

    // compute max cubic root from three real roots using complex number formula eq(0.14)  
    // revert transformation eq(0.2) and eq(0.16)
    float theta = atan(sqrt_d, -r.x) / 3.0;
    float U3_max = cos(theta) * 2.0;
    U3_max = U3_max * sqrt(abs(-r.y)) - n.z; 

    // choose cubic roots based on discriminant sign 
    float U_max = (d >= 0.0) ? U3_max : U1;

    // Improve numerical stability of max root with Newton–Raphson correction
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
    vec2 sqrt_d = sqrt(d); // can produce Nan
    vec2 q = tsvu.yw + sqrt_d * ssign(tsvu.yw); 
    vec4 y = vec4(q, tsvu.xz / q);

    return y;
}

// Solve quartic equation c0 + c1x^1 + c2x^2 + c3x^3 + c4x^4 = 0 
// using Ferrari-Descartes method assuming quartic coefficient is nonzero

vec4 quartic_roots(in float c[5], in float x0) 
{
    // Solve for the smallest cubic term, this produces the least wild behavior.
    bool flip = abs(c[3] * c[0]) > abs(c[1] * c[4]);
    vec4 n = (flip) ? 
        vec4(c[4], c[3], c[2], c[1]) / c[0] :
        vec4(c[0], c[1], c[2], c[3]) / c[4];

    // To simplify depressed quartic computations
    // e + dx^1 + cx^2 + 4bx^3 + x^4
    n.w /= 4.0;

    // Depress the quartic e + dx^1 + cx^2 + 4bx^3 + x^4
    // to r + qy + py^2 + y^4 by substituting x = y - b
    float w2 = n.w * n.w;
    float w3 = n.w * w2;
    float w4 = n.w * w3;

    float p = n.z - w2 * 6.0;
    float q = n.y - n.z * n.w * 2.0 + w3 * 8.0;
    float r = n.x - n.y * n.w + w2 * n.z - w4 * 3.0;

    // Solve for the degenerate case of biquadratic
    bool is_biq = abs(q) < MICRO_TOLERANCE;
    vec4 y4 = degenerate_biquadratic_roots(r, p);

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
    float u = sqrt(U_max); // can produce Nan
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve the pair of factored quadratics in parallel
    // t + sy + y^2, v + uy + y^2
    vec4 y22 = factored_quadratics_roots(t, s, v, u);

    // Select correct case
    // Return the transformation y = x + b
    // Flip solution if we solved for reciprocal
    vec4 y = (is_biq) ? y4 : y22;
    vec4 x = y - n.w;
    x = (flip) ? 1.0 / x : x;

    // Replace degenerates with fallback root
    // 1) when the quartic coefficient is 0 we have 4 nan solutions
    // 2) when U_max is negative then we have 4 nan solutions
    // 3) when a quadratic is unsolvable produces 2 nan solutions
    x = pick(isnan(x), vec4(x0), x);

    // Return solutions
    return x;
}

vec4 quartic_roots_2(in float c[5], in float x0) 
{
    // To simplify depressed quartic computations
    // e + dx^1 + cx^2 + 4bx^3 + x^4
    vec4 n = vec4(c[0], c[1], c[2], c[3]) / c[4];
    n.w /= 4.0;

    // Depress the quartic e + dx^1 + cx^2 + 4bx^3 + x^4
    // to r + qy + py^2 + y^4 by substituting x = y - b
    float w2 = n.w * n.w;
    float w3 = n.w * w2;
    float w4 = n.w * w3;

    float p = n.z - w2 * 6.0;
    float q = n.y - n.z * n.w * 2.0 + w3 * 8.0;
    float r = n.x - n.y * n.w + w2 * n.z - w4 * 3.0;

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
    float u = sqrt(U_max); // can produce Nan
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve the pair of factored quadratics in parallel
    // t + sy + y^2, v + uy + y^2
    vec4 y = factored_quadratics_roots(t, s, v, u);

    // Select correct case
    // Return the transformation y = x + b
    // Flip solution if we solved for reciprocal
    vec4 x = y - n.w;

    // Replace degenerates with fallback root
    // 1) when the quartic coefficient is 0 we have 4 nan solutions
    // 2) when U_max is negative then we have 4 nan solutions
    // 3) when a quadratic is unsolvable produces 2 nan solutions
    x = pick(isnan(x), vec4(x0), x);

    // Return solutions
    return x;
}



#endif