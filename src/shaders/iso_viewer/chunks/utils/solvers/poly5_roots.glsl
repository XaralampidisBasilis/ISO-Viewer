
/* Soures
Finding Real Polynomial Roots on GPUs (https://momentsingraphics.de/GPUPolynomialRoots.html),
Shadertoy Spherical harmonics glyphs (https://www.shadertoy.com/view/dlGSDV),
Ray Tracing Spherical Harmonics Glyphs (https://momentsingraphics.de/VMV2023.html),
High-Performance Polynomial Solver Cem Yuksel (https://www.cemyuksel.com/research/polynomials/),
cyPolynomial.h class (https://github.com/cemyuksel/cyCodeBase/blob/master/cyPolynomial.h),
*/

#ifndef POLY5_ROOTS
#define POLY5_ROOTS

// When there are fewer intersections/roots than theoretically possible, some
// array entries are set to this value
#define POLY5_NO_INTERSECTION 3.4e38

#ifndef SORT
#include "../math/sort"
#endif

// Searches a single root of a polynomial within a given interval.
// \param out_root The location of the found root.
// \param out_end_value The value of the given polynomial at end.
// \param poly Coefficients of the polynomial for which a root should be found.
//        Coefficient poly[i] is multiplied by x^i.
// \param begin The beginning of an interval where the polynomial is monotonic.
// \param end The end of said interval.
// \param begin_value The value of the given polynomial at begin.
// \param error_tolerance The error tolerance for the returned root location.
//        Typically the error will be much lower but in theory it can be
//        bigger.
// \return true if a root was found, false if no root exists.

bool poly5_roots_newton_bisection
(
    out float out_root, 
    out float out_end_value,
    float poly[6], 
    float begin, 
    float end,
    float begin_value, 
    float error_tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    // Evaluate the polynomial at the end of the interval
    out_end_value = poly[5];
    out_end_value = out_end_value * end + poly[4];
    out_end_value = out_end_value * end + poly[3];
    out_end_value = out_end_value * end + poly[2];
    out_end_value = out_end_value * end + poly[1];
    out_end_value = out_end_value * end + poly[0];

    // If the values at both ends have the same non-zero sign, there is no root
    if (begin_value * out_end_value > 0.0) return false;

    // Otherwise, we find the root iteratively using Newton bisection (with
    // bounded iteration count)
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 40; ++i) 
    {
        // Evaluate the polynomial and its derivative
        float value = poly[5] * current + poly[4];
        float derivative = poly[5];

        #pragma unroll
        for (int j = 3; j != -1; --j) 
        {
            derivative = derivative * current + value;
            value = value * current + poly[j];
        }

        // Shorten the interval
        bool right = (begin_value * value > 0.0);
        begin = right ? current : begin;
        end = right ? end : current;

        // Apply Newton's method
        float guess = current - value / derivative;

        // Pick a guess
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;

        // Move along or terminate
        bool done = abs(next - current) < error_tolerance;
        current = next;
        if (done) break;
    }

    out_root = current;
    return true;
}


