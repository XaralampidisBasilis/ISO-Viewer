#ifndef IS_CUBIC_SOLVABLE
#define IS_CUBIC_SOLVABLE

#ifndef QUADRATIC_SOLVER
#include "./quadratic_solver"
#endif
#ifndef AND
#include "../logical/and"
#endif
#ifndef CUBIC_POWS
#include "./cubic_pows"
#endif

/**
 * Determines whether the cubic polynomial defined by the given coefficients
 * intersects a target value within a specific interval.
 * 
 * Solves: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x = value
 * within the interval (start, end), using the Intermediate Value Theorem and
 * checking local extrema for additional root existence.
 * 
 * @param coeffs A vec4 of cubic coefficients (constant, linear, quadratic, cubic terms).
 * @param value  The target value to solve the cubic equation against.
 * @param start  The start of the interval to check (exclusive).
 * @param end    The end of the interval to check (exclusive).
 * @return       True if a solution to the cubic equation exists within the interval.
 */
bool is_cubic_solvable(in vec4 coeffs, in float target, in float start, in float end)
{
    // normalize cubic equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // compute the cubic at the boundary values
    vec2 limits = vec2(
        dot(coeffs, cubic_pows(start)),
        dot(coeffs, cubic_pows(end))
    );

    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 critical_roots = quadratic_solver(derivative_coeffs, 0.0, start);

    // compute the cubic at the extrema values
    vec2 extrema = vec2(
        dot(coeffs, cubic_pows(critical_roots.x)),
        dot(coeffs, cubic_pows(critical_roots.y))
    );
    
    // check if the extrema are within the interval and evaluate the cubic at those points
    bvec2 is_inside = inside_open(start, end, critical_roots);

    // check solution based on intermediate value theorem
    bool is_solvable = (limits.x * limits.y <= 0.0);

    // check solution based on the first extrema value inside the interval
    is_solvable = is_solvable || 

        (is_inside.x && ((extrema.x * limits.x < 0.0) ||
                         (extrema.x * limits.y < 0.0) || 
                         (abs(extrema.x) < 0.0))) ||

        (is_inside.y && ((extrema.y * limits.x < 0.0) ||
                         (extrema.y * limits.y < 0.0) || 
                         (abs(extrema.y) < 0.0))); 

    // return result
    return is_solvable;
}

bool is_cubic_solvable(in vec4 coeffs, in float target, in float start, in float end, in float start_value, in float end_value)
{
    // normalize cubic equation coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + (coeffs.x - target) = 0
    coeffs.x -= target;

    // compute the cubic at the boundary values
    vec2 limits = vec2
    (
        start_value - target,
        end_value - target
    );

    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 critical_roots = quadratic_solver(derivative_coeffs, 0.0, start);

    // compute the cubic at the extrema values
    vec2 extrema = vec2
    (
        dot(coeffs, cubic_pows(critical_roots.x)),
        dot(coeffs, cubic_pows(critical_roots.y))
    );
    
    // check if the extrema are within the interval and evaluate the cubic at those points
    bvec2 is_inside = inside_open(start, end, critical_roots);

    // check solution based on intermediate value theorem
    bool is_solvable = (limits.x * limits.y <= 0.0);

    // check solution based on the first extrema value inside the interval
    is_solvable = is_solvable || 
        (is_inside.x && ((extrema.x * limits.x <= 0.0)   ||
                         (extrema.x * limits.y <= 0.0))) ||
        (is_inside.y && ((extrema.y * limits.x <= 0.0)   ||
                         (extrema.y * limits.y <= 0.0)));

    // return result
    return is_solvable;
}


#endif
