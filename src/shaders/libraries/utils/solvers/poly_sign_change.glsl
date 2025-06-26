

#ifndef POLY_SIGN_CHANGE
#define POLY_SIGN_CHANGE

#ifndef EVAL_POLY
#include "../math/eval_poly"
#endif
#ifndef SIGN_CHANGE
#include "../math/sign_change"
#endif
#ifndef MMIX
#include "../math/mmix"
#endif

const vec4 poly_sign_change_points = vec4(0, 1, 2, 3) / 3.0;

bool poly_sign_change(vec3 coeffs)
{
    const int n = 2;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 points = (poly_sign_change_points + float(i)) / float(n);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(vec4 coeffs)
{
    const int n = 3;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 points = (poly_sign_change_points + float(i)) / float(n);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(float coeffs[5])
{
    const int n = 4;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 points = (poly_sign_change_points + float(i)) / float(n);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(float coeffs[6])
{
    const int n = 5;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 points = (poly_sign_change_points + float(i)) / float(n);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(vec3 coeffs, vec2 xa_xb)
{
    const int n = 2;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 t = (poly_sign_change_points + float(i)) / float(n);
        vec4 points = mmix(xa_xb.x, xa_xb.y, t);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(vec4 coeffs, vec2 xa_xb)
{
    const int n = 3;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 t = (poly_sign_change_points + float(i)) / float(n);
        vec4 points = mmix(xa_xb.x, xa_xb.y, t);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(float coeffs[5], vec2 xa_xb)
{
    const int n = 4;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 t = (poly_sign_change_points + float(i)) / float(n);
        vec4 points = mmix(xa_xb.x, xa_xb.y, t);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

bool poly_sign_change(float coeffs[6], vec2 xa_xb)
{
    const int n = 5;
    bool change = false;

    #pragma unroll
    for (int i = 0; i < n; ++i) 
    {   
        vec4 t = (poly_sign_change_points + float(i)) / float(n);
        vec4 points = mmix(xa_xb.x, xa_xb.y, t);
        vec4 errors = eval_poly(coeffs, points);
        change = change || sign_change(errors);
    }

    return change;
}

#endif