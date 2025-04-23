
#ifndef LINEAR_SOLVER
#define LINEAR_SOLVER

#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

float linear_solver(in vec2 coeffs, in float target)
{

    // normalize equation coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // set default root
    float default_root = -1.0;

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    float linear_root = - linear_coeff;
   
    // linear solutions
    return (abs(coeffs.y) < MICRO_TOLERANCE) ? default_root : linear_root;
}

float linear_solver(in vec2 coeffs, in float target, in float flag)
{
    // normalize equation coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // set default root
    float default_root = flag;

    // compute normalized linear coefficients 
    float linear_coeff = coeffs.x / coeffs.y;

    // compute linear root
    float linear_root = - linear_coeff;
   
    // linear solutions
    return (abs(coeffs.y) < MICRO_TOLERANCE) ? default_root : linear_root;
}

#endif