// Finds all roots of the given polynomial in the interval [begin, end] and
// writes them to out_roots. Some entries will be POLY5_NO_INTERSECTION but other 
// than that the array is sorted. The last entry is always POLY5_NO_INTERSECTION.
void poly5_roots
(
    out float out_roots[6], 
    float poly[6], 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1e-9;

    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    float deriv_poly[6];
    deriv_poly[0] = poly[3];        
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[3] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[5] = 0.0;

    // Compute its two roots using the quadratic formula
    float disc = deriv_poly[1] * deriv_poly[1] - 4.0 * deriv_poly[0] * deriv_poly[2];

    if (disc >= 0.0) 
    {
        float sqrt_disc = sqrt(disc);
        float scaled_root = deriv_poly[1] + (deriv_poly[1] > 0.0 ? sqrt_disc : -sqrt_disc);
        float root_0 = clamp(-2.0 * deriv_poly[0] / scaled_root, begin, end);
        float root_1 = clamp(-0.5 * scaled_root / deriv_poly[2], begin, end);
        out_roots[3] = min(root_0, root_1);
        out_roots[4] = max(root_0, root_1);
    }
    else 
    {
        // Indicate that the cubic derivative has a single root
        out_roots[3] = begin;
        out_roots[4] = begin;
    }

    // The last entry in the root array is set to end to make it easier to
    // iterate over relevant intervals, all untouched roots are set to begin
    out_roots[0] = begin;
    out_roots[1] = begin;
    out_roots[2] = begin;
    out_roots[5] = end;

    // Work your way up to derivatives of higher degree until you reach the
    // polynomial itself. This implementation may seem peculiar: It always
    // treats the derivative as though it had degree 5 and it
    // constructs the derivatives in a contrived way. Changing that would
    // reduce the number of arithmetic instructions roughly by a factor of two.
    // However, it would also cause register spilling, which has a far more
    // negative impact on the overall run time. Profiling indicates that the
    // current implementation has no spilling whatsoever.
    #pragma no_unroll
    for (int degree = 3; degree != 6; ++degree) 
    {
        // Take the integral of the previous derivative (scaled such that the
        // constant coefficient can still be copied directly from poly)
        float prev_derivative_order = float(6 - degree);
        deriv_poly[5] = deriv_poly[4] * (prev_derivative_order * (1.0 / 5.0));
        deriv_poly[4] = deriv_poly[3] * (prev_derivative_order * (1.0 / 4.0));
        deriv_poly[3] = deriv_poly[2] * (prev_derivative_order * (1.0 / 3.0));
        deriv_poly[2] = deriv_poly[1] * (prev_derivative_order * (1.0 / 2.0));
        deriv_poly[1] = deriv_poly[0] * (prev_derivative_order * (1.0 / 1.0));
     
        // Copy the constant coefficient without causing spilling. This part
        // would be harder if the derivative were not scaled the way it is.
        deriv_poly[0] = (degree == 5) ? poly[0] : deriv_poly[0];
        deriv_poly[0] = (degree == 4) ? poly[1] : deriv_poly[0];
        deriv_poly[0] = (degree == 3) ? poly[2] : deriv_poly[0];

        // Determine the value of this derivative at begin
        float begin_value = deriv_poly[5];
        begin_value = begin_value * begin + deriv_poly[4];
        begin_value = begin_value * begin + deriv_poly[3];
        begin_value = begin_value * begin + deriv_poly[2];
        begin_value = begin_value * begin + deriv_poly[1];
        begin_value = begin_value * begin + deriv_poly[0];

        // Iterate over the intervals where roots may be found
        #pragma unroll
        for (int i = 0; i != 5; ++i) 
        {
            if (i < 5 - degree)
            {
                continue;
            }

            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];

            // Try to find a root
            float root;
            if (poly5_roots_newton_bisection(root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = root;
            }
            else if (degree < 5)
            {
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY5_NO_INTERSECTION;
            }
        }
    }

    // We no longer need this array entry
    out_roots[5] = POLY5_NO_INTERSECTION;
}

