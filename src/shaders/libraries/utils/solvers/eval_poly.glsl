#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef MAX_DEGREE
#define MAX_DEGREE 8
#endif

float eval_poly(in vec2 coeffs, in float t) 
{
    return coeffs.x + coeffs.y * t;
}

float eval_poly(in vec3 coeffs, in float t) 
{
    return ((coeffs.z * t) + coeffs.y) * t + coeffs.x;
}

float eval_poly(in vec4 coeffs, in float t) 
{
    return ((coeffs.w * t + coeffs.z) * t + coeffs.y) * t + coeffs.x;
}


float eval_poly(in float coeffs[MAX_DEGREE + 1], in int degree, in float t) 
{    
    float result = coeffs[MAX_DEGREE];

    // evaluate polynomial using Horner's method
    #pragma unroll_loop_start
    for (int i = MAX_DEGREE - 1; i >= 0; --i) 
    {
        result = result * t + coeffs[i];
    }
    #pragma unroll_loop_end

    return result;
}

#endif
