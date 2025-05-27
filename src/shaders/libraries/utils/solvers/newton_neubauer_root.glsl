
#ifndef NEWTON_NEUBAUER_ROOT
#define NEWTON_NEUBAUER_ROOT

#ifndef NEWTON_NEUBAUER_ITERATIONS
#define NEWTON_NEUBAUER_ITERATIONS 10
#endif
#ifndef POLY_HORNER
#include "../math/poly_horner"
#endif

float newton_neubauer_root(in vec4 c, in vec2 x0_x1)
{
    vec2 y0_y1, d0_d1;
    poly_horner(c, x0_x1, y0_y1, d0_d1);

    float x, y, z, d, dx, dy;
    #pragma unroll
    for (int i = 0; i < NEWTON_NEUBAUER_ITERATIONS; ++i)
    {
        // newtons
        x = x0_x1.x - y0_y1.x / d0_d1.y;

        // neubauer
        dx = x0_x1.y - x0_x1.x;
        dy = d0_d1.y - d0_d1.x;
        z = x0_x1.x - (y0_y1.x * dx) / dy;

        // chose newton if inside, bisection otherwise
        x = (x0_x1.x < x && x < x0_x1.y) ? x : z;

        // compute polynomial
        poly_horner(c, x, y, d);

        // compute sign change
        bool b = (y0_y1.x < 0) != (y < 0);

        // update bracket
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
        d0_d1 = b ? vec2(d0_d1.x, d) : vec2(d, d0_d1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = d0_d1.y - d0_d1.x;
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float newton_neubauer_root(in float c[5], in vec2 x0_x1)
{
    vec2 y0_y1, d0_d1;
    poly_horner(c, x0_x1, y0_y1, d0_d1);

    float x, y, z, d, dx, dy;
    #pragma unroll
    for (int i = 0; i < NEWTON_NEUBAUER_ITERATIONS; ++i)
    {
        // newtons
        x = x0_x1.x - y0_y1.x / d0_d1.y;

        // neubauer
        dx = x0_x1.y - x0_x1.x;
        dy = d0_d1.y - d0_d1.x;
        z = x0_x1.x - (y0_y1.x * dx) / dy;

        // chose newton if inside, bisection otherwise
        x = (x0_x1.x < x && x < x0_x1.y) ? x : z;

        // compute polynomial
        poly_horner(c, x, y, d);

        // compute sign change
        bool b = (y0_y1.x < 0) != (y < 0);

        // update bracket
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
        d0_d1 = b ? vec2(d0_d1.x, d) : vec2(d, d0_d1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = d0_d1.y - d0_d1.x;
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

float newton_neubauer_root(in float c[6], in vec2 x0_x1)
{
    vec2 y0_y1, d0_d1;
    poly_horner(c, x0_x1, y0_y1, d0_d1);

    float x, y, z, d, dx, dy;
    #pragma unroll
    for (int i = 0; i < NEWTON_NEUBAUER_ITERATIONS; ++i)
    {
        // newtons
        x = x0_x1.x - y0_y1.x / d0_d1.y;

        // neubauer
        dx = x0_x1.y - x0_x1.x;
        dy = d0_d1.y - d0_d1.x;
        z = x0_x1.x - (y0_y1.x * dx) / dy;

        // chose newton if inside, bisection otherwise
        x = (x0_x1.x < x && x < x0_x1.y) ? x : z;

        // compute polynomial
        poly_horner(c, x, y, d);

        // compute sign change
        bool b = (y0_y1.x < 0) != (y < 0);

        // update bracket
        x0_x1 = b ? vec2(x0_x1.x, x) : vec2(x, x0_x1.y);
        y0_y1 = b ? vec2(y0_y1.x, y) : vec2(y, y0_y1.y);
        d0_d1 = b ? vec2(d0_d1.x, d) : vec2(d, d0_d1.y);
    }

    // final neubauer
    dx = x0_x1.y - x0_x1.x;
    dy = d0_d1.y - d0_d1.x;
    return x0_x1.x - (y0_y1.x * dx) / dy;
}

#endif