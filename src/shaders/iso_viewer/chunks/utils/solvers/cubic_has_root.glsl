
/* Soures
Finding Real Polynomial Roots on GPUs (https://momentsingraphics.de/GPUPolynomialRoots.html),
Shadertoy Spherical harmonics glyphs (https://www.shadertoy.com/view/dlGSDV),
Ray Tracing Spherical Harmonics Glyphs (https://momentsingraphics.de/VMV2023.html),
High-Performance Polynomial Solver Cem Yuksel (https://www.cemyuksel.com/research/polynomials/),
cyPolynomial.h class (https://github.com/cemyuksel/cyCodeBase/blob/master/cyPolynomial.h),
*/

#ifndef CUBIC_HAS_ROOT
#define CUBIC_HAS_ROOT

// Searches a single root of a polynomial within a given interval.
// \param out_end_value The value of the given polynomial at end.
// \param poly Coefficients of the polynomial for which a root should be found.
//        Coefficient poly[i] is multiplied by x^i.
// \param begin The beginning of an interval where the polynomial is monotonic.
// \param end The end of said interval.
// \param begin_value The value of the given polynomial at begin.
// \return true if a root was found, false if no root exists.
bool cubic_sign_change
(
    out float out_end_value,
    vec4 poly, 
    float begin, 
    float end,
    float begin_value
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    // Evaluate the polynomial at the end of the interval
    out_end_value = poly[3];
    out_end_value = out_end_value * end + poly[2];
    out_end_value = out_end_value * end + poly[1];
    out_end_value = out_end_value * end + poly[0];

    return (begin_value * out_end_value <= 0.0);
}

// Finds if the given polynomial has root in the interval [begin, end]
bool cubic_has_root(
    vec4 poly, 
    float begin, 
    float end
){

    // The last entry in the root array is set to end to make it easier to
    // iterate over relevant intervals, all untouched roots are set to begin
    vec4 crit_roots;
    crit_roots[0] = begin;
    crit_roots[3] = end;

    // Construct the quadratic derivative of the polynomial. We divide each
    // derivative by the factorial of its order, such that the constant
    // coefficient can be copied directly from poly. That is a safeguard
    // against overflow and makes it easier to avoid spilling below. The
    // factors happen to be binomial coefficients then.
    vec4 deriv_poly;
    deriv_poly[0] = poly[1];
    deriv_poly[1] = poly[2] * 2.0;
    deriv_poly[2] = poly[3] * 3.0;
    deriv_poly[3] = 0.0;

    // Compute its two roots using the quadratic formula
    vec3 quad_poly = vec3(deriv_poly[0], deriv_poly[1], deriv_poly[2]);
    vec2 quad_roots;

    if (quadratic_roots(quad_roots, quad_poly, begin, end)) 
    {        
        crit_roots[1] = quad_roots[0];
        crit_roots[2] = quad_roots[1];
    }
    else 
    {
        // Indicate that the quadratic has no roots
        crit_roots[1] = begin;
        crit_roots[2] = begin;
    }

    // Determine the value of this deriv_poly at begin
    float begin_value = poly[3];
    begin_value = begin_value * begin + poly[2];
    begin_value = begin_value * begin + poly[1];
    begin_value = begin_value * begin + poly[0];

    // Iterate over the intervals where sign change may be found
    #pragma unroll
    for (int i = 0; i <= 2; ++i) 
    {
        float current_begin = crit_roots[i];
        float current_end = crit_roots[i + 1];

        // Try to find sign change
        if (cubic_sign_change(begin_value, poly, current_begin, current_end, begin_value))
        {
            return true;
        }
    };

    return false;
}

#endif