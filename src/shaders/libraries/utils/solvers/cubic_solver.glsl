
/* Sources
Based on Blinn's paper (https://courses.cs.washington.edu/courses/cse590b/13au/lecture_notes/solvecubic_p5.pdf),
Article by Christoph Peters (https://momentsingraphics.de/CubicRoots.html#_Blinn07b),
Shadertoy Cubic Equation Solver II (https://www.shadertoy.com/view/7tBGzK),
Shadertoy Quartic Reflections https://www.shadertoy.com/view/flBfzm,
*/

// Solves a cubic equation given the coefficients: coefficient[0] * x^0 + coefficient[1] * x^1 + coefficient[2] * x^2 + coefficient[3] * x^3

#ifndef CUBIC_SOLVER
#define CUBIC_SOLVER

#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif
#ifndef SQRT_3
#define SQRT_3 1.73205080757
#endif
#ifndef CBRT
#include "../math/cbrt"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

vec3 cubic_solver(in vec4 coeffs, in float target)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - value) = 0
    coeffs.x -= target;

    /* DEFAULT */ 

    vec3 default_roots = vec3(- 1.0);

    /* LINEAR */ 

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    vec3 linear_roots = vec3(- linear_coeff);

    /* QUADRATIC */ 

    // compute normalized quadratic coefficients 
    vec3 quadratic_coeffs = coeffs.xyz;
    quadratic_coeffs.y /= -2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.z * quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));
    float quadratic_stable_root = quadratic_coeffs.y + sqrt_quadratic_discriminant * ssign(quadratic_coeffs.y);

    // compute quadratic roots 
    vec3 quadratic_roots = vec3(quadratic_stable_root / coeffs.zz, coeffs.x / quadratic_stable_root);
    quadratic_roots = (quadratic_discriminant >= 0.0) ? quadratic_roots : default_roots;

    /* CUBIC */ 

    // normalize coefficients
    vec3 cubic_coeffs = coeffs.xyz / coeffs.w;
    cubic_coeffs.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 hessian_coeffs = vec3(
        cubic_coeffs.y - cubic_coeffs.z * cubic_coeffs.z,                          // δ1 = coeffs.w * coeffs.y - coeffs.z^2
        cubic_coeffs.x - cubic_coeffs.y * cubic_coeffs.z,                          // δ2 = coeffs.w * coeffs.x - coeffs.y * coeffs.z
        dot(vec2(cubic_coeffs.z, -cubic_coeffs.y), cubic_coeffs.xy)    // δ3 = coeffs.z * coeffs.x - coeffs.y * coeffs.x
    );

    // compute cubic discriminant eq(0.7)
    float cubic_discriminant = dot(vec2(4.0 * hessian_coeffs.x, -hessian_coeffs.y), hessian_coeffs.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_cubic_discriminant = sqrt(abs(cubic_discriminant));

    // compute depressed cubic eq(0.16), coefficients depressed[0] + depressed[1] * x + x^3
    vec2 depressed_cubic_coeffs = vec2(hessian_coeffs.y - 2.0 * cubic_coeffs.z * hessian_coeffs.x, hessian_coeffs.x);
    
    // compute cubic roots using complex number formula eq(0.14)  
    float theta = atan(sqrt_cubic_discriminant, -depressed_cubic_coeffs.x) / 3.0;
    vec2 cubic_root = vec2(cos(theta), sin(theta));

    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    vec3 cubic_roots12 = vec3(
          cbrt((-depressed_cubic_coeffs.x + sqrt_cubic_discriminant) * 0.5) 
        + cbrt((-depressed_cubic_coeffs.x - sqrt_cubic_discriminant) * 0.5)
        - cubic_coeffs.z
    );
   
    // compute three roots via rotation, applying complex root formula eq(0.14)
    vec3 cubic_roots3 = vec3(
        cubic_root.x,                                 // First root
        dot(vec2(-0.5, -0.5 * SQRT_3), cubic_root),   // Second root (rotated by 120 degrees)
        dot(vec2(-0.5,  0.5 * SQRT_3), cubic_root)    // Third root (rotated by -120 degrees)
    );

    // revert transformation and sort the three real roots eq(0.2) and eq(0.16)
    cubic_roots3 = - cubic_coeffs.z + 2.0 * cubic_roots3 * sqrt(max(0.0, -depressed_cubic_coeffs.y)); 

    // choose cubic roots based on discriminant sign 
    vec3 cubic_roots = (cubic_discriminant < 0.0) ? cubic_roots12 : cubic_roots3;

    // Improve numerical stability with Newton–Raphson correction
    vec3 f; vec3 f1;

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1; 

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1;  

    /* SOLUTIONS */ 

    bool is_cubic = abs(coeffs.w) > MICRO_TOLERANCE;
    bool is_quadratic = abs(coeffs.z) > MICRO_TOLERANCE;
    bool is_linear = abs(coeffs.y) > MICRO_TOLERANCE;
  
    return  (is_cubic) ? cubic_roots : (is_quadratic) ? quadratic_roots : (is_linear) ? linear_roots : default_roots;
}

