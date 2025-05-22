#ifndef POLY_HORNER
#define POLY_HORNER

#ifndef POLY_HORNER_MAX_DEGREE
#define POLY_HORNER_MAX_DEGREE 6
#endif

#ifndef POLY_HORNER_MAX_DERIVATIVE
#define POLY_HORNER_MAX_DERIVATIVE 5
#endif

// Evaluate polynomial and derivatives using Horner's method
// Coefficients are provided in ascending order:
//  p(t) = c0 + c1 t + c2 t^2 + ... + cn t^n

// linear 
void poly_horner(in vec2 c, in float t, out float f) 
{
    f = c.x + c.y * t;        // c0 + c1*t
}
void poly_horner(in vec2 c, in vec2 t, out vec2 f) 
{
    f = c.x + c.y * t;
}
void poly_horner(in vec2 c, in vec3 t, out vec3 f) 
{
    f = c.x + c.y * t;
}
void poly_horner(in vec2 c, in vec4 t, out vec4 f) 
{
    f = c.x + c.y * t;
}

// quadratic
void poly_horner(in vec3 c, in float t, out float f) 
{
    float a1 = c.y + c.z * t; // c1 + c2*t
    f = c.x + a1 * t;         // c0 + (c1 + c2*t) * t = c0 + c1*t + c2*t^2
}
void poly_horner(in vec3 c, in vec2 t, out vec2 f) 
{
    vec2 a1 = c.y + c.z * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec3 c, in vec3 t, out vec3 f) 
{
    vec3 a1 = c.y + c.z * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec3 c, in vec4 t, out vec4 f) 
{
    vec4 a1 = c.y + c.z * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec3 c, in float t, out float f, out float f1) 
{
    float a1 = c.y + c.z * t; // c1 + c2*t
    f  = c.x + a1 * t;        // c0 + (c1 + c2*t) * t = c0 + c1*t + c2*t^2

    f1 = a1 + c.z * t;        // (c1 + c2*t) + c2*t = c1 + 2*c2*t
}
void poly_horner(in vec3 c, in vec2 t, out vec2 f, out vec2 f1) 
{
    vec2 a1 = c.y + c.z * t;
    f  = c.x + a1 * t;
    f1 = a1 + c.z * t;
}
void poly_horner(in vec3 c, in vec3 t, out vec3 f, out vec3 f1) 
{
    vec3 a1 = c.y + c.z * t;
    f  = c.x + a1 * t;
    f1 = a1 + c.z * t;
}
void poly_horner(in vec3 c, in vec4 t, out vec4 f, out vec4 f1) 
{
    vec4 a1 = c.y + c.z * t;
    f  = c.x + a1 * t;
    f1 = a1 + c.z * t;
}

// cubic
void poly_horner(in vec4 c, in float t, out float f) 
{
    float a2 = c.z + c.w * t; // c2 + c3*t
    float a1 = c.y + a2 * t;  // c1 + (c2 + c3*t) * t = c1 + c2*t + c3*t^2 
    f = c.x + a1 * t;         // c0 + (c1 + c2*t + c3*t^2) * t = c0 + c1*t + c2*t^2 + c3*t^3
}
void poly_horner(in vec4 c, in vec2 t, out vec2 f) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec4 c, in vec3 t, out vec3 f) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec4 c, in vec4 t, out vec4 f) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    f = c.x + a1 * t;
}
void poly_horner(in vec4 c, in float t, out float f, out float f1) 
{
    float a2 = c.z + c.w * t; // c2 + c3*t
    float a1 = c.y + a2 * t;  // c1 + (c2 + c3*t) * t = c1 + c2*t + c3*t^2 
    f = c.x + a1 * t;         // c0 + (c1 + c2*t + c3*t^2) * t = c0 + c1*t + c2*t^2 + c3*t^3

    float b2 = a2 + c.w * t;  // (c2 + c3*t) + c3*t = c2 + 2*c3*t
    f1 = a1 + b2 * t;         // (c1 + c2*t + c3*t^2) + (c2 + 2*c3*t) * t = c1 + 2*c2*t + 3*c3*t^2
}
void poly_horner(in vec4 c, in vec2 t, out vec2 f, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
}
void poly_horner(in vec4 c, in vec3 t, out vec3 f, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
}
void poly_horner(in vec4 c, in vec4 t, out vec4 f, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
}
void poly_horner(in vec4 c, in float t, out float f, out float f1, out float f2) 
{
    float a2 = c.z + c.w * t; // c2 + c3*t
    float a1 = c.y + a2 * t;  // c1 + (c2 + c3*t) * t = c1 + c2*t + c3*t^2 
    f = c.x + a1 * t;         // c0 + (c1 + c2*t + c3*t^2) * t = c0 + c1*t + c2*t^2 + c3*t^3

    float b2 = a2 + c.w * t;  // (c2 + c3*t) + c3*t = c2 + 2*c3*t
    f1 = a1 + b2 * t;         // (c1 + c2*t + c3*t^2) + (c2 + 2*c3*t) * t = c1 + 2*c2*t + 3*c3*t^2
    
    float b1 = b2 + c.w * t;  // (c2 + 2*c3*t) + c3*t = c2 + 3*c3*t
    f2 = b1 * 2.0;            // (c2 + 3*c3*t) * 2.0 = 2*c2 + 6*c3*t
}
void poly_horner(in vec4 c, in vec2 t, out vec2 f, out vec2 f1, out vec2 f2) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;

    vec2 b1 = b2 + c.w * t;
    f2 = b1 * 2.0;
}
void poly_horner(in vec4 c, in vec3 t, out vec3 f, out vec3 f1, out vec3 f2) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;

    vec3 b1 = b2 + c.w * t;
    f2 = b1 * 2.0;
}
void poly_horner(in vec4 c, in vec4 t, out vec4 f, out vec4 f1, out vec4 f2) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;

    vec4 b1 = b2 + c.w * t;
    f2 = b1 * 2.0;
}

