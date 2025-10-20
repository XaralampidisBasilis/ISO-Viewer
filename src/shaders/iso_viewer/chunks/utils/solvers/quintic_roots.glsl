
/* Soures
Finding Real Polynomial Roots on GPUs (https://momentsingraphics.de/GPUPolynomialRoots.html),
Shadertoy Spherical harmonics glyphs (https://www.shadertoy.com/view/dlGSDV),
Ray Tracing Spherical Harmonics Glyphs (https://momentsingraphics.de/VMV2023.html),
High-Performance Polynomial Solver Cem Yuksel (https://www.cemyuksel.com/research/polynomials/),
cyPolynomial.h class (https://github.com/cemyuksel/cyCodeBase/blob/master/cyPolynomial.h),
*/

#ifndef QUINTIC_ROOTS
#define QUINTIC_ROOTS

// When there are fewer intersections/roots than theoretically possible, some
// array entries are set to this value
#ifndef POLY_NO_INTERSECTION
#define POLY_NO_INTERSECTION 3.4e38
#endif

#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif

// Searches a single root of a quintic polynomial within a given interval.
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
bool quintic_root_newton_bisection(
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
    #pragma unroll
    for (int i = 4; i >= 0; --i) 
    {
        out_end_value = out_end_value * end + poly[i];
    }

    // If the values at both ends have the same non-zero sign, there is no root
    if (begin_value * out_end_value > 0.0) return false;

    // Otherwise, we find the root iteratively using Newton bisection (with
    // bounded iteration count)
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i < 10; ++i) 
    {
        // Evaluate the polynomial and its derivative
        float value = poly[5] * current + poly[4];
        float derivative = poly[5];
        #pragma unroll
        for (int j = 3; j >= 0; --j) 
        {
            derivative = derivative * current + value;
            value = value * current + poly[j];
        }

        // Shorten the interval
        bool right = (begin_value * value > 0.0);
        begin = right ? current : begin;
        end = right ? end : current;

        // Apply Newton's method
        float step = value / derivative;
        float guess = current - step;

        // Pick a guess
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;

        // Move along or terminate
        bool done = abs(step) < error_tolerance;
        current = next;
        if (done) break;
    }

    out_root = current;
    return true;
}

// Finds all roots of the given quintic polynomial in the interval [begin, end] and
// writes them to out_roots. Some entries will be POLY_NO_INTERSECTION but other 
// than that the array is sorted. The last entry is always POLY_NO_INTERSECTION.
void quintic_roots(
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
    out_roots[5] = end;

    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    float deriv_poly[6];
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[0] = poly[3];        

    // Compute its two roots using the quadratic formula
    vec3 quad_poly = vec3(deriv_poly[0], deriv_poly[1], deriv_poly[2]);
    vec2 quad_roots;

    if (quadratic_roots(quad_roots, quad_poly, begin, end)) 
    {        
        out_roots[3] = quad_roots[0];
        out_roots[4] = quad_roots[1];
    }
    else 
    {
        // Indicate that the quadratic has no roots
        out_roots[3] = begin;
        out_roots[4] = begin;
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
    for (int degree = 3; degree <= 5; ++degree) 
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
        for (int i = 0; i <= 4; ++i) 
        {
            if (i < 5 - degree) continue;

            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];
            float current_root;

            // Try to find a root
            if (quintic_root_newton_bisection(current_root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = current_root;
            }
            else if (degree < 5)
            {
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY_NO_INTERSECTION;
            }
        }
    }

    // We no longer need this array entry
    out_roots[5] = POLY_NO_INTERSECTION;
}

// Finds all roots of the given quintic polynomial in the interval [begin, end] using high order deflation and
// writes them to out_roots using the cubic deflation method. Some entries will be POLY_NO_INTERSECTION but other 
// than that the array is sorted. The last entry is always POLY_NO_INTERSECTION.
void quintic_roots_deflate(
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
    out_roots[5] = end;

    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    // degree = 2
    float deriv_poly[6];
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[0] = poly[3];    

    // Compute its two roots using the quadratic formula
    vec3 quad_poly = vec3(deriv_poly[0], deriv_poly[1], deriv_poly[2]);
    vec2 quad_roots;
    
    if (quadratic_roots(quad_roots, quad_poly, begin, end)) 
    {
        out_roots[3] = quad_roots[0];
        out_roots[4] = quad_roots[1];
    }
    else 
    {
        // Indicate that the quadratic has no roots
        out_roots[3] = begin;
        out_roots[4] = begin;
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
    for (int degree = 3; degree <= 5; ++degree) 
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

        // Start deflated polynomial as the derivative
        float defl_poly[6] = deriv_poly;

        // Iterate over the intervals where roots may be found
        float current_root = begin; 
        int num_roots = 0; 
    
        #pragma no_unroll
        for (int i = 5 - degree; i <= 4; ++i) 
        {
            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];

            // Try to find a root
            if (quintic_root_newton_bisection(current_root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = current_root; 
                if (i < 4) num_roots++;

                float d5 = 0.0;   
                float d4 = d5 * current_root + defl_poly[5];        
                float d3 = d4 * current_root + defl_poly[4];
                float d2 = d3 * current_root + defl_poly[3];
                float d1 = d2 * current_root + defl_poly[2];
                float d0 = d1 * current_root + defl_poly[1];
                // float res = d0 * current_root + defl_poly[0];

                defl_poly[5] = d5;  
                defl_poly[4] = d4;
                defl_poly[3] = d3;
                defl_poly[2] = d2;
                defl_poly[1] = d1;
                defl_poly[0] = d0;
            }
            else if (degree < 5)
            {
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY_NO_INTERSECTION;
            }
            
            // When the deflated polynomial becomes a quadratic
            // break the loop and solve for the remaining roots
            if (num_roots == degree - 2) break;  
        }

        if (num_roots == degree - 2) 
        {
            // Compute quadratic roots in [current_root, end]
            // if roots where found clamp them to bracket to keep the order
            vec3 quad_poly = vec3(defl_poly[0], defl_poly[1], defl_poly[2]);
            vec2 quad_roots;

            if (quadratic_roots(quad_roots, quad_poly, current_root, end)) 
            {
                out_roots[3] = quad_roots[0];
                out_roots[4] = quad_roots[1];
            }
            else
            {
                out_roots[3] = current_root;
                out_roots[4] = current_root;
            }
        }
    }

    // We no longer need this array entry
    out_roots[5] = POLY_NO_INTERSECTION;
}