vec3 cubic_solver(in vec4 coeffs, in float target, in float flag)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - value) = 0
    coeffs.x -= target;

    /* DEFAULT */ 

    vec3 default_roots = vec3(- flag);

    /* LINEAR */ 

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    vec3 linear_roots = vec3(- linear_coeff);

    /* QUADRATIC */ 

    // compute normalized quadratic coefficients 
    vec3 quadratic_coeffs = coeffs.xyz;
    quadratic_coeffs.y /= -2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.z * quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));
    float quadratic_stable_root = quadratic_coeffs.y + sqrt_quadratic_discriminant * ssign(quadratic_coeffs.y);

    // compute quadratic roots 
    vec3 quadratic_roots = vec3(quadratic_stable_root / coeffs.zz, coeffs.x / quadratic_stable_root);
    quadratic_roots = (quadratic_discriminant >= 0.0) ? quadratic_roots : default_roots;

    /* CUBIC */ 

    // normalize coefficients
    vec3 cubic_coeffs = coeffs.xyz / coeffs.w;
    cubic_coeffs.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 hessian_coeffs = vec3(
        cubic_coeffs.y - cubic_coeffs.z * cubic_coeffs.z,                          // δ1 = coeffs.w * coeffs.y - coeffs.z^2
        cubic_coeffs.x - cubic_coeffs.y * cubic_coeffs.z,                          // δ2 = coeffs.w * coeffs.x - coeffs.y * coeffs.z
        dot(vec2(cubic_coeffs.z, -cubic_coeffs.y), cubic_coeffs.xy)    // δ3 = coeffs.z * coeffs.x - coeffs.y * coeffs.x
    );

    // compute cubic discriminant eq(0.7)
    float cubic_discriminant = dot(vec2(4.0 * hessian_coeffs.x, -hessian_coeffs.y), hessian_coeffs.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_cubic_discriminant = sqrt(abs(cubic_discriminant));

    // compute depressed cubic eq(0.16), coefficients depressed[0] + depressed[1] * x + x^3
    vec2 depressed_cubic_coeffs = vec2(hessian_coeffs.y - 2.0 * cubic_coeffs.z * hessian_coeffs.x, hessian_coeffs.x);
    
    // compute cubic roots using complex number formula eq(0.14)  
    float theta = atan(sqrt_cubic_discriminant, -depressed_cubic_coeffs.x) / 3.0;
    vec2 cubic_root = vec2(cos(theta), sin(theta));

    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    vec3 cubic_roots12 = vec3(
          cbrt((-depressed_cubic_coeffs.x + sqrt_cubic_discriminant) * 0.5) 
        + cbrt((-depressed_cubic_coeffs.x - sqrt_cubic_discriminant) * 0.5)
        - cubic_coeffs.z
    );
   
    // compute three roots via rotation, applying complex root formula eq(0.14)
    vec3 cubic_roots3 = vec3(
        cubic_root.x,                                 // First root
        dot(vec2(-0.5, -0.5 * SQRT_3), cubic_root),   // Second root (rotated by 120 degrees)
        dot(vec2(-0.5,  0.5 * SQRT_3), cubic_root)    // Third root (rotated by -120 degrees)
    );

    // revert transformation and sort the three real roots eq(0.2) and eq(0.16)
    cubic_roots3 = - cubic_coeffs.z + 2.0 * cubic_roots3 * sqrt(max(0.0, -depressed_cubic_coeffs.y)); 

    // choose cubic roots based on discriminant sign 
    vec3 cubic_roots = (cubic_discriminant < 0.0) ? cubic_roots12 : cubic_roots3;

    // Improve numerical stability with Newton–Raphson correction
    vec3 f; vec3 f1;

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1; 

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1;  

    /* SOLUTIONS */ 

    bool is_cubic = abs(coeffs.w) > MICRO_TOLERANCE;
    bool is_quadratic = abs(coeffs.z) > MICRO_TOLERANCE;
    bool is_linear = abs(coeffs.y) > MICRO_TOLERANCE;
  
    return  (is_cubic) ? cubic_roots : (is_quadratic) ? quadratic_roots : (is_linear) ? linear_roots : default_roots;
}

