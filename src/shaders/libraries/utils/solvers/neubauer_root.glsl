
#ifndef NEUBAUER_ROOT
#define NEUBAUER_ROOT

#ifndef NEUBAUER_ITERATIONS
#define NEUBAUER_ITERATIONS 10
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

// Find a root of the polynomial c0 + c1x^1 + ... + cnx^n = 0 for x in [xa, xb]

float neubauer_root(in vec3 c, in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = xa_xb.y - xa_xb.x;
        dy = ya_yb.y - ya_yb.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = xa_xb.x - ya_yb.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * ya_yb.x <= 0.0;

        // narrow the interval based on updated values
        xa_xb = u ? vec2(xa_xb.x, x) : vec2(x, xa_xb.y);
        ya_yb = u ? vec2(ya_yb.x, y) : vec2(y, ya_yb.y);
    }

    return x;
}

float neubauer_root(in vec4 c, in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = xa_xb.y - xa_xb.x;
        dy = ya_yb.y - ya_yb.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = xa_xb.x - ya_yb.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * ya_yb.x <= 0.0;

        // narrow the interval based on updated values
        xa_xb = u ? vec2(xa_xb.x, x) : vec2(x, xa_xb.y);
        ya_yb = u ? vec2(ya_yb.x, y) : vec2(y, ya_yb.y);
    }

    return x;
}

float neubauer_root(in float c[5], in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = xa_xb.y - xa_xb.x;
        dy = ya_yb.y - ya_yb.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = xa_xb.x - ya_yb.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * ya_yb.x <= 0.0;

        // narrow the interval based on updated values
        xa_xb = u ? vec2(xa_xb.x, x) : vec2(x, xa_xb.y);
        ya_yb = u ? vec2(ya_yb.x, y) : vec2(y, ya_yb.y);
    }

    return x;
}

float neubauer_root(in float c[6], in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = xa_xb.y - xa_xb.x;
        dy = ya_yb.y - ya_yb.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = xa_xb.x - ya_yb.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * ya_yb.x <= 0.0;

        // narrow the interval based on updated values
        xa_xb = u ? vec2(xa_xb.x, x) : vec2(x, xa_xb.y);
        ya_yb = u ? vec2(ya_yb.x, y) : vec2(y, ya_yb.y);
    }

    return x;
}

#endif