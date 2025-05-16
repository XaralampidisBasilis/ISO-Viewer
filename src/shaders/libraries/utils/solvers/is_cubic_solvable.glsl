#ifndef IS_CUBIC_SOLVABLE
#define IS_CUBIC_SOLVABLE

#ifndef QUADRATIC_SOLVER
#include "./quadratic_solver"
#endif
#ifndef POLY
#include "../math/poly"
#endif

/**
 * Checks whether a cubic polynomial can be equal to a target value within a specified closed interval.
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x
 * @param f_target    The value to check if the cubic can be equal
 * @param t_interval  The interval that we search the target
 * 
 * @return True if a root exists in the closed interval, otherwise false.
 */
bool is_cubic_solvable(in vec4 coeffs, in float f_target, in vec2 t_interval)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - f_target) = 0
    coeffs.x -= f_target;

    // compute the cubic at the boundaries
    vec2 f_interval;
    poly(coeffs, t_interval.x, f_interval.x)
    poly(coeffs, t_interval.y, f_interval.y)

    // compute cubic derivative coefficients
    vec3 deriv_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 t_critical = strictly_quadratic_solver(deriv_coeffs, 0.0, t_interval.x);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the cubic extrema values at the critical points
    vec2 f_extrema;
    poly(coeffs, t_critical.x, f_extrema.x)
    poly(coeffs, t_critical.y, f_extrema.y)

    // combine function values into a single vector
    vec4 f_values = vec4(f_interval, f_extrema);

    // compute sign changes for intermediate value theorem
    bvec3 is_crossing = lessThanEqual(f_values.xzw * f_values.zwy, vec3(0.0));

    // return result
    return any(is_crossing);
}

/**
 * Checks whether a cubic polynomial can be equal to a target value within a specified closed interval.
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x
 * @param f_target    The value to check if the cubic can be equal
 * @param t_interval  The interval that we search the target
 * @param f_interval  The interval function values that we know beforehand
 * 
 * @return True if a root exists in the closed interval, otherwise false.
 */

bool is_cubic_solvable(in vec4 coeffs, in float f_target, in vec2 t_interval, in vec2 f_interval)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= f_target;
    f_interval -= f_target;

    // compute cubic derivative coefficients
    vec3 deriv_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 t_critical = strictly_quadratic_solver(deriv_coeffs, 0.0, t_interval.x);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the cubic extrema values at the critical points
    vec2 f_extrema;
    poly(coeffs, t_critical.x, f_extrema.x)
    poly(coeffs, t_critical.y, f_extrema.y)

    // combine function values into a single vector
    vec4 f_values = vec4(f_interval, f_extrema);

    // compute sign changes for intermediate value theorem
    bvec3 is_crossing = lessThanEqual(f_values.xzw * f_values.zwy, vec3(0.0));

    // return result
    return any(is_crossing);
}


#endif