vec3 strict_cubic_solver(in vec4 coeffs, in float target)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - value) = 0
    coeffs.x -= target;

    // normalize coefficients
    vec3 cubic_coeffs = coeffs.xyz / coeffs.w;
    cubic_coeffs.yz /= 3.0;

    // compute hessian coefficients eq(0.4)
    vec3 hessian_coeffs = vec3(
        cubic_coeffs.y - cubic_coeffs.z * cubic_coeffs.z,                          // δ1 = coeffs.w * coeffs.y - coeffs.z^2
        cubic_coeffs.x - cubic_coeffs.y * cubic_coeffs.z,                          // δ2 = coeffs.w * coeffs.x - coeffs.y * coeffs.z
        dot(vec2(cubic_coeffs.z, -cubic_coeffs.y), cubic_coeffs.xy)    // δ3 = coeffs.z * coeffs.x - coeffs.y * coeffs.x
    );

    // compute cubic discriminant eq(0.7)
    float cubic_discriminant = dot(vec2(4.0 * hessian_coeffs.x, -hessian_coeffs.y), hessian_coeffs.zy); // Δ = δ1 * δ3 - δ2^2
    float sqrt_cubic_discriminant = sqrt(abs(cubic_discriminant));

    // compute depressed cubic eq(0.16), coefficients depressed[0] + depressed[1] * x + x^3
    vec2 depressed_cubic_coeffs = vec2(hessian_coeffs.y - 2.0 * cubic_coeffs.z * hessian_coeffs.x, hessian_coeffs.x);
    
    // compute cubic roots using complex number formula eq(0.14)  
    float theta = atan(sqrt_cubic_discriminant, -depressed_cubic_coeffs.x) / 3.0;
    vec2 cubic_root = vec2(cos(theta), sin(theta));

    // compute real root using cubic root formula for one real and two complex roots eq(0.15)
    vec3 cubic_roots12 = vec3(
          cbrt((-depressed_cubic_coeffs.x + sqrt_cubic_discriminant) * 0.5) 
        + cbrt((-depressed_cubic_coeffs.x - sqrt_cubic_discriminant) * 0.5)
        - cubic_coeffs.z
    );
   
    // compute three roots via rotation, applying complex root formula eq(0.14)
    vec3 cubic_roots3 = vec3(
        cubic_root.x,                                 // First root
        dot(vec2(-0.5, -0.5 * SQRT_3), cubic_root),   // Second root (rotated by 120 degrees)
        dot(vec2(-0.5,  0.5 * SQRT_3), cubic_root)    // Third root (rotated by -120 degrees)
    );

    // revert transformation and sort the three real roots eq(0.2) and eq(0.16)
    cubic_roots3 = - cubic_coeffs.z + 2.0 * cubic_roots3 * sqrt(max(0.0, -depressed_cubic_coeffs.y)); 

    // choose cubic roots based on discriminant sign 
    vec3 cubic_roots = (cubic_discriminant < 0.0) ? cubic_roots12 : cubic_roots3;

    // Improve numerical stability with Newton–Raphson correction
    vec3 f; vec3 f1;

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1; 

    poly_horner(coeffs, cubic_roots, f, f1);
    cubic_roots -= f / f1; 

    // cubic solutions
    return cubic_roots;
}

#endif