// Finds all roots of the given polynomial in the interval [begin, end] and
// writes them to out_roots using the cubic deflation method. Some entries will be POLY5_NO_INTERSECTION but other 
// than that the array is sorted. The last entry is always POLY5_NO_INTERSECTION.
void poly5_roots_v2
(
    out float out_roots[6], 
    float poly[6], 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1e-6;

    // The last entry in the root array is set to end to make it easier to
    // iterate over relevant intervals, all untouched roots are set to begin
    out_roots[0] = begin;
    out_roots[1] = begin;
    out_roots[2] = begin;
    out_roots[3] = begin;
    out_roots[4] = begin;
    out_roots[5] = end;

    // Construct the linear derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    float deriv_poly[6];
    deriv_poly[0] = poly[4];      
    deriv_poly[1] = poly[5] * 5.0;
    deriv_poly[2] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[5] = 0.0;

    #pragma no_unroll
    for (int degree = 2; degree != 4; ++degree) 
    {
        // Take the integral of the previous derivative (scaled such that the
        // constant coefficient can still be copied directly from poly)
        float prev_derivative_order = float(6 - degree);
        deriv_poly[3] = deriv_poly[2] * (prev_derivative_order * (1.0 / 3.0));
        deriv_poly[2] = deriv_poly[1] * (prev_derivative_order * (1.0 / 2.0));
        deriv_poly[1] = deriv_poly[0] * (prev_derivative_order * (1.0 / 1.0));
     
        // Copy the constant coefficient without causing spilling. This part
        // would be harder if the derivative were not scaled the way it is.
        deriv_poly[0] = (degree == 3) ? poly[2] : deriv_poly[0];
        deriv_poly[0] = (degree == 2) ? poly[3] : deriv_poly[0];

        // Determine the value of this derivative at begin
        float begin_value = deriv_poly[3];
        begin_value = begin_value * begin + deriv_poly[2];
        begin_value = begin_value * begin + deriv_poly[1];
        begin_value = begin_value * begin + deriv_poly[0];

        // Try to find a root
        vec3 quad_poly, roots;
        if (poly5_roots_newton_bisection(roots[2], begin_value, deriv_poly, out_roots[3], out_roots[4], begin_value, tolerance))
        {
            quad_poly[2] = deriv_poly[3];
            quad_poly[1] = deriv_poly[2] + quad_poly[2] * roots[2];
            quad_poly[0] = deriv_poly[1] + quad_poly[1] * roots[2];
        }
        else 
        {
            roots[2] = begin;
            quad_poly[2] = deriv_poly[2];
            quad_poly[1] = deriv_poly[1];
            quad_poly[0] = deriv_poly[0];
        }

        // Compute its two roots using the quadratic formula
        float disc = quad_poly[1] * quad_poly[1] - 4.0 * quad_poly[0] * quad_poly[2];
        if (disc >= 0.0)
        {
            float sqrt_disc = sqrt(max(disc, 0.0));
            float scaled_root = quad_poly[1] + (quad_poly[1] > 0.0 ? sqrt_disc : -sqrt_disc);
            roots[0] = -2.0 * quad_poly[0] / scaled_root;
            roots[1] = -0.5 * scaled_root / quad_poly[2];
            roots[0] = clamp(roots[0], begin, end);
            roots[1] = clamp(roots[1], begin, end);
            sort(roots);
        }
        else
        {
            roots[0] = begin;
            roots[1] = begin;
        }

        out_roots[2] = roots[0];
        out_roots[3] = roots[1];
        out_roots[4] = roots[2];
    }   

    // Work your way up to derivatives of higher degree until you reach the
    // polynomial itself. This implementation may seem peculiar: It always
    // treats the derivative as though it had degree 5 and it
    // constructs the derivatives in a contrived way. Changing that would
    // reduce the number of arithmetic instructions roughly by a factor of two.
    // However, it would also cause register spilling, which has a far more
    // negative impact on the overall run time. Profiling indicates that the
    // current implementation has no spilling whatsoever.
    #pragma no_unroll
    for (int degree = 4; degree != 6; ++degree) 
    {
        // Take the integral of the previous derivative (scaled such that the
        // constant coefficient can still be copied directly from poly)
        float prev_derivative_order = float(6 - degree);
        deriv_poly[5] = deriv_poly[4] * (prev_derivative_order * (1.0 / 5.0));
        deriv_poly[4] = deriv_poly[3] * (prev_derivative_order * (1.0 / 4.0));
        deriv_poly[3] = deriv_poly[2] * (prev_derivative_order * (1.0 / 3.0));
        deriv_poly[2] = deriv_poly[1] * (prev_derivative_order * (1.0 / 2.0));
        deriv_poly[1] = deriv_poly[0] * (prev_derivative_order * (1.0 / 1.0));
     
        // Copy the constant coefficient without causing spilling. This part
        // would be harder if the derivative were not scaled the way it is.
        deriv_poly[0] = (degree == 5) ? poly[0] : deriv_poly[0];
        deriv_poly[0] = (degree == 4) ? poly[1] : deriv_poly[0];
        deriv_poly[0] = (degree == 3) ? poly[2] : deriv_poly[0];

        // Determine the value of this derivative at begin
        float begin_value = deriv_poly[5];
        begin_value = begin_value * begin + deriv_poly[4];
        begin_value = begin_value * begin + deriv_poly[3];
        begin_value = begin_value * begin + deriv_poly[2];
        begin_value = begin_value * begin + deriv_poly[1];
        begin_value = begin_value * begin + deriv_poly[0];

        // Iterate over the intervals where roots may be found
        #pragma unroll
        for (int i = 0; i != 5; ++i) 
        {
            if (i < 5 - degree)
            {
                continue;
            }

            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];

            // Try to find a root
            float root;
            if (poly5_roots_newton_bisection(root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = root;
            }
            else if (degree < 5)
            {
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY5_NO_INTERSECTION;
            }
        }
    }

    // We no longer need this array entry
    out_roots[5] = POLY5_NO_INTERSECTION;
}

#endif