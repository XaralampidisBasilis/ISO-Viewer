
#ifndef QUADRATIC_SOLVER
#define QUADRATIC_SOLVER

#ifndef MILLI_TOLERANCE
#define MILLI_TOLERANCE 1e-3
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

vec2 quadratic_solver(in vec3 coeffs, in float target)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - value) = 0
    coeffs.x -= target;

    /* DEFAULT */ 

    vec2 default_roots = vec2(-1.0);

    /* LINEAR */ 

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    vec2 linear_roots = vec2(- linear_coeff);

    /* QUADRATIC */ 

    // compute normalized quadratic coefficients 
    vec2 quadratic_coeffs = coeffs.xy / coeffs.z;
    quadratic_coeffs.y /= 2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));

    // compute quadratic roots 
    vec2 quadratic_roots = - quadratic_coeffs.y + sqrt_quadratic_discriminant * vec2(-1.0, 1.0);
    quadratic_roots = (quadratic_discriminant >= 0.0) ? quadratic_roots : default_roots;

    /* SOLUTIONS */ 

    bool is_quadratic = abs(coeffs.z) > MICRO_TOLERANCE;
    bool is_linear = abs(coeffs.y) > MICRO_TOLERANCE;

    return (is_quadratic) ? quadratic_roots : (is_linear) ? linear_roots : default_roots;
}

vec2 quadratic_solver(in vec3 coeffs, in float target, in float flag)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    /* DEFAULT */ 

    vec2 default_roots = vec2(flag);

    /* LINEAR */ 

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    vec2 linear_roots = vec2(- linear_coeff);

    /* QUADRATIC */ 

    // compute normalized quadratic coefficients 
    vec2 quadratic_coeffs = coeffs.xy / coeffs.z;
    quadratic_coeffs.y /= 2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));

    // compute quadratic roots 
    vec2 quadratic_roots = - quadratic_coeffs.y + sqrt_quadratic_discriminant * vec2(-1.0, 1.0);
    quadratic_roots = (quadratic_discriminant >= 0.0) ? quadratic_roots : default_roots;

    /* SOLUTIONS */ 

    bool is_quadratic = abs(coeffs.z) > MICRO_TOLERANCE;
    bool is_linear = abs(coeffs.y) > MICRO_TOLERANCE;

    return (is_quadratic) ? quadratic_roots : (is_linear) ? linear_roots : default_roots;
}

vec2 strictly_quadratic_solver(in vec3 coeffs, in float target)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // set default roots
    vec2 default_roots = vec2(-1.0);

    // compute normalized quadratic coefficients 
    vec2 quadratic_coeffs = coeffs.xy / coeffs.z;
    quadratic_coeffs.y /= 2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));

    // compute quadratic roots 
    vec2 quadratic_roots = - quadratic_coeffs.y + sqrt_quadratic_discriminant * vec2(-1.0, 1.0);
   
    // quadratic solutions
    return (quadratic_discriminant < 0.0) ? default_roots : quadratic_roots;
}

vec2 strictly_quadratic_solver(in vec3 coeffs, in float target, in float flag)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // set default roots
    vec2 default_roots = vec2(flag);

    // compute normalized quadratic coefficients 
    vec2 quadratic_coeffs = coeffs.xy / coeffs.z;
    quadratic_coeffs.y /= 2.0;

    // compute quadratic discriminant
    float quadratic_discriminant = quadratic_coeffs.y * quadratic_coeffs.y - quadratic_coeffs.x;
    float sqrt_quadratic_discriminant = sqrt(abs(quadratic_discriminant));

    // compute quadratic roots 
    vec2 quadratic_roots = - quadratic_coeffs.y + sqrt_quadratic_discriminant * vec2(-1.0, 1.0);

    // quadratic solutions
    return (quadratic_discriminant < 0.0) ? default_roots : quadratic_roots;
}

#endif






