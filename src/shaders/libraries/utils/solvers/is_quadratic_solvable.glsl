#ifndef IS_QUADRATIC_SOLVABLE
#define IS_QUADRATIC_SOLVABLE

#ifndef LINEAR_ROOTS
#include "./linear_root"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

bool is_quadratic_solvable(in vec3 coeffs, in float f_target, in vec2 t_interval)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - f_target) = 0
    coeffs.x -= f_target;

    // compute the quadratic at the boundaries
    vec2 f_interval;
    poly_horner(coeffs, t_interval, f_interval);

    // compute quadratic derivative coefficients
    vec2 deriv_coeffs = vec2(coeffs.y, coeffs.z * 2.0);

    // solve for the critical point of the quadratic polynomial
    float t_critical = linear_root(deriv_coeffs);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the quadratic extrema value at the critical point
    float f_extrema;
    poly_horner(coeffs, t_critical, f_extrema);

    // combine function values into a single vector
    vec3 f_values = vec3(f_interval.x, f_extrema, f_interval.y);

    // compute sign changes for intermediate value theorem
    bvec2 is_crossing = lessThanEqual(f_values.xy * f_values.yz, vec2(0.0));

    // return result
    return any(is_crossing);
}

bool is_quadratic_solvable(in vec3 coeffs, in float f_target, in vec2 t_interval, in vec2 f_interval)
{
    // normalize equation coeffs.z * t^2 + coeffs.y * t + (coeffs.x - f_target) = 0
    coeffs.x -= f_target;

    // compute quadratic derivative coefficients
    vec2 deriv_coeffs = vec2(coeffs.y, coeffs.z * 2.0);

    // solve for the critical point of the quadratic polynomial
    float t_critical = linear_root(deriv_coeffs);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the quadratic extrema value at the critical point
    float f_extrema;
    poly_horner(coeffs, t_critical, f_extrema);

    // combine function values into a single vector
    vec3 f_values = vec3(f_interval.x, f_extrema, f_interval.y);

    // compute sign changes for intermediate value theorem
    bvec2 is_crossing = lessThanEqual(f_values.xy * f_values.yz, vec2(0.0));

    // return result
    return any(is_crossing);
}

#endif
