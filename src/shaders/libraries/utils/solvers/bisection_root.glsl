
#ifndef BISECTION_ROOT
#define BISECTION_ROOT

#ifndef BISECTION_ITERATIONS
#define BISECTION_ITERATIONS 10
#endif
#ifndef EVAL_POLY
#include "../math/eval_poly"
#endif

float bisection_root(in vec4 c, in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (x0_x1.x + x0_x1.y) * 0.5;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return (x0_x1.x + x0_x1.y) * 0.5;
}

float bisection_root(in float c[5], in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (x0_x1.x + x0_x1.y) * 0.5;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return (x0_x1.x + x0_x1.y) * 0.5;
}

float bisection_root(in float c[6], in vec2 x0_x1, in vec2 y0_y1)
{
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (x0_x1.x + x0_x1.y) * 0.5;

        // evaluate new y using honers method
        eval_poly(c, x, y);

        // determine if the root is in the left or right sub-interval
        bool b = (y < 0.0) == (y0_y1.y < 0.0);

        // narrow the interval based on updated values
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return (x0_x1.x + x0_x1.y) * 0.5;
}

#endif