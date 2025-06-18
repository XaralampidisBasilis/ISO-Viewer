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
#ifndef EVAL_POLY
#include "../math/eval_poly"
#endif
#ifndef SSIGN
#include "../math/ssign"
#endif
#ifndef CBRT
#include "../math/cbrt"
#endif
#ifndef NAN
#define NAN uintBitsToFloat(0x7fc00000u)
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

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
    h.y /= 2.0;

    // compute cubic discriminant eq(0.7)
    float d = dot(vec2(h.x, -h.y), h.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_d = sqrt(abs(d));

    // compute depressed cubic eq(0.16), rc[0] + rc[1] * x + x^3 eq(0.11) eq(0.16)
    vec2 r = vec2(h.y - n.z * h.x, h.x);
    
    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    float U1 = pow(-r.x + sqrt_d, 1.0/3.0) + pow(-r.x - sqrt_d, 1.0/3.0);
       
    // compute max cubic root from three real roots using complex number formula eq(0.14)  
    // revert transformation eq(0.2) and eq(0.16)
    float U3_max = cos(atan(sqrt_d, -r.x) / 3.0);
    U3_max *= sqrt(max(-r.y, 0.0)); 

    // choose cubic roots based on discriminant sign 
    float U_max = (d >= 0.0 ? U3_max : U1) - n.z;

    // Improve numerical stability of max root with Newton–Raphson correction
    float f, dfdU;
    eval_poly(c, U_max, f, dfdU);
    U_max -= f / dfdU; 
    eval_poly(c, U_max, f, dfdU);
    U_max -= f / dfdU; 

    return U_max;
}

