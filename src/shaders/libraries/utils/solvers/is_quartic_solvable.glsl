#ifndef IS_CUBIC_SOLVABLE
#define IS_CUBIC_SOLVABLE

#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif


bool is_quartic_solvable(in vec4 coeff, in float f_target, in vec2 t_interval)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - f_target) = 0
    coeff.x -= f_target;

    // compute the cubic at the boundaries
    vec2 f_interval;
    poly_horner(coeff, t_interval, f_interval);

    // compute cubic derivative coefficients
    vec3 deriv = coeff.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 t_critical = quadratic_roots(deriv, t_interval.x);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the cubic extrema values at the critical points
    vec2 f_extrema;
    poly_horner(coeff, t_critical, f_extrema);

    // combine function values into a single vector
    vec4 f_values = vec4(f_interval.x, f_extrema,f_interval.y);

    // compute sign changes for intermediate value theorem
    bvec3 is_crossing = lessThanEqual(f_values.xyz * f_values.yzw, vec3(0.0));

    // return result
    return any(is_crossing);
}

bool is_quartic_solvable(in vec4 coeff, in float f_target, in vec2 t_interval, in vec2 f_interval)
{
    // normalize equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeff.x -= f_target;
    f_interval -= f_target;

    // compute cubic derivative coefficients
    vec3 deriv = coeff.yzw * vec3(1.0, 2.0, 3.0);

    // solve for the critical points of the cubic polynomial
    vec2 t_critical = quadratic_roots(deriv, t_interval.x);
    t_critical = clamp(t_critical, t_interval.x, t_interval.y);

    // compute the cubic extrema values at the critical points
    vec2 f_extrema;
    poly_horner(coeff, t_critical, f_extrema);

    // combine function values into a single vector
    vec4 f_values = vec4(f_interval.x, f_extrema,f_interval.y);

    // compute sign changes for intermediate value theorem
    bvec3 is_crossing = lessThanEqual(f_values.xyz * f_values.yzw, vec3(0.0));

    // return result
    return any(is_crossing);
}


#endif
