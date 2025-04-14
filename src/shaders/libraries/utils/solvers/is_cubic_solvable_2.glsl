#ifndef IS_CUBIC_SOLVABLE_2
#define IS_CUBIC_SOLVABLE_2

#ifndef QUADRATIC_SOLVER
#include "./quadratic_solver"
#endif
#ifndef CUBIC_POWS
#include "./cubic_pows"
#endif
#ifndef AND
#include "../logical/and"
#endif

/**
 * Checks whether a cubic polynomial has a real root within a specified closed interval.
 * 
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x = 0
 * @param start  The start of the interval 
 * @param end    The end of the interval
 * 
 * @return True if a root exists in the closed interval (start.x, end.x), otherwise false.
 */
bool is_cubic_solvable_2(in vec4 coeffs, in float start, in float end)
{
    // compute the cubic at the boundaries
    vec2 values = vec2(
        dot(coeffs, cubic_pows(start)),
        dot(coeffs, cubic_pows(end))
    );

    // check solution based on intermediate value theorem
    if (values.x * values.y <= 0.0)
    {
        return true;
    }

    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 critical_points = quadratic_solver(derivative_coeffs, 0.0, start);

    // check if the critical points are within the interval 
    bvec2 is_inside = inside_closed(start, end, critical_points);

    // if critical points are outside the interval and intermediate value theorem is false
    // then we cannot have solutions inside the interval. If there are critical
    // points inside then compute the intermediate value theorem again
    if (!any(is_inside))
    {
        return false;
    }

    // compute the cubic at the extrema values
    vec2 extrema = vec2(
        dot(coeffs, cubic_pows(critical_points.x)),
        dot(coeffs, cubic_pows(critical_points.y))
    );

    // check sign change detection via extrema values
    bvec2 has_solution = bvec2(
        (extrema.x * values.x <= 0.0 || extrema.x * values.y <= 0.0),
        (extrema.y * values.x <= 0.0 || extrema.y * values.y <= 0.0)
    );

    // check if cubic is solvable
    bool is_solvable = any(and(is_inside, has_solution));

    // return result
    return is_solvable;
}


/**
 * Checks whether a cubic polynomial has a real root within a specified closed interval.
 * 
 * The function uses the Intermediate Value Theorem and evaluates the polynomial
 * at its local extrema to detect any sign change indicating a root within the interval.
 * 
 * @param coeffs  The coefficients of the cubic polynomial, of the form: coeffs.w * t^3 + coeffs.z * t^2 + coeffs.y * t + coeffs.x = 0
 * @param start   The start point of the function 
 * @param end     The end point of the function
 * 
 * @return True if a root exists in the closed interval (start.x, end.x), otherwise false.
 */
bool is_cubic_solvable_2(in vec4 coeffs, in vec2 start, in vec2 end)
{
    // check solution based on intermediate value theorem
    // if is false then compute critical points
    if (start.y * end.y <= 0.0)
    {
        return true;
    }

    // compute the derivative of cubic and solve for the extrema values
    vec3 derivative_coeffs = coeffs.yzw * vec3(1.0, 2.0, 3.0);
    vec2 critical_points = quadratic_solver(derivative_coeffs, 0.0, start.x);

    // check if the critical points are within the interval 
    bvec2 is_inside = inside_closed(start.x, end.x, critical_points);

    // if critical points are outside the interval and intermediate value theorem is false
    // then we cannot have solutions inside the interval. If there are critical
    // points inside then compute the intermediate value theorem again
    if (!any(is_inside))
    {
        return false;
    }

    // compute the cubic at the extrema values
    vec2 extrema = vec2(
        dot(coeffs, cubic_pows(critical_points.x)),
        dot(coeffs, cubic_pows(critical_points.y))
    );
    
    // check sign change detection via extrema values
    bvec2 has_solution = bvec2(
        (extrema.x * start.y <= 0.0 || extrema.x * end.y <= 0.0),
        (extrema.y * start.y <= 0.0 || extrema.y * end.y <= 0.0)
    );

    // check if cubic is solvable
    bool is_solvable = any(and(is_inside, has_solution));

    // return result
    return is_solvable;
}

#endif
