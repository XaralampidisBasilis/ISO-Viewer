
#ifndef BISECTION_ROOT
#define BISECTION_ROOT

#ifndef BISECTION_ITERATIONS
#define BISECTION_ITERATIONS 10
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

float bisection_root(in vec3 c, in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (xa_xb.x + xa_xb.y) * 0.5;

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

float bisection_root(in vec4 c, in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (xa_xb.x + xa_xb.y) * 0.5;

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

float bisection_root(in float c[5], in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (xa_xb.x + xa_xb.y) * 0.5;

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

float bisection_root(in float c[6], in vec2 xa_xb, in vec2 ya_yb)
{
    bool u;
    float x, y;

    #pragma unroll
    for (int i = 0; i < BISECTION_ITERATIONS; ++i)
    {
        // estimate new x using mean
        x = (xa_xb.x + xa_xb.y) * 0.5;

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