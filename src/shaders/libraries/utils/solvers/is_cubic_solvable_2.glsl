#ifndef IS_CUBIC_SOLVABLE_2
#define IS_CUBIC_SOLVABLE_2

#ifndef QUADRATIC_SOLVER
#include "./quadratic_solver"
#endif
#ifndef CUBIC_POWS
#include "./cubic_pows"
#endif

/**
 * Checks whether a cubic polynomial has a real root within a specified closed interval.
 * 
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x
 * @param f_target  The value to check if it archivable by the polynomial function
 * @param t_start  The start of the interval 
 * @param t_end    The end of the interval
 * 
 * @return True if a root exists in the closed interval [t_start, t_start], otherwise false.
 */
bool is_cubic_solvable_2(in vec4 coeffs, in float f_target, in float t_start, in float t_end)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - f_target) = 0
    coeffs.x -= f_target;

    // compute the cubic at the boundaries
    float f_start = dot(coeffs, cubic_pows(t_start));
    float f_end   = dot(coeffs, cubic_pows(t_end));


    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 t_critical = quadratic_solver(derivative_coeffs, 0.0, t_start);

    // check if the critical roots are within the interval 
    bvec2 is_inside = inside_closed(t_start, t_end, t_critical);

    // compute the cubic at the extrema values
    vec2 f_extrema = vec2(
        dot(coeffs, cubic_pows(t_critical.x)),
        dot(coeffs, cubic_pows(t_critical.y))
    );

    // check sign change detection via extrema values
    bvec3 is_crossing = bvec3(
        is_inside.x && (f_start * f_extrema.x <= 0.0 || f_extrema.x * f_end <= 0.0) ,
        is_inside.y && (f_start * f_extrema.y <= 0.0 || f_extrema.y * f_end <= 0.0) ,
        (f_start * f_end <= 0.0)
    );

    // check if cubic is solvable
    bool is_solvable = any(is_crossing);

    // return result
    return is_solvable;
}

/**
 * Checks whether a cubic polynomial has a real root within a specified closed interval.
 * 
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x
 * @param f_target  The value to check if it archivable by the polynomial function
 * @param p_start   The start point of the function 
 * @param p_end     The end point of the function
 * 
 * @return True if a root exists in the closed interval [p_start.x, p_end.x], otherwise false.
 */
bool is_cubic_solvable_2(in vec4 coeffs, in float f_target, in vec2 p_start, in vec2 p_end)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= f_target;

    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 t_critical = quadratic_solver(derivative_coeffs, 0.0, p_start.x);

    // check if the critical points are within the interval 
    bvec2 is_inside = inside_closed(p_start.x, p_end.x, t_critical);

    // compute the cubic at the extrema values
    vec2 f_extrema = vec2(
        dot(coeffs, cubic_pows(t_critical.x)),
        dot(coeffs, cubic_pows(t_critical.y))
    );
    
    // check sign change detection via extrema values
    bvec3 is_crossing = bvec3(
        is_inside.x && (p_start.y * f_extrema.x <= 0.0 || f_extrema.x * p_end.y <= 0.0),
        is_inside.y && (p_start.y * f_extrema.y <= 0.0 || f_extrema.y * p_end.y <= 0.0),
        (p_start.y * p_end.y <= 0.0)
    );

    // check if cubic is solvable
    bool is_solvable = any(is_crossing);

    // return result
    return is_solvable;
}

#endif
