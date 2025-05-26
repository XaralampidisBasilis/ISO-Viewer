
#ifndef DEGENERATE_ROOTS
#define DEGENERATE_ROOTS

#ifndef LINEAR_ROOT
#include "./linear_root"
#endif
#ifndef QUADRATIC_ROOTS
#include "./quadratic_roots"
#endif
#ifndef CUBIC_ROOTS
#include "./cubic_roots"
#endif
#ifndef QUARTIC_ROOTS
#include "./quartic_roots"
#endif
#ifndef MICRO_TOLERANCE
#define MICRO_TOLERANCE 1e-6
#endif

// Solves the general linear equation: c0 + c1*x^1 = 0
// with degenerate cases

float degenerate_roots(in vec2 c, in float x0)
{
    // solutions
    if (abs(c.y) > MICRO_TOLERANCE)
    {
        return linear_root(c);
    }

    return x0;
}

// Solves the general quadratic equation: c0 + c1*x^1 + c2*x^2 = 0
// We include degenerate cases
// x0 is the fallback root

vec2 degenerate_roots(in vec3 c, in float x0)
{
    // solutions
    if (abs(c.z) > MICRO_TOLERANCE)
    {
        return quadratic_roots(c, x0);
    }
    if (abs(c.y) > MICRO_TOLERANCE)
    {
        return vec2(linear_root(c.xy), x0);
    }
    
    return vec2(x0);
}

// Solve cubic equation c0 + c1x^1 + c2x^2 + c3x^3 = 0 
// including degenerate cases

vec3 degenerate_roots(in vec4 c, in float x0)
{
    // solutions
    if (abs(c.w) > MICRO_TOLERANCE)
    {
        return cubic_roots(c, x0);
    }
    if (abs(c.z) > MICRO_TOLERANCE)
    {
        return vec3(quadratic_roots(c.xyz, x0), x0);
    }
    if (abs(c.y) > MICRO_TOLERANCE)
    {
        return vec3(linear_root(c.xy), vec2(x0));
    }
    
    return vec3(x0);
}

// Solve quartic equation c0 + c1x^1 + c2x^2 + c3x^3 + c4x^4 = 0 
// including degenerate cases

vec4 degenerate_roots(in float c[5], in float x0)
{
    // solutions
    if (abs(c[4]) > MICRO_TOLERANCE)
    {
        return quartic_roots(c, x0);
    }
    if (abs(c[3]) > MICRO_TOLERANCE)
    {
        return vec4(cubic_roots(vec4(c[0], c[1], c[2], c[3]), x0), x0);
    }
    if (abs(c[2]) > MICRO_TOLERANCE)
    {
        return vec4(quadratic_roots(vec3(c[0], c[1], c[2]), x0), vec2(x0));
    }
    if (abs(c[1]) > MICRO_TOLERANCE)
    {
        return vec4(linear_root(vec2(c[0], c[1])), vec3(x0));
    }
    
    return vec4(x0);
}

float degenerate_roots_2(in vec2 c, in float x0)
{
    // check if linear equation
    bool is_line = abs(c.y) > MICRO_TOLERANCE;

    // compute linear root
    float x1 = linear_root(c);  

    // solution
    return (is_line) ? x1 : x0;
}


vec2 degenerate_roots_2(in vec3 c, in float x0)
{
    // compute case flags
    bool is_quad = abs(c.z) > MICRO_TOLERANCE;
    bool is_line = abs(c.y) > MICRO_TOLERANCE;

    // compute roots for each case
    vec2  x2 = quadratic_roots(c, x0);
    float x1 = linear_root(c.xy);

    // branchless solution 
    float r1 = (is_line) ? x1 : x0;
    vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);

    return r2;
}

vec3 degenerate_roots_2(in vec4 c, in float x0)
{
    // compute case flags
    bool is_cube = abs(c.w) > MICRO_TOLERANCE;
    bool is_quad = abs(c.z) > MICRO_TOLERANCE;
    bool is_line = abs(c.y) > MICRO_TOLERANCE;

    // compute case roots
    vec3  x3 = cubic_roots(c, x0);
    vec2  x2 = quadratic_roots(c.xyz, x0);
    float x1 = linear_root(c.xy);

    // branchless solution 
    float r1 = (is_line) ? x1 : x0;
    vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);
    vec3  r3 = (is_cube) ? x3 : vec3(r2, x0);

    return r3;
}

vec4 degenerate_roots_2(in float c[5], in float x0)
{
    // compute case flags
    bool is_quar = abs(c[4]) > MICRO_TOLERANCE;
    bool is_cube = abs(c[3]) > MICRO_TOLERANCE;
    bool is_quad = abs(c[2]) > MICRO_TOLERANCE;
    bool is_line = abs(c[1]) > MICRO_TOLERANCE;

    // compute case roots
    vec4  x4 = quartic_roots(c, x0);
    vec3  x3 = cubic_roots(vec4(c[0], c[1], c[2], c[3]), x0);
    vec2  x2 = quadratic_roots(vec3(c[0], c[1], c[2]), x0);
    float x1 = linear_root(vec2(c[0], c[1]));

    // branchless solution 
    float r1 = (is_line) ? x1 : x0;
    vec2  r2 = (is_quad) ? x2 : vec2(r1, x0);
    vec3  r3 = (is_cube) ? x3 : vec3(r2, x0);
    vec4  r4 = (is_quar) ? x4 : vec4(r3, x0);

    return r4;
}

#endif