float resolvent_cubic_max_root_2(in float rc, in float rb, in float ra)
{
    // normalize coefficients
    vec3 n = vec3(rc, rb, ra);
    n.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 h = vec3(
        n.y - n.z * n.z,                          // δ1 = c.w * c.y - c.z^2
        n.x - n.y * n.z,                          // δ2 = c.w * c.x - c.y * c.z
        dot(vec2(n.z, -n.y), n.xy)    // δ3 = c.z * c.x - c.y * c.x
    );
    h.y /= 2.0;

    // compute cubic discriminant eq(0.7)
    float d = dot(vec2(h.x, -h.y), h.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_d = sqrt(abs(d));

    // compute depressed cubic eq(0.16), rc[0] + rc[1] * x + x^3 eq(0.11) eq(0.16)
    vec2 r = vec2(h.y - n.z * h.x, h.x);
    
    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    float U1 = cbrt(-r.x + sqrt_d) + cbrt(-r.x - sqrt_d);
       
    // compute max cubic root from three real roots using complex number formula eq(0.14)  
    // revert transformation eq(0.2) and eq(0.16)
    float U3_max = cos(atan(sqrt_d, -r.x) / 3.0);
    U3_max *= sqrt(max(-r.y, 0.0)); 

    // choose cubic roots based on discriminant sign 
    float U_max = (d >= 0.0 ? U3_max : U1) - n.z;

    // return root
    return U_max;
}

float resolvent_cubic_max_root_3(in float rc, in float rb, in float ra)
{
    // Compute upper bound since the largest positive root is bounded by the sum 
    // of the two largest negative-coefficients contributions in the set { ci }
    float c2 = max(-ra, 0.0);
    float c1 = sqrt(max(-rb, 0.0));
    float c0 = pow(-rc, 1.0/3.0);

    // Bracket
    float xa = 0.0;
    float xb = c2 + c1 + c0 - min(min(c2, c1), c0); // sum of two largest

    // Evaluate ends
    float ya = rc;
    float yb = ((ra + xb) * xb + rb) * xb + rc;

    // perform newton bisection iterations
    float x = (xa + xb) * 0.5;

    #pragma unroll
    for (int i = 0; i < 2; ++i)
    {
        // compute polynomial
        float a2 = ra + x;
        float a1 = rb + a2 * x; 
        float y = rc + a1 * x;     
           
        float b2 = a2 + x; 
        float dydx = a1 + b2 * x;        

        // Bracket update (you can also make this branchless if needed)
        if ((y < 0.0) != (yb < 0.0)) 
        {
            xa = x;
            ya = y;
        } 
        else 
        {
            xb = x;
            yb = y;
        }

        // newtons
        x -= y / dydx;

        // bisection fallback
        float m = 0.5 * (xa + xb);
        x = (xa < x && x < xb) ? x : m;
    }

    return x;
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

    // since we know the signs of s, u
    vec2 xq = vec2(
        tsvu.y + sqrt_d.x, 
        tsvu.w - sqrt_d.y
    );
    
    // compute rest of the roots via stable formula
    return vec4(xq, tsvu.xz / xq);
}

vec4 factored_quadratics_roots_2(in float t, in float s, in float v, in float u)
{
    // Solve in parallel the factored quadratics from the quartic 
    vec4 tsvu = vec4(t, s, v, u);
    tsvu.yw /= -2.0;
    
    // compute the fused quadratic discriminants
    // and solve roots via stable formulas
    vec2 d = tsvu.yw * tsvu.yw - tsvu.xz;
    vec2 sqrt_d = sqrt(max(d, 0.0));
    
    // since we know the signs of s, u
    vec2 xq = vec2(
        tsvu.y + sqrt_d.x, 
        tsvu.w - sqrt_d.y
    );

    // compute rest of the roots via stable formula
    return vec4(xq, tsvu.xz / xq);
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
    float p = n.z - w2 * 6.0;
    float q = n.y - n.w * (n.z - w2 * 4.0) * 2.0;
    float r = n.x - n.w * (n.y - n.w * (n.z - w2 * 3.0));

    // Solve for a root to (u^2)^3 + 2p(u^2)^2 + (p^2 - 4r)(u^2) - q^2 which resolves the
    // system of equations relating the product of two quadratics to the depressed quartic
    float ra =  p * 2.0;
    float rb =  p * p - r * 4.0;
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

    // Return the transformation y = x + b
    // Flip solution if we solved for reciprocal
    vec4 x = y - n.w;
    x = flip ? 1.0 / x : x;

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
    float p = n.z - w2 * 6.0;
    float q = n.y - n.w * (n.z - w2 * 4.0) * 2.0;
    float r = n.x - n.w * (n.y - n.w * (n.z - w2 * 3.0));

    // Solve for a root to (u^2)^3 + 2p(u^2)^2 + (p^2 - 4r)(u^2) - q^2 which resolves the
    // system of equations relating the product of two quadratics to the depressed quartic
    float ra =  p * 2.0;
    float rb =  p * p - r * 4.0;
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
    float s = -u;

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

vec4 quartic_roots_3(in float c[5]) 
{
    // To simplify depressed quartic computations
    // e + dx^1 + cx^2 + 4bx^3 + x^4
    vec4 n = vec4(c[0], c[1], c[2], c[3]) / c[4];
    n.w /= 4.0;

    // Depress the quartic e + dx^1 + cx^2 + 4bx^3 + x^4
    // to r + qy + py^2 + y^4 by substituting x = y - b
    float w2 = n.w * n.w;
    float p = n.z - w2 * 6.0;
    float q = n.y - n.w * (n.z - w2 * 4.0) * 2.0;
    float r = n.x - n.w * (n.y - n.w * (n.z - w2 * 3.0));

    // Solve for a root to (u^2)^3 + 2p(u^2)^2 + (p^2 - 4r)(u^2) - q^2 which resolves the
    // system of equations relating the product of two quadratics to the depressed quartic
    float ra =  p * 2.0;
    float rb =  p * p - r * 4.0;
    float rc = -q * q;

    // Solve resolvent cubic rc + rbU + raU^2 + U^3 
    // for the max root U, where U = u^2
    float U_max = resolvent_cubic_max_root_2(rc, rb, ra);
    float u = sqrt(max(0.0, U_max));
    
    // Compute factored quadratics resulting from cubic solution
    // r + qy + py^2 + y^4 = (t + sy + y^2)(v + uy + y^2)
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve the pair of factored quadratics in parallel
    // t + sy + y^2, v + uy + y^2
    vec4 y = factored_quadratics_roots_2(t, s, v, u);

    // Return the transformation y = x + b
    vec4 x = y - n.w;

    // Improve numerical stability of roots with Newton–Raphson corrections
    vec4 f, dfdx; 
    eval_poly(c, x, f, dfdx);
    x -= f / dfdx; 
    eval_poly(c, x, f, dfdx);
    x -= f / dfdx; 

    // Return solutions
    return x;
}

vec4 quartic_roots_4(in float c[5]) 
{
    // To simplify depressed quartic computations
    // e + dx^1 + cx^2 + 4bx^3 + x^4
    vec4 n = vec4(c[0], c[1], c[2], c[3]) / c[4];
    n.w /= 4.0;

    // Depress the quartic e + dx^1 + cx^2 + 4bx^3 + x^4
    // to r + qy + py^2 + y^4 by substituting x = y - b
    float w2 = n.w * n.w;
    float p = n.z - w2 * 6.0;
    float q = n.y - n.w * (n.z - w2 * 4.0) * 2.0;
    float r = n.x - n.w * (n.y - n.w * (n.z - w2 * 3.0));

    // Solve for a root to (u^2)^3 + 2p(u^2)^2 + (p^2 - 4r)(u^2) - q^2 which resolves the
    // system of equations relating the product of two quadratics to the depressed quartic
    float ra =  p * 2.0;
    float rb =  p * p - r * 4.0;
    float rc = -q * q;

    // Solve resolvent cubic rc + rbU + raU^2 + U^3 
    // for the max root U, where U = u^2
    float U_max = resolvent_cubic_max_root_2(rc, rb, ra);
    float u = sqrt(max(0.0, U_max));
    
    // Compute factored quadratics resulting from cubic solution
    // r + qy + py^2 + y^4 = (t + sy + y^2)(v + uy + y^2)
    float qu = q / u;
    float t = (p + qu + u * u) * 0.5;
    float v = t - qu;
    float s = - u;

    // Solve the pair of factored quadratics in parallel
    // t + sy + y^2, v + uy + y^2
    vec4 y = factored_quadratics_roots_2(t, s, v, u);

    // Return the transformation y = x + b
    vec4 x = y - n.w;

    // Return solutions
    return x;
}


#endif