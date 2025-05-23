
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

float neubauer_root(in vec3 c, in vec2 x0_x1, in vec2 y0_y1)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = x0_x1.x - y0_y1.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * y0_y1.x <= 0.0;

        // narrow the interval based on updated values
        x0_x1 = u ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = u ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return x;
}

float neubauer_root(in vec4 c, in vec2 x0_x1, in vec2 y0_y1)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = x0_x1.x - y0_y1.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * y0_y1.x <= 0.0;

        // narrow the interval based on updated values
        x0_x1 = u ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = u ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return x;
}

float neubauer_root(in float c[5], in vec2 x0_x1, in vec2 y0_y1)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = x0_x1.x - y0_y1.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * y0_y1.x <= 0.0;

        // narrow the interval based on updated values
        x0_x1 = u ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = u ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return x;
}

float neubauer_root(in float c[6], in vec2 x0_x1, in vec2 y0_y1)
{
    bool u;
    float x, y, dx, dy, inv_m;

    #pragma unroll
    for (int i = 0; i < NEUBAUER_ITERATIONS; ++i)
    {
        // compute end point differences
        dx = x0_x1.y - x0_x1.x;
        dy = y0_y1.y - y0_y1.x;

        // compute safeguarded slope 
        inv_m = (abs(dy) > MICRO_TOLERANCE) ? dx / dy : 0.0;    

        // estimate new x using linear interpolation
        x = x0_x1.x - y0_y1.x * inv_m;

        // evaluate new y using honers method
        poly_horner(c, x, y);

        // determine if the root is in the left or right sub-interval
        u = y * y0_y1.x <= 0.0;

        // narrow the interval based on updated values
        x0_x1 = u ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = u ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
    }

    return x;
}

#endif