// Finds all roots of the given quintic polynomial in the interval [begin, end] using cubic deflation and
// writes them to out_roots using the cubic deflation method. Some entries will be POLY_NO_INTERSECTION but other 
// than that the array is sorted. The last entry is always POLY_NO_INTERSECTION.
void quintic_roots_deflate_cubic(
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
    out_roots[5] = end;

    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.

    // degree = 2
    float deriv_poly[6];
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[0] = poly[3];        

    // Compute its two roots using the quadratic formula
    vec3 quad_poly = vec3(deriv_poly[0], deriv_poly[1], deriv_poly[2]);
    vec2 quad_roots;

    if (quadratic_roots(quad_roots, quad_poly, begin, end)) 
    {
        out_roots[3] = quad_roots[0];
        out_roots[4] = quad_roots[1];
    }
    else 
    {
        // Indicate that the quadratic has no roots
        out_roots[3] = begin;
        out_roots[4] = begin;
    }

    // degree = 3
    // Take the integral of the previous derivative (scaled such that the
    // constant coefficient can still be copied directly from poly)
    deriv_poly[3] = deriv_poly[2] * (3.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (3.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (3.0 / 1.0);
    deriv_poly[0] = poly[2];

    // Determine the value of this derivative at begin
    float begin_value = deriv_poly[3];
    begin_value = deriv_poly[2] + begin_value * begin;
    begin_value = deriv_poly[1] + begin_value * begin;
    begin_value = deriv_poly[0] + begin_value * begin;

    // Iterate over the intervals where roots may be found
    float current_root = begin;
    int num_roots = 0;

    #pragma unroll
    for (int i = 2; i <= 4; ++i) 
    {
        float current_begin = out_roots[i];
        float current_end = out_roots[i + 1];

        // Try to find a cubic root
        if (quintic_root_newton_bisection(current_root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
        {               
            out_roots[i] = current_root; 
            if (i < 4) num_roots++;
        }
        else
        {
            // Create an empty interval for the next iteration
            out_roots[i] = out_roots[i - 1];
        }

        if (num_roots == 1) break;
    }

    if (num_roots == 1)
    {
        vec3 quad_poly;
        quad_poly[2] = deriv_poly[3];
        quad_poly[1] = deriv_poly[2] + quad_poly[2] * current_root; 
        quad_poly[0] = deriv_poly[1] + quad_poly[1] * current_root; 

        vec2 quad_roots;
        if (quadratic_roots(quad_roots, quad_poly, current_root, end)) 
        {
            out_roots[3] = quad_roots[0];
            out_roots[4] = quad_roots[1];
        }
        else 
        {
            out_roots[3] = current_root;
            out_roots[4] = current_root;
        }
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
    for (int degree = 4; degree <= 5; ++degree) 
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

        // Determine the value of this derivative at begin
        float begin_value = deriv_poly[5];
        begin_value = deriv_poly[4] + begin_value * begin;
        begin_value = deriv_poly[3] + begin_value * begin;
        begin_value = deriv_poly[2] + begin_value * begin;
        begin_value = deriv_poly[1] + begin_value * begin;
        begin_value = deriv_poly[0] + begin_value * begin;

        // Iterate over the intervals where roots may be found
        #pragma unroll
        for (int i = 0; i <= 4; ++i) 
        {
            if (i < 5 - degree) continue;

            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];
            float current_root;

            // Try to find a root
            if (quintic_root_newton_bisection(current_root, begin_value, deriv_poly, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = current_root;
            }
            else if (degree < 5)
            {
                // Create an empty interval for the next iteration
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY_NO_INTERSECTION;
            }
        }
    }

    // We no longer need this array entry
    out_roots[5] = POLY_NO_INTERSECTION;
}

#endif