// quartic
void poly_horner(in float c[5], in float t, out float f) 
{
    f = c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[5], in vec2 t, out vec2 f) 
{
    f = vec2(c[4]);
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[5], in vec3 t, out vec3 f) 
{
    f = vec3(c[4]);
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[5], in vec4 t, out vec4 f) 
{
    f = vec4(c[4]);
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[5], in float t, out float f, out float f1) 
{
    f1 = 0.0;
    f  = c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[5], in vec2 t, out vec2 f, out vec2 f1) 
{
    f1 = vec2(0.0);
    f  = vec2(c[4]);
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[5], in vec3 t, out vec3 f, out vec3 f1) 
{
    f1 = vec3(0.0);
    f  = vec3(c[4]);
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[5], in vec4 t, out vec4 f, out vec4 f1) 
{
    f1 = vec4(0.0);
    f  = vec4(c[4]);
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}

// quintic 
void poly_horner(in float c[6], in float t, out float f) 
{
    f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[6], in vec2 t, out vec2 f) 
{
    f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[6], in vec3 t, out vec3 f) 
{
    f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[6], in vec4 t, out vec4 f) 
{
    f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
}
void poly_horner(in float c[6], in float t, out float f, out float f1) 
{
    f1 = 0.0;
    f  = c[5];
    f1 = f1 * t + f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[6], in vec2 t, out vec2 f, out vec2 f1) 
{
    f1 = vec2(0.0);
    f  = vec2(c[5]);
    f1 = f1 * t + f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[6], in vec3 t, out vec3 f, out vec3 f1) 
{
    f1 = vec3(0.0);
    f  = vec3(c[5]);
    f1 = f1 * t + f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}
void poly_horner(in float c[6], in vec4 t, out vec4 f, out vec4 f1) 
{
    f1 = vec4(0.0);
    f  = vec4(c[5]);
    f1 = f1 * t + f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
}

// general polynomial

void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in float t, out float f) 
{    
    f = c[POLY_HORNER_MAX_DEGREE];

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec2 t, out vec2 f) 
{    
    f = vec2(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec3 t, out vec3 f) 
{    
    f = vec3(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec4 t, out vec4 f) 
{    
    f = vec4(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in float t, out float f, out float f1)
{
    f1 = 0.0;
    f = c[POLY_HORNER_MAX_DEGREE];

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f1 = f1 * t + f;
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec2 t, out vec2 f, out vec2 f1)
{
    f1 = vec2(0.0);
    f = vec2(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec3 t, out vec3 f, out vec3 f1)
{
    f1 = vec3(0.0);
    f = vec3(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec4 t, out vec4 f, out vec4 f1)
{
    f1 = vec4(0.0);
    f = vec4(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in float t, out float f, out float f1, out float f2)
{
    f2 = 0.0; 
    f1 = 0.0;
    f = c[POLY_HORNER_MAX_DEGREE];

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f2 = f2 * t + 2.0 * f1;
        f1 = f1 * t + f;
        f = f * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec2 t, out vec2 f, out vec2 f1, out vec2 f2)
{
    f2 = vec2(0.0); 
    f1 = vec2(0.0);
    f  = vec2(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f2 = f2 * t + 2.0 * f1;
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec3 t, out vec3 f, out vec3 f1, out vec3 f2)
{
    f2 = vec3(0.0); 
    f1 = vec3(0.0);
    f  = vec3(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f2 = f2 * t + 2.0 * f1;
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in vec4 t, out vec4 f, out vec4 f1, out vec4 f2)
{
    f2 = vec4(0.0); 
    f1 = vec4(0.0);
    f  = vec4(c[POLY_HORNER_MAX_DEGREE]);

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        f2 = f2 * t + 2.0 * f1;
        f1 = f1 * t + f;
        f  = f  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}
void poly_horner(in float c[POLY_HORNER_MAX_DEGREE + 1], in float t, out float D[POLY_HORNER_MAX_DERIVATIVE + 1])  // D[0] = f, D[1] = f1, ..., D[d] = fd
{
    for (int d = POLY_HORNER_MAX_DERIVATIVE; d >= 1; --d) 
    {
        D[d] = 0.0;
    }
    D[0] = c[POLY_HORNER_MAX_DEGREE];

    #pragma unroll_loop_start
    for (int i = 0; i < POLY_HORNER_MAX_DEGREE; i++) 
    {
        for (int d = POLY_HORNER_MAX_DERIVATIVE; d >= 1; --d) 
        {
            D[d] = D[d] * t + float(d) * D[d - 1];
        }
        D[0] = D[0]  * t + c[POLY_HORNER_MAX_DEGREE - 1 - i];
    }
    #pragma unroll_loop_end
}

#endif
