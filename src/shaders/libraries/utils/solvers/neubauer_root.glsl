
#ifndef NEUBAUER_ROOT
#define NEUBAUER_ROOT

#ifndef NEUBAUER_ITERATIONS
#define NEUBAUER_ITERATIONS 10
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif
#ifndef EVAL_POLY
#include "../math/eval_poly"
#endif

// Find a root of the polynomial c0 + c1x^1 + ... + cnx^n = 0 for x in [x0, x1]

float neubauer_root(in vec4 c, in vec2 x0_x1)
{
    vec2 y0_y1;
    eval_poly(c, x0_x1, y0_y1);

    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;

    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float neubauer_root(in float c[5], in vec2 x0_x1)
{
    vec2 y0_y1;
    eval_poly(c, x0_x1, y0_y1);

    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;
    
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float neubauer_root(in float c[6], in vec2 x0_x1)
{
    vec2 y0_y1;
    eval_poly(c, x0_x1, y0_y1);
    
    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;
    
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float neubauer_root(in vec4 c, in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;
    
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float neubauer_root(in float c[5], in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;
    
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float neubauer_root(in float c[6], in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y, dx, dy;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // estimate new x using linear interpolation
        x = x0_x1.x - (y0_y1.x * dx) / dy;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = y0_y1.y - y0_y1.x;
    
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

#endif