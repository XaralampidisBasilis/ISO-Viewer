precision highp float;
precision highp int;

in vec3 v_position;
in vec3 v_camera_position;
in vec3 v_camera_direction;
in vec3 v_ray_direction;

out vec4 fragColor;

#ifndef SORT
#define SORT

void sort(inout float a, inout float b) 
{
    float x = min(a, b); 
    float y = max(a, b); 
    a = x; 
    b = y;
}

void sort(inout float a, inout float b, inout float c) 
{
    sort(a, b);
    sort(b, c);
    sort(a, b);
}

void sort(inout float a, inout float b, inout float c, inout float d) 
{
    sort(a, b);
    sort(c, d);
    sort(a, c);
    sort(b, d);
    sort(b, c);
}

void sort(inout vec2 v)
{
    float x = min(v.x, v.y); 
    float y = max(v.x, v.y); 
    v.x = x; 
    v.y = y;
}

void sort(inout vec3 v) 
{
    sort(v.xy);
    sort(v.yz);
    sort(v.xy);
}

void sort(inout vec4 v) 
{
    sort(v.xy);
    sort(v.zw);
    sort(v.xz);
    sort(v.yw);
    sort(v.yz);
}

#endif 
#ifndef SWAP
#define SWAP

void swap(inout float a, inout float b) { float t = a; a = b; b = t; }
void swap(inout vec2  a, inout vec2  b) { vec2  t = a; a = b; b = t; }
void swap(inout vec3  a, inout vec3  b) { vec3  t = a; a = b; b = t; }
void swap(inout vec4  a, inout vec4  b) { vec4  t = a; a = b; b = t; }

#endif 
#ifndef CBRT
#define CBRT

float cbrt(in float v) 
{ 
    return sign(v) * pow(
        abs(v), 1.0/3.0
    ); 
}

vec2  cbrt(in vec2 v) 
{ 
    return sign(v) * vec2(
        pow(abs(v.x), 1.0/3.0), 
        pow(abs(v.y), 1.0/3.0)
    ); 
}

vec3  cbrt(in vec3 v) 
{ 
    return sign(v) * vec3(
        pow(abs(v.x), 1.0/3.0), 
        pow(abs(v.y), 1.0/3.0),
        pow(abs(v.z), 1.0/3.0)
    ); 
}

#endif 
#ifndef DIFF
#define DIFF

float diff(in vec2 v) { return v.y   - v.x;   }
vec2  diff(in vec3 v) { return v.yz  - v.xy;  }
vec3  diff(in vec4 v) { return v.yzw - v.xyz; }

#endif 
#ifndef MAP
#define MAP

float map(in float a, in float b, in float x) {return (x - a) / (b - a);}
vec2  map(in float a, in float b, in vec2  x) {return (x - a) / (b - a);}
vec3  map(in float a, in float b, in vec3  x) {return (x - a) / (b - a);}
vec4  map(in float a, in float b, in vec4  x) {return (x - a) / (b - a);}
vec2  map(in vec2  a, in vec2  b, in vec2  x) {return (x - a) / (b - a);}
vec3  map(in vec3  a, in vec3  b, in vec3  x) {return (x - a) / (b - a);}
vec4  map(in vec4  a, in vec4  b, in vec4  x) {return (x - a) / (b - a);}

#endif 
#ifndef MEAN
#define MEAN

float mean(in vec2 v) { return dot(v, vec2(1.0)) / 2.0; }
float mean(in vec3 v) { return dot(v, vec3(1.0)) / 3.0; }
float mean(in vec4 v) { return dot(v, vec4(1.0)) / 4.0; }

float mean(in float a, in float b) { return (a + b) / 2.0; }
vec2  mean(in vec2  a, in vec2  b) { return (a + b) / 2.0; }
vec3  mean(in vec3  a, in vec3  b) { return (a + b) / 2.0; }
vec4  mean(in vec4  a, in vec4  b) { return (a + b) / 2.0; }

float mean(in float a, in float b, in float c) { return (a + b + c) / 3.0; }
vec2  mean(in vec2  a, in vec2  b, in vec2  c) { return (a + b + c) / 3.0; }
vec3  mean(in vec3  a, in vec3  b, in vec3  c) { return (a + b + c) / 3.0; }
vec4  mean(in vec4  a, in vec4  b, in vec4  c) { return (a + b + c) / 3.0; }

#endif 
#ifndef MMAX
#define MMAX

float mmax(in float a) { return a; }
float mmax(in float a, in float b) { return max(a, b); }
float mmax(in float a, in float b, in float c) { return max(a, max(b, c)); }
float mmax(in float a, in float b, in float c, in float d) { return max(max(a, b), max(c, d)); }
float mmax(vec2 v) { return max(v.x, v.y); }
float mmax(vec3 v) { return mmax(v.x, v.y, v.z); }
float mmax(vec4 v) { return mmax(v.x, v.y, v.z, v.w); }
float mmax(float v[5]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    return r;
}
float mmax(float v[6]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    r = max(r, v[5]);
    return r;
}

#endif 
#ifndef MMIN
#define MMIN

float mmin(in float a) { return a; }
float mmin(in float a,in float b) { return min(a, b); }
float mmin(in float a,in float b, in float c) { return min(a, min(b, c)); }
float mmin(in float a,in float b, in float c, in float d) { return min(min(a,b), min(c, d)); }

float mmin(vec2 v) { return min(v.x, v.y); }
float mmin(vec3 v) { return mmin(v.x, v.y, v.z); }
float mmin(vec4 v) { return mmin(v.x, v.y, v.z, v.w); }
float mmin(float v[5]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    return r;
}
float mmin(float v[6]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    r = min(r, v[5]);
    return r;
}

#endif 
#ifndef MMIX
#define MMIX

int    mmix(in int    a, in int    b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in int    pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in int    pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in ivec2  pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in ivec3  pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in ivec4  pct) { return a + (b - a) * pct; }

float mmix(in float a, in float b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in float pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in float pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in vec2  pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in vec3  pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in vec4  pct) { return mix(a, b, pct); }

float mmix(in float a, in float b, in float c, in float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, vec2 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, vec3 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, vec4 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

#endif 
#ifndef MMIX2
#define MMIX2

#ifndef MMIX
#ifndef MMIX
#define MMIX

int    mmix(in int    a, in int    b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in int    pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in int    pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in ivec2  pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in ivec3  pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in ivec4  pct) { return a + (b - a) * pct; }

float mmix(in float a, in float b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in float pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in float pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in vec2  pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in vec3  pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in vec4  pct) { return mix(a, b, pct); }

float mmix(in float a, in float b, in float c, in float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, vec2 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, vec3 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, vec4 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

#endif
#endif

float mmix2(float a00, float a10, float a01, float a11, vec2 pct) 
{
    float a0 = mix(a00, a10, pct.x);
    float a1 = mix(a01, a11, pct.x);
    return mix(a0, a1, pct.y);
}

vec2 mmix2(vec2 a00, vec2 a10, vec2 a01, vec2 a11, vec2 pct) 
{
    vec2 a0 = mix(a00, a10, pct.x);
    vec2 a1 = mix(a01, a11, pct.x);
    return mix(a0, a1, pct.y);
}

vec3 mmix2(vec3 a00, vec3 a10, vec3 a01, vec3 a11, vec2 pct) 
{
    vec3 a0 = mix(a00, a10, pct.x);
    vec3 a1 = mix(a01, a11, pct.x);
    return mix(a0, a1, pct.y);
}

vec4 mmix2(vec4 a00, vec4 a10, vec4 a01, vec4 a11, vec2 pct) 
{
    vec4 a0 = mix(a00, a10, pct.x);
    vec4 a1 = mix(a01, a11, pct.x);
    return mix(a0, a1, pct.y);
}

float mmix2(float a00, float a10, float a20, float a01, float a11, float a21, float a02, float a12, float a22, vec2 pct) 
{
    float a0 = mmix(a00, a10, a20, pct.x);
    float a1 = mmix(a01, a11, a21, pct.x);
    float a2 = mmix(a02, a12, a22, pct.x);
    return mmix(a0, a1, a2, pct.y);
}
vec2 mmix2(vec2 a00, vec2 a10, vec2 a20, vec2 a01, vec2 a11, vec2 a21, vec2 a02, vec2 a12, vec2 a22, vec2 pct) 
{
    vec2 a0 = mmix(a00, a10, a20, pct.x);
    vec2 a1 = mmix(a01, a11, a21, pct.x);
    vec2 a2 = mmix(a02, a12, a22, pct.x);
    return mmix(a0, a1, a2, pct.y);
}
vec3 mmix2(vec3 a00, vec3 a10, vec3 a20, vec3 a01, vec3 a11, vec3 a21, vec3 a02, vec3 a12, vec3 a22, vec2 pct) 
{
    vec3 a0 = mmix(a00, a10, a20, pct.x);
    vec3 a1 = mmix(a01, a11, a21, pct.x);
    vec3 a2 = mmix(a02, a12, a22, pct.x);
    return mmix(a0, a1, a2, pct.y);
}
vec4 mmix2(vec4 a00, vec4 a10, vec4 a20, vec4 a01, vec4 a11, vec4 a21, vec4 a02, vec4 a12, vec4 a22, vec2 pct) 
{
    vec4 a0 = mmix(a00, a10, a20, pct.x);
    vec4 a1 = mmix(a01, a11, a21, pct.x);
    vec4 a2 = mmix(a02, a12, a22, pct.x);
    return mmix(a0, a1, a2, pct.y);
}

#endif 
#ifndef SSIGN
#define SSIGN

float ssign(float v) { return step(0.0, v) * 2.0 - 1.0; }
vec2  ssign(vec2  v) { return step(0.0, v) * 2.0 - 1.0; }
vec3  ssign(vec3  v) { return step(0.0, v) * 2.0 - 1.0; }
vec4  ssign(vec4  v) { return step(0.0, v) * 2.0 - 1.0; }

#endif 
#ifndef SUM
#define SUM

float sum(in vec2 v) { return dot(v, vec2(1.0)); }
float sum(in vec3 v) { return dot(v, vec3(1.0)); }
float sum(in vec4 v) { return dot(v, vec4(1.0)); }

#endif
#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef EVAL_POLY_MAX_DEGREE
#define EVAL_POLY_MAX_DEGREE 6
#endif

#ifndef EVAL_POLY_MAX_DERIVATIVE
#define EVAL_POLY_MAX_DERIVATIVE 5
#endif

float eval_poly(in vec4 c, in float t) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;
    return f;
}
float eval_poly(in vec4 c, in float t, out float f1) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         

    float b2 = a2 + c.w * t;  
    f1 = a1 + b2 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}

float eval_poly(in float c[6], in float t) 
{
    float f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t) 
{
    vec2 f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t) 
{
    vec3 f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t) 
{
    vec4 f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
float eval_poly(in float c[6], in float t, out float f1) 
{
    float f  = c[5];
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t, out vec2 f1) 
{
    vec2 f  = vec2(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t, out vec3 f1) 
{
    vec3 f = vec3(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t, out vec4 f1) 
{
    vec4 f = vec4(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}

    

    

    

    

#endif
#ifndef SIGN_CHANGE
#define SIGN_CHANGE

bool sign_change(float a, float b) 
{
    return (a < 0.0) != (b < 0.0);
}

bool sign_change(vec2 v) 
{
    return (v.x < 0.0) != (v.y < 0.0);
}

bool sign_change(vec3 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0);
}

bool sign_change(vec4 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0) ||
           (v.z < 0.0) != (v.w < 0.0);
}

bool sign_change(float v[5]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0);
}

bool sign_change(float v[6]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0) ||
           (v[4] < 0.0) != (v[5] < 0.0);
}

#endif
#ifndef SIGN_CHANGES
#define SIGN_CHANGES

int sign_changes(float a, float b) 
{
    return int((a < 0.0) != (b < 0.0));
}

int sign_changes(vec2 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0));
}

int sign_changes(vec3 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0)) +
           int((v.y < 0.0) != (v.z < 0.0));
}

int sign_changes(vec4 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0)) +
           int((v.y < 0.0) != (v.z < 0.0)) +
           int((v.z < 0.0) != (v.w < 0.0));
}

int sign_changes(float v[5]) 
{
    return int((v[0] < 0.0) != (v[1] < 0.0)) +
           int((v[1] < 0.0) != (v[2] < 0.0)) +
           int((v[2] < 0.0) != (v[3] < 0.0)) +
           int((v[3] < 0.0) != (v[4] < 0.0));
}

int sign_changes(float v[6]) 
{
    return int((v[0] < 0.0) != (v[1] < 0.0)) +
           int((v[1] < 0.0) != (v[2] < 0.0)) +
           int((v[2] < 0.0) != (v[3] < 0.0)) +
           int((v[3] < 0.0) != (v[4] < 0.0)) +
           int((v[4] < 0.0) != (v[5] < 0.0));
}

#endif
#ifndef EVAL_POLY_SIGN_CHANGE
#define EVAL_POLY_SIGN_CHANGE

#ifndef EVAL_POLY
#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef EVAL_POLY_MAX_DEGREE
#define EVAL_POLY_MAX_DEGREE 6
#endif

#ifndef EVAL_POLY_MAX_DERIVATIVE
#define EVAL_POLY_MAX_DERIVATIVE 5
#endif

float eval_poly(in vec4 c, in float t) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;
    return f;
}
float eval_poly(in vec4 c, in float t, out float f1) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         

    float b2 = a2 + c.w * t;  
    f1 = a1 + b2 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}

float eval_poly(in float c[6], in float t) 
{
    float f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t) 
{
    vec2 f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t) 
{
    vec3 f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t) 
{
    vec4 f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
float eval_poly(in float c[6], in float t, out float f1) 
{
    float f  = c[5];
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t, out vec2 f1) 
{
    vec2 f  = vec2(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t, out vec3 f1) 
{
    vec3 f = vec3(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t, out vec4 f1) 
{
    vec4 f = vec4(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}

    

    

    

    

#endif
#endif
#ifndef SIGN_CHANGE
#ifndef SIGN_CHANGE
#define SIGN_CHANGE

bool sign_change(float a, float b) 
{
    return (a < 0.0) != (b < 0.0);
}

bool sign_change(vec2 v) 
{
    return (v.x < 0.0) != (v.y < 0.0);
}

bool sign_change(vec3 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0);
}

bool sign_change(vec4 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0) ||
           (v.z < 0.0) != (v.w < 0.0);
}

bool sign_change(float v[5]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0);
}

bool sign_change(float v[6]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0) ||
           (v[4] < 0.0) != (v[5] < 0.0);
}

#endif
#endif
#ifndef MMIX
#ifndef MMIX
#define MMIX

int    mmix(in int    a, in int    b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in int    pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in int    pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in ivec2  pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in ivec3  pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in ivec4  pct) { return a + (b - a) * pct; }

float mmix(in float a, in float b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in float pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in float pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in vec2  pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in vec3  pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in vec4  pct) { return mix(a, b, pct); }

float mmix(in float a, in float b, in float c, in float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, vec2 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, vec3 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, vec4 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

#endif
#endif

bool eval_poly_sign_change(vec4 coeffs)
{
    const int batches = 3;
    const int samples = batches * 4;
    const float spacing = 1.0 / float(samples - 1);
    const vec4 stride = vec4(spacing * 4.0);

    vec4 points = vec4(0, 1, 2, 3) * spacing;
    vec4 values = eval_poly(coeffs, points);
    bool change = sign_change(values);
    float prev = values.w;

    #pragma unroll
    for (int i = 1; i < batches; ++i) 
    {   
        points += stride;
        values = eval_poly(coeffs, points);
        change = change || sign_change(prev, values.x) || sign_change(values);
        prev = values.w;
    }

    return change;
}

bool eval_poly_sign_change(float[6] coeffs)
{
    const int batches = 4;
    const int samples = batches * 4;
    const float spacing = 1.0 / float(samples - 1);
    const vec4 stride = vec4(spacing * 4.0);

    vec4 points = vec4(0, 1, 2, 3) * spacing;
    vec4 values = eval_poly(coeffs, points);
    bool change = sign_change(values);
    float prev = values.w;

    #pragma unroll
    for (int i = 1; i < batches; ++i) 
    {   
        points += stride;
        values = eval_poly(coeffs, points);
        change = change || sign_change(prev, values.x) || sign_change(values);
        prev = values.w;
    }

    return change;
}

#endif
#ifndef EVAL_POLY_SIGN_CHANGES
#define EVAL_POLY_SIGN_CHANGES

#ifndef EVAL_POLY
#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef EVAL_POLY_MAX_DEGREE
#define EVAL_POLY_MAX_DEGREE 6
#endif

#ifndef EVAL_POLY_MAX_DERIVATIVE
#define EVAL_POLY_MAX_DERIVATIVE 5
#endif

float eval_poly(in vec4 c, in float t) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;
    return f;
}
float eval_poly(in vec4 c, in float t, out float f1) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         

    float b2 = a2 + c.w * t;  
    f1 = a1 + b2 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}

float eval_poly(in float c[6], in float t) 
{
    float f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t) 
{
    vec2 f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t) 
{
    vec3 f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t) 
{
    vec4 f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
float eval_poly(in float c[6], in float t, out float f1) 
{
    float f  = c[5];
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t, out vec2 f1) 
{
    vec2 f  = vec2(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t, out vec3 f1) 
{
    vec3 f = vec3(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t, out vec4 f1) 
{
    vec4 f = vec4(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}

    

    

    

    

#endif
#endif
#ifndef SIGN_CHANGE
#ifndef SIGN_CHANGES
#define SIGN_CHANGES

int sign_changes(float a, float b) 
{
    return int((a < 0.0) != (b < 0.0));
}

int sign_changes(vec2 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0));
}

int sign_changes(vec3 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0)) +
           int((v.y < 0.0) != (v.z < 0.0));
}

int sign_changes(vec4 v) 
{
    return int((v.x < 0.0) != (v.y < 0.0)) +
           int((v.y < 0.0) != (v.z < 0.0)) +
           int((v.z < 0.0) != (v.w < 0.0));
}

int sign_changes(float v[5]) 
{
    return int((v[0] < 0.0) != (v[1] < 0.0)) +
           int((v[1] < 0.0) != (v[2] < 0.0)) +
           int((v[2] < 0.0) != (v[3] < 0.0)) +
           int((v[3] < 0.0) != (v[4] < 0.0));
}

int sign_changes(float v[6]) 
{
    return int((v[0] < 0.0) != (v[1] < 0.0)) +
           int((v[1] < 0.0) != (v[2] < 0.0)) +
           int((v[2] < 0.0) != (v[3] < 0.0)) +
           int((v[3] < 0.0) != (v[4] < 0.0)) +
           int((v[4] < 0.0) != (v[5] < 0.0));
}

#endif
#endif
#ifndef MMIX
#ifndef MMIX
#define MMIX

int    mmix(in int    a, in int    b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in int    pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in int    pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in int    pct) { return a + (b - a) * pct; }
ivec2  mmix(in ivec2  a, in ivec2  b, in ivec2  pct) { return a + (b - a) * pct; }
ivec3  mmix(in ivec3  a, in ivec3  b, in ivec3  pct) { return a + (b - a) * pct; }
ivec4  mmix(in ivec4  a, in ivec4  b, in ivec4  pct) { return a + (b - a) * pct; }

float mmix(in float a, in float b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in float pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in float pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in float pct) { return mix(a, b, pct); }
vec2  mmix(in vec2  a, in vec2  b, in vec2  pct) { return mix(a, b, pct); }
vec3  mmix(in vec3  a, in vec3  b, in vec3  pct) { return mix(a, b, pct); }
vec4  mmix(in vec4  a, in vec4  b, in vec4  pct) { return mix(a, b, pct); }

float mmix(in float a, in float b, in float c, in float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec2 mmix(vec2 a, vec2 b, vec2 c, vec2 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec3 mmix(vec3 a, vec3 b, vec3 c, vec3 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, float pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

vec4 mmix(vec4 a, vec4 b, vec4 c, vec4 pct) {
    return mix(
        mix(a, b, 2. * pct),
        mix(b, c, 2. * (max(pct, .5) - .5)),
        step(.5, pct)
    );
}

#endif
#endif

int eval_poly_sign_changes(vec4 coeffs)
{
    const int batches = 3;
    const int samples = batches * 4;
    const float spacing = 1.0 / float(samples - 1);
    const vec4 stride = vec4(spacing * 4.0);

    vec4 points = vec4(0, 1, 2, 3) * spacing;
    vec4 values = eval_poly(coeffs, points);
    int changes = sign_changes(values);
    float prev_value = values.w;

    #pragma unroll
    for (int i = 1; i < batches; ++i) 
    {   
        points += stride;
        values = eval_poly(coeffs, points);
        changes += sign_changes(prev_value, values.x) + sign_changes(values);
        prev_value = values.w;
    }

    return changes;
}

int eval_poly_sign_changes(float[6] coeffs)
{
    const int batches = 4;
    const int samples = batches * 4;
    const float spacing = 1.0 / float(samples - 1);
    const vec4 stride = vec4(spacing * 4.0);

    vec4 points = vec4(0, 1, 2, 3) * spacing;
    vec4 values = eval_poly(coeffs, points);
    int changes = sign_changes(values);
    float prev_value = values.w;

    #pragma unroll
    for (int i = 1; i < batches; ++i) 
    {   
        points += stride;
        values = eval_poly(coeffs, points);
        changes += sign_changes(prev_value, values.x) + sign_changes(values);
        prev_value = values.w;
    }

    return changes;
}

#endif
#ifndef ABS_L1_NORMALIZATION
#define ABS_L1_NORMALIZATION

vec4 abs_l1_normalization(vec4 v) 
{
    vec4 u = abs(v);
    float s = u.x + u.y + u.z + u.w;   
    return (s > 0.0) ? (u / s) : vec4(0.0);
}

void abs_l1_normalization(in float v[6], out float u[6]) 
{
    float s = 0.0;

    for (int i = 0; i < 6; ++i) 
    {
        u[i] = abs(v[i]);
        s += u[i];
    }

    float inv = (s > 0.0) ? 1.0 / s : 0.0;
    for (int i = 0; i < 6; ++i) 
    {
        u[i] *= inv;
    }
}

#endif
#ifndef CUBIC_ROOTS
#define CUBIC_ROOTS

#ifndef QUADRATIC_ROOTS
#ifndef QUADRATIC_ROOTS
#define QUADRATIC_ROOTS

#ifndef SSIGN
#ifndef SSIGN
#define SSIGN

float ssign(float v) { return step(0.0, v) * 2.0 - 1.0; }
vec2  ssign(vec2  v) { return step(0.0, v) * 2.0 - 1.0; }
vec3  ssign(vec3  v) { return step(0.0, v) * 2.0 - 1.0; }
vec4  ssign(vec4  v) { return step(0.0, v) * 2.0 - 1.0; }

#endif
#endif

vec2 quadratic_roots(in vec3 c)
{
    
    vec2 n = c.xy / c.z;
    n.y /= -2.0;

    
    float d = n.y * n.y - n.x;
    float sqrt_d = sqrt(max(0.0, d));
    float xq = n.y + sqrt_d * ssign(n.y);

    
    return vec2(xq, n.x / xq);
}

vec2 quadratic_roots(in vec3 c, in float xd)
{
    
    vec2 n = c.xy / c.z;
    n.y /= -2.0;

    
    float d = n.y * n.y - n.x;
    float sqrt_d = sqrt(max(0.0, d));
    float xq = n.y + sqrt_d * ssign(n.y);

    
    vec2 x = vec2(xq, n.x / xq);

    
    return (d >= 0.0) ? x : vec2(xd);
}

#endif
#endif
#ifndef EVAL_POLY
#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef EVAL_POLY_MAX_DEGREE
#define EVAL_POLY_MAX_DEGREE 6
#endif

#ifndef EVAL_POLY_MAX_DERIVATIVE
#define EVAL_POLY_MAX_DERIVATIVE 5
#endif

float eval_poly(in vec4 c, in float t) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;
    return f;
}
float eval_poly(in vec4 c, in float t, out float f1) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         

    float b2 = a2 + c.w * t;  
    f1 = a1 + b2 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}

float eval_poly(in float c[6], in float t) 
{
    float f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t) 
{
    vec2 f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t) 
{
    vec3 f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t) 
{
    vec4 f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
float eval_poly(in float c[6], in float t, out float f1) 
{
    float f  = c[5];
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t, out vec2 f1) 
{
    vec2 f  = vec2(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t, out vec3 f1) 
{
    vec3 f = vec3(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t, out vec4 f1) 
{
    vec4 f = vec4(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}

    

    

    

    

#endif
#endif
#ifndef CBRT
#ifndef CBRT
#define CBRT

float cbrt(in float v) 
{ 
    return sign(v) * pow(
        abs(v), 1.0/3.0
    ); 
}

vec2  cbrt(in vec2 v) 
{ 
    return sign(v) * vec2(
        pow(abs(v.x), 1.0/3.0), 
        pow(abs(v.y), 1.0/3.0)
    ); 
}

vec3  cbrt(in vec3 v) 
{ 
    return sign(v) * vec3(
        pow(abs(v.x), 1.0/3.0), 
        pow(abs(v.y), 1.0/3.0),
        pow(abs(v.z), 1.0/3.0)
    ); 
}

#endif
#endif
#ifndef SQRT_3
#define SQRT_3 1.73205080757
#endif
#ifndef NAN
#define NAN uintBitsToFloat(0x7fc00000u)
#endif

vec3 cubic_roots(in vec4 c)
{
    
    bool flip = abs(c.z * c.x) >= abs(c.y * c.w);
    vec3 n = flip ? c.wzy / c.x : c.xyz / c.w;
    n.yz /= 3.0;

    
    vec3 h = vec3(
        n.y - n.z * n.z,                          
        n.x - n.y * n.z,                          
        dot(vec2(n.z, -n.y), n.xy)    
    );
    h.y /= 2.0;

    
    float d = dot(vec2(h.x, -h.y), h.zy); 
    float sqrt_d = sqrt(abs(d));

    
    vec2 r = vec2(h.y - h.x * n.z, h.x);
    
    
    vec3 x1 = vec3(cbrt(-r.x + sqrt_d) + cbrt(-r.x - sqrt_d));

    
    float t = atan(sqrt_d, -r.x) / 3.0;
    mat2 proj = mat2(-1.0, -SQRT_3, -1.0, SQRT_3);

    
    vec2 x2 = vec2(cos(t), sin(t));
    vec3 x3 = vec3(x2 * proj, x2.x * 2.0);

    
    x3 *= sqrt(max(0.0, -r.y)); 

    
    vec3 x = (d > 0.0) ? x3 : x1;
    x = x - n.z;
    x = flip ? 1.0 / x : x;

    
    vec3 y, dydx;
    y = eval_poly(c, x, dydx);
    x -= y / dydx; 
    y = eval_poly(c, x, dydx);
    x -= y / dydx; 

    
    return x;
}

vec3 cubic_roots_2(in vec4 c)
{
    
    vec3 n = c.xyz / c.w;
    n.yz /= 3.0;

    
    vec3 h = vec3(
        n.y - n.z * n.z,                          
        n.x - n.y * n.z,                          
        dot(vec2(n.z, -n.y), n.xy)    
    );
    h.y /= 2.0;

    
    float d = dot(vec2(h.x, -h.y), h.zy); 
    float sqrt_d = sqrt(abs(d));

    
    vec2 r = vec2(h.y - h.x * n.z, h.x);
    
    
    vec3 x1 = vec3(cbrt(-r.x + sqrt_d) + cbrt(-r.x - sqrt_d));

    
    float t = atan(sqrt_d, -r.x) / 3.0;
    mat2 proj = mat2(-1.0, -SQRT_3, -1.0, SQRT_3);

    
    vec2 x2 = vec2(cos(t), sin(t));
    vec3 x3 = vec3(x2 * proj, x2.x * 2.0);

    
    x3 *= sqrt(max(0.0, -r.y)); 

    
    vec3 x = (d > 0.0) ? x3 : x1;
    x = x - n.z;

    
    return x;
}

#endif
#ifndef POLY3_ROOTS
#define POLY3_ROOTS

#define POLY3_NO_INTERSECTION 3.4e38

bool poly3_roots_newton_bisection
(
    out float out_root, 
    out float out_end_value,
    float poly3[4], 
    float begin, 
    float end,
    float begin_value, 
    float error_tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly3[3];
    out_end_value = out_end_value * end + poly3[2];
    out_end_value = out_end_value * end + poly3[1];
    out_end_value = out_end_value * end + poly3[0];

    
    if (begin_value * out_end_value > 0.0) return false;

    
    
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 10; ++i) 
    {
        
        float derivative = poly3[3];
        float value = poly3[3] * current + poly3[2];
        #pragma unroll
        for (int j = 1; j != -1; --j) 
        {
            derivative = derivative * current + value;
            value = value * current + poly3[j];
        }
    
        
        bool right = begin_value * value > 0.0;
        begin = right ? current : begin;
        end = right ? end : current;

        
        float guess = current - value / derivative;

        
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;

        
        bool done = abs(next - current) < error_tolerance;
        current = next;
        if (done) break;
    }

    out_root = current;
    return true;
}

void poly3_roots
(
    out vec4 out_roots, 
    vec4 poly3, 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1.0e-9;

    
    
    
    
    
    float derivative[4];
    derivative[0] = poly3[1];
    derivative[1] = poly3[2] * 2.0;
    derivative[2] = poly3[3] * 3.0;
    derivative[3] = 0.0;

    
    float discriminant = derivative[1] * derivative[1] - 4.0 * derivative[0] * derivative[2];

    if (discriminant >= 0.0) 
    {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = derivative[1] + ((derivative[1] > 0.0) ? sqrt_discriminant : (-sqrt_discriminant));
        float root_0 = clamp(-2.0 * derivative[0] / scaled_root, begin, end);
        float root_1 = clamp(-0.5 * scaled_root / derivative[2], begin, end);
        out_roots[1] = min(root_0, root_1);
        out_roots[2] = max(root_0, root_1);
    }
    else 
    {
        
        out_roots[1] = begin;
        out_roots[2] = begin;
    }

    
    
    out_roots[0] = begin;
    out_roots[3] = end;

    
    
    
    
    
    
    
    

    
    
    
    
    derivative[3] = derivative[2] / 3.0;
    derivative[2] = derivative[1] / 2.0;
    derivative[1] = derivative[0];
    derivative[0] = poly3[0];

    
    float begin_value = derivative[3];
    begin_value = begin_value * begin + derivative[2];
    begin_value = begin_value * begin + derivative[1];
    begin_value = begin_value * begin + derivative[0];

    
    #pragma unroll
    for (int i = 0; i != 3; ++i) 
    {
        float current_begin = out_roots[i];
        float current_end = out_roots[i + 1];

        
        float root;
        if (poly3_roots_newton_bisection(root, begin_value, derivative, current_begin, current_end, begin_value, tolerance))
        {
            out_roots[i] = root;
        }
        else
        {
            out_roots[i] = POLY3_NO_INTERSECTION;
        }
    }
 
    
    out_roots[3] = POLY3_NO_INTERSECTION;
}

#endif
#ifndef POLY5_ROOTS
#define POLY5_ROOTS

#define POLY5_NO_INTERSECTION 3.4e38

bool poly5_roots_newton_bisection
(
    out float out_root, 
    out float out_end_value,
    float poly5[6], 
    float begin, 
    float end,
    float begin_value, 
    float error_tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly5[5];
    out_end_value = out_end_value * end + poly5[4];
    out_end_value = out_end_value * end + poly5[3];
    out_end_value = out_end_value * end + poly5[2];
    out_end_value = out_end_value * end + poly5[1];
    out_end_value = out_end_value * end + poly5[0];

    
    if ((begin_value > 0.0) == (out_end_value > 0.0)) return false;

    
    
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 40; ++i) 
    {
        
        float value = poly5[5] * current + poly5[4];
        float derivative = poly5[5];

        #pragma unroll
        for (int j = 3; j != -1; --j) 
        {
            derivative = derivative * current + value;
            value = value * current + poly5[j];
        }

        
        bool right = begin_value * value > 0.0;
        begin = right ? current : begin;
        end = right ? end : current;

        
        float guess = current - value / derivative;

        
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;

        
        bool done = abs(next - current) < error_tolerance;
        current = next;
        if (done) break;
    }

    out_root = current;
    return true;
}

void poly5_roots
(
    out float out_roots[6], 
    float poly5[6], 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1.0e-9;

    
    
    
    
    
    float derivative[6];
    derivative[0] = poly5[3];        
    derivative[1] = poly5[4] * 4.0;  
    derivative[2] = poly5[5] * 10.0; 
    derivative[3] = 0.0;
    derivative[4] = 0.0;
    derivative[5] = 0.0;

    
    float discriminant = derivative[1] * derivative[1] - 4.0 * derivative[0] * derivative[2];

    if (discriminant >= 0.0) 
    {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = derivative[1] + (derivative[1] > 0.0 ? sqrt_discriminant : -sqrt_discriminant);
        float root_0 = clamp(-2.0 * derivative[0] / scaled_root, begin, end);
        float root_1 = clamp(-0.5 * scaled_root / derivative[2], begin, end);
        out_roots[3] = min(root_0, root_1);
        out_roots[4] = max(root_0, root_1);
    }
    else 
    {
        
        out_roots[3] = begin;
        out_roots[4] = begin;
    }

    
    
    out_roots[0] = begin;
    out_roots[1] = begin;
    out_roots[2] = begin;
    out_roots[5] = end;

    
    
    
    
    
    
    
    
    #pragma no_unroll
    for (int degree = 3; degree != 6; ++degree) 
    {
        
        
        float prev_derivative_order = float(6 - degree);
        derivative[5] = derivative[4] * (prev_derivative_order * (1.0 / 5.0));
        derivative[4] = derivative[3] * (prev_derivative_order * (1.0 / 4.0));
        derivative[3] = derivative[2] * (prev_derivative_order * (1.0 / 3.0));
        derivative[2] = derivative[1] * (prev_derivative_order * (1.0 / 2.0));
        derivative[1] = derivative[0] * (prev_derivative_order * (1.0 / 1.0));
     
        
        
        derivative[0] = (degree == 5) ? poly5[0] : derivative[0];
        derivative[0] = (degree == 4) ? poly5[1] : derivative[0];
        derivative[0] = (degree == 3) ? poly5[2] : derivative[0];

        
        float begin_value = derivative[5];
        begin_value = begin_value * begin + derivative[4];
        begin_value = begin_value * begin + derivative[3];
        begin_value = begin_value * begin + derivative[2];
        begin_value = begin_value * begin + derivative[1];
        begin_value = begin_value * begin + derivative[0];

        
        #pragma unroll
        for (int i = 0; i != 5; ++i) 
        {
            if (i < 5 - degree)
            {
                continue;
            }

            float current_begin = out_roots[i];
            float current_end = out_roots[i + 1];

            
            float root;
            if (poly5_roots_newton_bisection(root, begin_value, derivative, current_begin, current_end, begin_value, tolerance))
            {
                out_roots[i] = root;
            }
            else if (degree < 5)
            {
                
                out_roots[i] = out_roots[i - 1];
            }
            else
            {
                out_roots[i] = POLY5_NO_INTERSECTION;
            }
        }
    }

    
    out_roots[5] = POLY5_NO_INTERSECTION;
}

#endif
#ifndef POLY3_HAS_ROOT
#define POLY3_HAS_ROOT

bool poly3_has_root_sign_change
(
    out float out_end_value,
    float poly3[4], 
    float begin, 
    float end,
    float begin_value
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly3[3];
    out_end_value = out_end_value * end + poly3[2];
    out_end_value = out_end_value * end + poly3[1];
    out_end_value = out_end_value * end + poly3[0];

    
    if (begin_value * out_end_value > 0.0) return false;

    return true;
}

bool poly3_has_root
(
    vec4 poly3, 
    float begin, 
    float end
){

    
    
    vec4 critical_roots = vec4(
        begin,
        begin, 
        begin, 
        end
    );

    
    
    
    
    
    float derivative[4];
    derivative[0] = poly3[1];
    derivative[1] = poly3[2] * 2.0;
    derivative[2] = poly3[3] * 3.0;
    derivative[3] = 0.0;

    
    float discriminant = derivative[1] * derivative[1] - 4.0 * derivative[0] * derivative[2];

    if (discriminant >= 0.0) 
    {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = derivative[1] + ((derivative[1] > 0.0) ? sqrt_discriminant : (-sqrt_discriminant));
        float root_0 = clamp(-2.0 * derivative[0] / scaled_root, begin, end);
        float root_1 = clamp(-0.5 * scaled_root / derivative[2], begin, end);
        critical_roots[1] = min(root_0, root_1);
        critical_roots[2] = max(root_0, root_1);
    }

    
    
    
    
    
    
    
    

    
    
    
    
    derivative[3] = derivative[2] / 3.0;
    derivative[2] = derivative[1] / 2.0;
    derivative[1] = derivative[0];
    derivative[0] = poly3[0];

    
    float begin_value = derivative[3];
    begin_value = begin_value * begin + derivative[2];
    begin_value = begin_value * begin + derivative[1];
    begin_value = begin_value * begin + derivative[0];

    
    if (poly3_has_root_sign_change(begin_value, derivative, critical_roots[0], critical_roots[1], begin_value)) return true;
    if (poly3_has_root_sign_change(begin_value, derivative, critical_roots[1], critical_roots[2], begin_value)) return true;
    if (poly3_has_root_sign_change(begin_value, derivative, critical_roots[2], critical_roots[3], begin_value)) return true;
        

    return false;
}

#endif
#ifndef POLY5_HAS_ROOT
#define POLY5_HAS_ROOT

bool poly5_has_root_bisection(
    out float out_root, 
    out float out_end_value,
    float poly[6], 
    float begin, 
    float end,
    float begin_value, 
    float tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly[5];
    out_end_value = out_end_value * end + poly[4];
    out_end_value = out_end_value * end + poly[3];
    out_end_value = out_end_value * end + poly[2];
    out_end_value = out_end_value * end + poly[1];
    out_end_value = out_end_value * end + poly[0];

    
    if ((begin_value > 0.0) == (out_end_value > 0.0)) return false;

    
    
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 20; ++i) 
    {
        
        float value = poly[5];
        value = value * current + poly[4];
        value = value * current + poly[3];
        value = value * current + poly[2];
        value = value * current + poly[1];
        value = value * current + poly[0];

        
        bool left = (begin_value > 0.0) != (value > 0.0);
        begin = left ? begin : current;
        end = left ? current : end;

        
        current = 0.5 * (begin + end);
    }

    out_root = current;
    return true;
}

bool poly5_has_root_neubauer(
    out float out_root, 
    out float out_end_value,
    float poly[6], 
    float begin, 
    float end,
    float begin_value, 
    float tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    float end_value = poly[5];
    end_value = end_value * end + poly[4];
    end_value = end_value * end + poly[3];
    end_value = end_value * end + poly[2];
    end_value = end_value * end + poly[1];
    end_value = end_value * end + poly[0];
    out_end_value = end_value;

    
    if ((begin_value > 0.0) == (end_value > 0.0)) return false;

    
    
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 10; ++i) 
    {
        
        float value = poly[5];
        value = value * current + poly[4];
        value = value * current + poly[3];
        value = value * current + poly[2];
        value = value * current + poly[1];
        value = value * current + poly[0];

        
        bool left = (begin_value > 0.0) != (value > 0.0);
        begin = left ? begin : current;
        end = left ? current : end;
        begin_value = left ? begin_value : value;
        end_value = left ? value : end_value;

        
        float delta = begin - end;
        float delta_value = begin_value - end_value;    

        
        current = begin - (begin_value * delta) / delta_value;
    }

    out_root = current;
    return true;
}

bool poly5_has_root_newton_bisection(
    out float out_root, 
    out float out_end_value,
    float poly[6], 
    float begin, 
    float end,
    float begin_value, 
    float tolerance
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly[5];
    out_end_value = out_end_value * end + poly[4];
    out_end_value = out_end_value * end + poly[3];
    out_end_value = out_end_value * end + poly[2];
    out_end_value = out_end_value * end + poly[1];
    out_end_value = out_end_value * end + poly[0];

    
    if ((begin_value > 0.0) == (out_end_value > 0.0)) return false;

    
    
    float current = 0.5 * (begin + end);

    #pragma no_unroll
    for (int i = 0; i != 10; ++i) 
    {
        
        float derivative = poly[5];
        float value = derivative * current + poly[4];
        derivative = derivative * current + value;
        value = value * current + poly[3];
        derivative = derivative * current + value;
        value = value * current + poly[2];
        derivative = derivative * current + value;
        value = value * current + poly[1];
        derivative = derivative * current + value;
        value = value * current + poly[0];

        
        bool left = (begin_value > 0.0) != (value > 0.0);
        begin = left ? begin : current;
        end = left ? current : end;

        
        float guess = current - value / derivative;

        
        float middle = 0.5 * (begin + end);
        float next = (guess >= begin && guess <= end) ? guess : middle;

        
        bool done = abs(next - current) < tolerance;
        current = next;
        if (done) break;
    }

    out_root = current;
    return true;
}

bool poly5_has_root_sign_change
(
    out float out_end_value,
    in float poly[6], 
    in float begin, 
    in float end,
    in float begin_value
){
    if (begin == end) 
    {
        out_end_value = begin_value;
        return false;
    }

    
    out_end_value = poly[5];
    out_end_value = out_end_value * end + poly[4];
    out_end_value = out_end_value * end + poly[3];
    out_end_value = out_end_value * end + poly[2];
    out_end_value = out_end_value * end + poly[1];
    out_end_value = out_end_value * end + poly[0];

    
    if ((begin_value > 0.0) == (out_end_value > 0.0)) return false;

    return true;
}

bool poly5_has_root
(
    float poly[6], 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1e-6;

    
    
    float critical_roots[6];
    critical_roots[0] = begin;
    critical_roots[1] = begin;
    critical_roots[2] = begin;
    critical_roots[5] = end;

    
    
    
    
    
    float deriv_poly[6];
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[0] = poly[3];        
    
    
    float discriminant = deriv_poly[1] * deriv_poly[1] - 4.0 * deriv_poly[0] * deriv_poly[2];
    if (discriminant >= 0.0) 
    {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = deriv_poly[1] + (deriv_poly[1] > 0.0 ? sqrt_discriminant : -sqrt_discriminant);
        float root0 = -2.0 * deriv_poly[0] / scaled_root;
        float root1 = -0.5 * scaled_root / deriv_poly[2];
        root0 = clamp(root0, begin, end);
        root1 = clamp(root1, begin, end);

        critical_roots[3] = min(root0, root1);
        critical_roots[4] = max(root0, root1);
    }
    else 
    {
        
        critical_roots[3] = begin;
        critical_roots[4] = begin;
    }

    
    
    
    
    
    
    
    
  
    
    
    
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = deriv_poly[2] * (3.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (3.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (3.0 / 1.0);
    deriv_poly[0] = poly[2];

    
    float begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    
    #pragma unroll
    for (int i = 2; i != 5; ++i) 
    {
        float root;
        if (poly5_has_root_newton_bisection(root, begin_value, deriv_poly, critical_roots[i], critical_roots[i+1], begin_value, tolerance))
        {
            critical_roots[i] = root;
        }
        else
        {
            
            critical_roots[i] = critical_roots[i-1];
        }
    }

    
    
    
    deriv_poly[5] = 0.0;
    deriv_poly[4] = deriv_poly[3] * (2.0 / 4.0);
    deriv_poly[3] = deriv_poly[2] * (2.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (2.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (2.0 / 1.0);
    deriv_poly[0] = poly[1];

    
    begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    
    #pragma unroll
    for (int i = 1; i != 5; ++i) 
    {
        
        float root;
        if (poly5_has_root_newton_bisection(root, begin_value, deriv_poly, critical_roots[i], critical_roots[i+1], begin_value, tolerance))
        {
            critical_roots[i] = root;
        }
        else
        {
            
            critical_roots[i] = critical_roots[i-1];
        }
    }
    
    
    
    
    deriv_poly[5] = deriv_poly[4] * (1.0 / 5.0);
    deriv_poly[4] = deriv_poly[3] * (1.0 / 4.0);
    deriv_poly[3] = deriv_poly[2] * (1.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (1.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (1.0 / 1.0);
    deriv_poly[0] = poly[0];

    
    begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    
    #pragma unroll
    for (int i = 0; i != 5; ++i) 
    {
        
        if (poly5_has_root_sign_change(begin_value, deriv_poly, critical_roots[i], critical_roots[i+1], begin_value))
        {
            return true;
        }
    }
 
    return false;
}

bool poly5_has_root_v2
(
    float poly[6], 
    float begin, 
    float end
){
    float tolerance = (end - begin) * 1.0e-6;

    
    
    float critical_roots[6];
    critical_roots[0] = begin;
    critical_roots[1] = begin;
    critical_roots[2] = begin;
    critical_roots[5] = end;

    
    
    
    
    
    float deriv_poly[6];
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = 0.0;
    deriv_poly[2] = poly[5] * 10.0; 
    deriv_poly[1] = poly[4] * 4.0;  
    deriv_poly[0] = poly[3];        

    
    float discriminant = deriv_poly[1] * deriv_poly[1] - 4.0 * deriv_poly[0] * deriv_poly[2];
    if (discriminant >= 0.0) 
    {
        float sqrt_discriminant = sqrt(discriminant);
        float scaled_root = deriv_poly[1] + (deriv_poly[1] > 0.0 ? sqrt_discriminant : -sqrt_discriminant);
        float root0 = -2.0 * deriv_poly[0] / scaled_root;
        float root1 = -0.5 * scaled_root / deriv_poly[2];
        root0 = clamp(root0, begin, end);
        root1 = clamp(root1, begin, end);

        critical_roots[3] = min(root0, root1);
        critical_roots[4] = max(root0, root1);
    }
    else 
    {
        
        critical_roots[3] = begin;
        critical_roots[4] = end;
    }

    
    
    
    
    
    
    
    

    
    
    
    deriv_poly[5] = 0.0;
    deriv_poly[4] = 0.0;
    deriv_poly[3] = deriv_poly[2] * (3.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (3.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (3.0 / 1.0);
    deriv_poly[0] = poly[2];

    float begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    float root0;
    if (poly5_has_root_newton_bisection(root0, begin_value, deriv_poly, critical_roots[3], critical_roots[4], begin_value, tolerance))
    {
        
        deriv_poly[4] = deriv_poly[2] + root0 * deriv_poly[3];
        deriv_poly[5] = deriv_poly[1] + root0 * deriv_poly[4];

        
        float discriminant = deriv_poly[4] * deriv_poly[4] - 4.0 * deriv_poly[5] * deriv_poly[3];
        if (discriminant >= 0.0) 
        {
            float sqrt_discriminant = sqrt(discriminant);
            float scaled_root = deriv_poly[4] + (deriv_poly[4] > 0.0 ? sqrt_discriminant : -sqrt_discriminant);
            float root1 = -2.0 * deriv_poly[5] / scaled_root;
            float root2 = -0.5 * scaled_root / deriv_poly[3];
            root1 = clamp(root1, begin, end);
            root2 = clamp(root2, begin, end);
            
            
            if (root0 > root1) { float t = root0; root0 = root1; root1 = t; }
            if (root0 > root2) { float t = root0; root0 = root2; root2 = t; }
            if (root1 > root2) { float t = root1; root1 = root2; root2 = t; }

            
            critical_roots[2] = root0;
            critical_roots[3] = root1;
            critical_roots[4] = root2;
        }
        else
        {
            
            critical_roots[2] = begin;
            critical_roots[3] = begin;
            critical_roots[4] = root0;
        }
    }
    else
    {
        
        critical_roots[2] = begin;
        critical_roots[3] = begin;
        critical_roots[4] = begin;
    }

    
    
    
    deriv_poly[5] = 0.0;
    deriv_poly[4] = deriv_poly[3] * (2.0 / 4.0);
    deriv_poly[3] = deriv_poly[2] * (2.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (2.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (2.0 / 1.0);
    deriv_poly[0] = poly[1];

    
    begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    
    #pragma unroll
    for (int i = 1; i != 5; ++i) 
    {
        
        float root;
        if (poly5_has_root_newton_bisection(root, begin_value, deriv_poly, critical_roots[i], critical_roots[i + 1], begin_value, tolerance))
        {
            critical_roots[i] = root;
        }
        else
        {
            
            critical_roots[i] = critical_roots[i - 1];
        }
    }
    
    
    
    
    deriv_poly[5] = deriv_poly[4] * (1.0 / 5.0);
    deriv_poly[4] = deriv_poly[3] * (1.0 / 4.0);
    deriv_poly[3] = deriv_poly[2] * (1.0 / 3.0);
    deriv_poly[2] = deriv_poly[1] * (1.0 / 2.0);
    deriv_poly[1] = deriv_poly[0] * (1.0 / 1.0);
    deriv_poly[0] = poly[0];

    
    begin_value = deriv_poly[5];
    begin_value = begin_value * begin + deriv_poly[4];
    begin_value = begin_value * begin + deriv_poly[3];
    begin_value = begin_value * begin + deriv_poly[2];
    begin_value = begin_value * begin + deriv_poly[1];
    begin_value = begin_value * begin + deriv_poly[0];

    
    #pragma unroll
    for (int i = 0; i != 5; ++i) 
    {
        
        if (poly5_has_root_sign_change(begin_value, deriv_poly, critical_roots[i], critical_roots[i + 1], begin_value))
        {
            return true;
        }
    }
 
    return false;
}

#endif
#ifndef IS_CUBIC_SOLVABLE
#define IS_CUBIC_SOLVABLE

#ifndef QUADRATIC_ROOTS
#ifndef QUADRATIC_ROOTS
#define QUADRATIC_ROOTS

#ifndef SSIGN
#ifndef SSIGN
#define SSIGN

float ssign(float v) { return step(0.0, v) * 2.0 - 1.0; }
vec2  ssign(vec2  v) { return step(0.0, v) * 2.0 - 1.0; }
vec3  ssign(vec3  v) { return step(0.0, v) * 2.0 - 1.0; }
vec4  ssign(vec4  v) { return step(0.0, v) * 2.0 - 1.0; }

#endif
#endif

vec2 quadratic_roots(in vec3 c)
{
    
    vec2 n = c.xy / c.z;
    n.y /= -2.0;

    
    float d = n.y * n.y - n.x;
    float sqrt_d = sqrt(max(0.0, d));
    float xq = n.y + sqrt_d * ssign(n.y);

    
    return vec2(xq, n.x / xq);
}

vec2 quadratic_roots(in vec3 c, in float xd)
{
    
    vec2 n = c.xy / c.z;
    n.y /= -2.0;

    
    float d = n.y * n.y - n.x;
    float sqrt_d = sqrt(max(0.0, d));
    float xq = n.y + sqrt_d * ssign(n.y);

    
    vec2 x = vec2(xq, n.x / xq);

    
    return (d >= 0.0) ? x : vec2(xd);
}

#endif
#endif
#ifndef EVAL_POLY
#ifndef EVAL_POLY
#define EVAL_POLY

#ifndef EVAL_POLY_MAX_DEGREE
#define EVAL_POLY_MAX_DEGREE 6
#endif

#ifndef EVAL_POLY_MAX_DERIVATIVE
#define EVAL_POLY_MAX_DERIVATIVE 5
#endif

float eval_poly(in vec4 c, in float t) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;
    return f;
}
float eval_poly(in vec4 c, in float t, out float f1) 
{
    float a2 = c.z + c.w * t; 
    float a1 = c.y + a2 * t;  
    float f = c.x + a1 * t;         

    float b2 = a2 + c.w * t;  
    f1 = a1 + b2 * t;         
    return f;
}
vec2 eval_poly(in vec4 c, in vec2 t, out vec2 f1) 
{
    vec2 a2 = c.z + c.w * t;
    vec2 a1 = c.y + a2 * t;
    vec2 f = c.x + a1 * t;

    vec2 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec3 eval_poly(in vec4 c, in vec3 t, out vec3 f1) 
{
    vec3 a2 = c.z + c.w * t;
    vec3 a1 = c.y + a2 * t;
    vec3 f = c.x + a1 * t;

    vec3 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}
vec4 eval_poly(in vec4 c, in vec4 t, out vec4 f1) 
{
    vec4 a2 = c.z + c.w * t;
    vec4 a1 = c.y + a2 * t;
    vec4 f = c.x + a1 * t;

    vec4 b2 = a2 + c.w * t;
    f1 = a1 + b2 * t;
    return f;
}

float eval_poly(in float c[6], in float t) 
{
    float f = c[5];
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t) 
{
    vec2 f = vec2(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t) 
{
    vec3 f = vec3(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t) 
{
    vec4 f = vec4(c[5]);
    f = f * t + c[4];
    f = f * t + c[3];
    f = f * t + c[2];
    f = f * t + c[1];
    f = f * t + c[0];
    return f;
}
float eval_poly(in float c[6], in float t, out float f1) 
{
    float f  = c[5];
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec2 eval_poly(in float c[6], in vec2 t, out vec2 f1) 
{
    vec2 f  = vec2(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec3 eval_poly(in float c[6], in vec3 t, out vec3 f1) 
{
    vec3 f = vec3(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}
vec4 eval_poly(in float c[6], in vec4 t, out vec4 f1) 
{
    vec4 f = vec4(c[5]);
    f1 = f;
    f  = f * t + c[4];
    f1 = f1 * t + f;
    f  = f * t + c[3];
    f1 = f1 * t + f;
    f  = f * t + c[2];
    f1 = f1 * t + f;
    f  = f * t + c[1];
    f1 = f1 * t + f;
    f  = f * t + c[0];
    return f;
}

    

    

    

    

#endif
#endif
#ifndef SIGN_CHANGE
#ifndef SIGN_CHANGE
#define SIGN_CHANGE

bool sign_change(float a, float b) 
{
    return (a < 0.0) != (b < 0.0);
}

bool sign_change(vec2 v) 
{
    return (v.x < 0.0) != (v.y < 0.0);
}

bool sign_change(vec3 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0);
}

bool sign_change(vec4 v) 
{
    return (v.x < 0.0) != (v.y < 0.0) ||
           (v.y < 0.0) != (v.z < 0.0) ||
           (v.z < 0.0) != (v.w < 0.0);
}

bool sign_change(float v[5]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0);
}

bool sign_change(float v[6]) 
{
    return (v[0] < 0.0) != (v[1] < 0.0) ||
           (v[1] < 0.0) != (v[2] < 0.0) ||
           (v[2] < 0.0) != (v[3] < 0.0) ||
           (v[3] < 0.0) != (v[4] < 0.0) ||
           (v[4] < 0.0) != (v[5] < 0.0);
}

#endif
#endif

bool is_cubic_solvable(in vec4 c, in vec2 xa_xb)
{
    
    vec3 d = vec3(c.y, c.z * 2.0, c.w * 3.0);;

    
    vec2 x0_x1 = quadratic_roots(d);
    x0_x1 = clamp(x0_x1, xa_xb.x, xa_xb.y);

    
    vec2 y0_y1 = eval_poly(c, x0_x1);

  
    vec2 ya_yb = eval_poly(c, xa_xb);

    
    vec4 ya_y0_y1_yb = vec4(ya_yb.x, y0_y1, ya_yb.y);

    
    return sign_change(ya_y0_y1_yb);
}

bool is_cubic_solvable(in vec4 c, in vec2 xa_xb, in vec2 ya_yb)
{ 
    
    vec3 d = vec3(c.y, c.z * 2.0, c.w * 3.0);;

    
    vec2 x0_x1 = quadratic_roots(d);
    x0_x1 = clamp(x0_x1, xa_xb.x, xa_xb.y);

    
    vec2 y0_y1;
    y0_y1 = eval_poly(c, x0_x1);

     
    vec4 ya_y0_y1_yb = vec4(ya_yb.x, y0_y1, ya_yb.y);

    
    return sign_change(ya_y0_y1_yb);
}

#endif
#ifndef RANDOM
#define RANDOM

#define RANDOM_SCALE vec4(443.897, 441.423, .0973, .1099)

float random(in vec3 pos) {
    pos  = fract(pos * RANDOM_SCALE.xyz);
    pos += dot(pos, pos.zyx + 31.32);
    return fract((pos.x + pos.y) * pos.z);
}

#endif
#ifndef INTERSECT_BOX
#define INTERSECT_BOX

#ifndef MMIN
#ifndef MMIN
#define MMIN

float mmin(in float a) { return a; }
float mmin(in float a,in float b) { return min(a, b); }
float mmin(in float a,in float b, in float c) { return min(a, min(b, c)); }
float mmin(in float a,in float b, in float c, in float d) { return min(min(a,b), min(c, d)); }

float mmin(vec2 v) { return min(v.x, v.y); }
float mmin(vec3 v) { return mmin(v.x, v.y, v.z); }
float mmin(vec4 v) { return mmin(v.x, v.y, v.z, v.w); }
float mmin(float v[5]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    return r;
}
float mmin(float v[6]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    r = min(r, v[5]);
    return r;
}

#endif
#endif
#ifndef MMAX
#ifndef MMAX
#define MMAX

float mmax(in float a) { return a; }
float mmax(in float a, in float b) { return max(a, b); }
float mmax(in float a, in float b, in float c) { return max(a, max(b, c)); }
float mmax(in float a, in float b, in float c, in float d) { return max(max(a, b), max(c, d)); }
float mmax(vec2 v) { return max(v.x, v.y); }
float mmax(vec3 v) { return mmax(v.x, v.y, v.z); }
float mmax(vec4 v) { return mmax(v.x, v.y, v.z, v.w); }
float mmax(float v[5]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    return r;
}
float mmax(float v[6]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    r = max(r, v[5]);
    return r;
}

#endif
#endif

vec2 intersect_box(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    float t_entry = mmax(min(b_min, b_max));
    float t_exit  = mmin(max(b_min, b_max));
    return vec2(t_entry, t_exit);
}

vec2 intersect_box(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out ivec3 entry_normal, out ivec3 exit_normal) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    vec3 t_min = min(b_min, b_max);
    vec3 t_max = max(b_min, b_max);
    float t_entry = mmax(t_min);
    float t_exit  = mmin(t_max);
    entry_normal = ivec3(equal(t_min, vec3(t_entry)));
    exit_normal = ivec3(equal(t_max, vec3(t_exit)));
    return vec2(t_entry, t_exit);
}

#endif
#ifndef INTERSECT_BOX_EXIT
#define INTERSECT_BOX_EXIT

#ifndef MILLI_TOLERANCE
#define MILLI_TOLERANCE 1e-3
#endif
#ifndef MMIN
#ifndef MMIN
#define MMIN

float mmin(in float a) { return a; }
float mmin(in float a,in float b) { return min(a, b); }
float mmin(in float a,in float b, in float c) { return min(a, min(b, c)); }
float mmin(in float a,in float b, in float c, in float d) { return min(min(a,b), min(c, d)); }

float mmin(vec2 v) { return min(v.x, v.y); }
float mmin(vec3 v) { return mmin(v.x, v.y, v.z); }
float mmin(vec4 v) { return mmin(v.x, v.y, v.z, v.w); }
float mmin(float v[5]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    return r;
}
float mmin(float v[6]) 
{
    float r = v[0];
    r = min(r, v[1]);
    r = min(r, v[2]);
    r = min(r, v[3]);
    r = min(r, v[4]);
    r = min(r, v[5]);
    return r;
}

#endif
#endif

float intersect_box_exit(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    vec3 t_max = max(b_min, b_max);
    float t_exit = mmin(t_max);
    return t_exit;
}

float intersect_box_exit(vec3 box_min, vec3 box_max, vec3 start, vec3 inv_dir, out ivec3 normal) 
{
    vec3 b_min = (box_min - start) * inv_dir;
    vec3 b_max = (box_max - start) * inv_dir;
    vec3 t_max = max(b_min, b_max);
    float t_exit = mmin(t_max);
    normal = ivec3(equal(t_max, vec3(t_exit)));
    return t_exit;
}

#endif
#ifndef INTERSECTION_BOX_BOUNDS
#define INTERSECTION_BOX_BOUNDS

#ifndef MMAX
#ifndef MMAX
#define MMAX

float mmax(in float a) { return a; }
float mmax(in float a, in float b) { return max(a, b); }
float mmax(in float a, in float b, in float c) { return max(a, max(b, c)); }
float mmax(in float a, in float b, in float c, in float d) { return max(max(a, b), max(c, d)); }
float mmax(vec2 v) { return max(v.x, v.y); }
float mmax(vec3 v) { return mmax(v.x, v.y, v.z); }
float mmax(vec4 v) { return mmax(v.x, v.y, v.z, v.w); }
float mmax(float v[5]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    return r;
}
float mmax(float v[6]) 
{
    float r = v[0];
    r = max(r, v[1]);
    r = max(r, v[2]);
    r = max(r, v[3]);
    r = max(r, v[4]);
    r = max(r, v[5]);
    return r;
}

#endif
#endif

vec2 intersection_box_bounds(vec3 b_min, vec3 b_max, vec3 p) 
{
    vec3 c = (b_max + b_min) * 0.5;
    vec3 s = (b_max - b_min) * 0.5;
    vec3 aq = abs(p - c);
    vec3 d_min = aq - s;
    vec3 d_max = aq + s;    
    return vec2(length(max(d_min, 0.0) + min(mmax(d_min), 0.0)), length(d_max));
}

#endif
#ifndef SUM_ANTI_DIAGS
#define SUM_ANTI_DIAGS

void sum_anti_diags(in mat2 M, out vec3 v)
{
    v[0] = M[0][0];            
    v[1] = M[1][0] + M[0][1];  
    v[2] = M[1][1];            
}

void sum_anti_diags(in mat3 M, out float v[5])
{
    v[0] = M[0][0];                      
    v[1] = M[1][0] + M[0][1];            
    v[2] = M[2][0] + M[1][1] + M[0][2];  
    v[3] = M[2][1] + M[1][2];            
    v[4] = M[2][2];                      
}

void sum_anti_diags(in mat4 M, out float v[7])
{
    v[0] = M[0][0];                                
    v[1] = M[1][0] + M[0][1];                      
    v[2] = M[2][0] + M[1][1] + M[0][2];            
    v[3] = M[3][0] + M[2][1] + M[1][2] + M[0][3];  
    v[4] = M[3][1] + M[2][2] + M[1][3];            
    v[5] = M[3][2] + M[2][3];                      
    v[6] = M[3][3];                                
}

void sum_anti_diags(in mat3x2 M, out vec4 v)
{
    v[0] = M[0][0];            
    v[1] = M[1][0] + M[0][1];  
    v[2] = M[2][0] + M[1][1];  
    v[3] = M[2][1];            
}

void sum_anti_diags(in mat2x3 M, out vec4 v)
{
    v[0] = M[0][0];            
    v[1] = M[1][0] + M[0][1];  
    v[2] = M[1][1] + M[0][2];  
    v[3] = M[1][2];            
}

void sum_anti_diags(in mat2x4 M, out float v[5])
{
    v[0] = M[0][0];            
    v[1] = M[1][0] + M[0][1];  
    v[2] = M[1][1] + M[0][2];  
    v[3] = M[1][2] + M[0][3];  
    v[4] = M[1][3];            
}

void sum_anti_diags(in mat4x2 M, out float v[5])
{
    v[0] = M[0][0];            
    v[1] = M[1][0] + M[0][1];  
    v[2] = M[2][0] + M[1][1];  
    v[3] = M[3][0] + M[2][1];  
    v[4] = M[3][1];            
}

void sum_anti_diags(in mat3x4 M, out float v[6]) 
{
    v[0] = M[0][0];                      
    v[1] = M[1][0] + M[0][1];            
    v[2] = M[2][0] + M[1][1] + M[0][2];  
    v[3] = M[2][1] + M[1][2] + M[0][3];  
    v[4] = M[2][2] + M[1][3];            
    v[5] = M[2][3];                      
}

void sum_anti_diags(in mat4x3 M, out float v[6]) 
{
    v[0] = M[0][0];                      
    v[1] = M[1][0] + M[0][1];            
    v[2] = M[2][0] + M[1][1] + M[0][2];  
    v[3] = M[3][0] + M[2][1] + M[1][2];  
    v[4] = M[3][1] + M[2][2];            
    v[5] = M[3][2];                      
}

#endif
#ifndef TO_COLOR
#define TO_COLOR

vec4 to_color(float x) { return vec4(vec3(x), 1.0); }
vec4 to_color(vec3  x) { return vec4(vec3(x), 1.0); }
vec4 to_color(bool  x) { return vec4(vec3(x), 1.0); }
vec4 to_color(bvec3 x) { return vec4(vec3(x), 1.0); }

vec4 to_color(float x, float alpha) { return vec4(vec3(x), alpha); }
vec4 to_color(vec3  x, float alpha) { return vec4(vec3(x), alpha); }
vec4 to_color(bool  x, float alpha) { return vec4(vec3(x), alpha); }
vec4 to_color(bvec3 x, float alpha) { return vec4(vec3(x), alpha); }

#endif
#ifndef COLORMAP
#define COLORMAP

#ifndef COLORMAP_PARULA
#define COLORMAP_PARULA 0

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 parula(float t) 
{
    vec3 a  = vec3(0.541454, 1.968902, 0.559818);
    vec3 b1 = vec3(0.460347, 1.998354, 0.429174);
    vec3 c1 = vec3(0.645892, 0.330375, 0.763244);
    vec3 d1 = vec3(0.309938, 0.387593, -0.187696);
    vec3 b2 = vec3(-0.154889, 0.704319, 0.011011);
    vec3 c2 = vec3(1.667578, 0.717541, 2.000000);
    vec3 d2 = vec3(0.135293, 0.686891, 0.102776);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif
#ifndef COLORMAP_TURBO
#define COLORMAP_TURBO 1

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 turbo(float t) 
{
    vec3 a  = vec3(-1.173583, 1.089549, 0.363003);
    vec3 b0 = vec3(1.999787, -1.091536, 0.596810);
    vec3 c0 = vec3(0.168544, 0.690975, 1.090372);
    vec3 d0 = vec3(0.843290, 0.188794, -0.342117);
    vec3 b1 = vec3(0.265151, 1.180907, -0.376009);
    vec3 c1 = vec3(1.460237, 0.381460, 1.554106);
    vec3 d1 = vec3(0.995900, 0.331064, 0.346513);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_HSV
#define COLORMAP_HSV 2

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 hsv(float t) 
{
    vec3 a  = vec3(0.345930, -1.151078, -1.327910);
    vec3 b0 = vec3(0.703838, 1.816049, 1.999886);
    vec3 c0 = vec3(1.417315, 0.237319, 0.228754);
    vec3 d0 = vec3(-0.210907, -0.120510, 0.880709);
    vec3 b1 = vec3(0.312792, 0.543745, 0.517213);
    vec3 c1 = vec3(2.000000, 0.995237, 1.018500);
    vec3 d1 = vec3(-0.003169, 0.719422, 0.269492);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_HOT
#define COLORMAP_HOT 3

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 hot(float t) 
{
    vec3 a  = vec3(0.434751, 0.499201, 0.553319);
    vec3 b0 = vec3(0.117871, 0.590260, 1.998983);
    vec3 c0 = vec3(1.395636, 0.560375, 0.692793);
    vec3 d0 = vec3(0.516179, 0.436002, 0.254912);
    vec3 b1 = vec3(0.669133, -0.097445,1.467678);
    vec3 c1 = vec3(0.457411, 1.673730, 0.848067);
    vec3 d1 = vec3(0.679382, 0.311157, 0.700754);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_COOL
#define COLORMAP_COOL 4

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 cool(float t) 
{
    vec3 a = vec3(0.500001, 0.500000, 1.000000);
    vec3 b = vec3(1.999655, 1.999654, 0.000000);
    vec3 c = vec3(0.080099, 0.080099, 0.745176);
    vec3 d = vec3(0.709950, 0.209950, 0.127412);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_SPRING
#define COLORMAP_SPRING 5

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 spring(float t) 
{
    vec3 a = vec3(1.000000, 0.500001, 0.500001);
    vec3 b = vec3(0.000000, 1.999808, 1.999812);
    vec3 c = vec3(0.745176, 0.080093, 0.080093);
    vec3 d = vec3(0.127412, 0.709953, 0.209954);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_SUMMER
#define COLORMAP_SUMMER 6

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 summer(float t) 
{
    vec3 a = vec3(0.499979, 0.749503, 0.400000);
    vec3 b = vec3(1.998634, 1.447229, -0.000000);
    vec3 c = vec3(0.080141, 0.055144, 0.732340);
    vec3 d = vec3(0.709931, 0.722482, 0.133830);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_AUTUMN
#define COLORMAP_AUTUMN 7

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 autumn(float t) 
{
    vec3 a = vec3(1.000000, 0.500000, 0.000000);
    vec3 b = vec3(-0.000000, 1.999988, 0.000000);
    vec3 c = vec3(0.745176, 0.080086, 0.714514);
    vec3 d = vec3(0.127412, 0.709957, 0.142743);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_WINTER
#define COLORMAP_WINTER 8

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 winter(float t) 
{
    vec3 a = vec3(-0.000000, 0.500001, 0.750010);
    vec3 b = vec3(-0.000000, 1.999953, 1.430454);
    vec3 c = vec3(0.714514, 0.080087, 0.055794);
    vec3 d = vec3(0.142743, 0.709956, 0.222104);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_GRAY
#define COLORMAP_GRAY 9

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 gray(float t) 
{
    vec3 a = vec3(0.500000, 0.500000, 0.500000);
    vec3 b = vec3(1.999993, 1.999993, 1.999993);
    vec3 c = vec3(0.080086, 0.080086, 0.080086);
    vec3 d = vec3(0.709957, 0.709957, 0.709957);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_BONE
#define COLORMAP_BONE 10

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 bone(float t) 
{
    vec3 a = vec3(1.728560, 0.535898, -0.726993);
    vec3 b = vec3(2.000000, 0.583406, 2.000000);
    vec3 c = vec3(0.100690, 0.318709, 0.102955);
    vec3 d = vec3(0.587366, 0.576509, 0.809972);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_COPPER
#define COLORMAP_COPPER 11

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 copper(float t) 
{
    vec3 a = vec3(0.475474, 0.390606, 0.248753);
    vec3 b = vec3(0.545609, 1.863885, 1.362622);
    vec3 c = vec3(0.404723, 0.067001, 0.058301);
    vec3 d = vec3(0.596710, 0.716499, 0.720849);
    return palette(t, a, b, c, d);
}

#endif
#ifndef COLORMAP_PINK
#define COLORMAP_PINK 12

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 pink(float t) 
{
    vec3 a  = vec3(-0.483794, -0.777930, -0.293682);
    vec3 b0 = vec3(1.988198, 1.900866, 1.999968);
    vec3 c0 = vec3(0.313872, 0.125783, 0.246824);
    vec3 d0 = vec3(-0.242539, 0.825271, 0.729959);
    vec3 b1 = vec3(0.593545, 0.029151, 0.736390);
    vec3 c1 = vec3(0.583510, 1.776750, 0.478608);
    vec3 d1 = vec3(1.077824, 0.775436, 1.088446);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_JET
#define COLORMAP_JET 13

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 jet(float t) 
{
    vec3 a  = vec3(0.276022, 0.527041, 0.353694);
    vec3 b0 = vec3(0.597922, -0.201586, 0.559465);
    vec3 c0 = vec3(0.512799, 1.045576, 0.596704);
    vec3 d0 = vec3(0.573475, -0.103501, -0.104961);
    vec3 b1 = vec3(0.238268, 0.399577, -0.201583);
    vec3 c1 = vec3(1.424259, 1.047211, 1.500953);
    vec3 d1 = vec3(-0.012310, 0.518820, 0.058936);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_PASTELJET
#define COLORMAP_PASTELJET 14

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 pasteljet(float t) 
{
    vec3 a  = vec3(0.677942, 0.350764, 0.469527);
    vec3 b0 = vec3(-0.043513, -0.050359, 0.266445);
    vec3 c0 = vec3(2.000000, 2.000000, 0.698727);
    vec3 d0 = vec3(0.497311, 0.518843, -0.207068);
    vec3 b1 = vec3(0.338745, -0.561075, 0.062141);
    vec3 c1 = vec3(0.863745, 0.650179, 2.000000);
    vec3 d1 = vec3(0.437310, 0.223441, 0.010220);
    return palette(t, a, b0, c0, d0, b1, c1, d1);
}

#endif
#ifndef COLORMAP_VIRIDIS
#define COLORMAP_VIRIDIS 15

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 viridis(float t) 
{
    vec3 a  = vec3(0.425268, -0.364758, 0.418135);
    vec3 b1 = vec3(1.125800, 1.306212, -1.205918);
    vec3 c1 = vec3(0.778337, 0.165380, 1.148509);
    vec3 d1 = vec3(0.296775, 0.795553, 0.047920);
    vec3 b2 = vec3(0.937521, 0.012337, -1.069593);
    vec3 c2 = vec3(0.891060, 1.453194, 1.217589);
    vec3 d2 = vec3(0.781272, 0.775696, 0.520518);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif
#ifndef COLORMAP_PLASMA
#define COLORMAP_PLASMA 16

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 plasma(float t) 
{
    vec3 a  = vec3(0.260353, 0.643741, 0.401505);
    vec3 b1 = vec3(0.925001, 0.641300, 0.244923);
    vec3 c1 = vec3(0.451398, 0.362059, 0.688036);
    vec3 d1 = vec3(0.674213, 0.466824, -0.150012);
    vec3 b2 = vec3(0.249030, 0.020714, 0.015128);
    vec3 c2 = vec3(0.709559, 1.885207, 2.000000);
    vec3 d2 = vec3(1.058190, 0.031753, 0.567507);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif
#ifndef COLORMAP_INFERNO
#define COLORMAP_INFERNO 17

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 inferno(float t) 
{
    vec3 a  = vec3(-0.575419, 0.417340, 0.285807);
    vec3 b1 = vec3(1.543616, 1.325364, 2.000000);
    vec3 c1 = vec3(0.174341, 0.656644, 1.696938);
    vec3 d1 = vec3(0.815911, 0.396624, -0.608185);
    vec3 b2 = vec3(0.095489, 0.951299, 1.871821);
    vec3 c2 = vec3(0.907917, 0.757037, 1.749972);
    vec3 d2 = vec3(0.380506, 0.870792, -0.130654);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif
#ifndef COLORMAP_MAGMA
#define COLORMAP_MAGMA 18

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 magma(float t) 
{
    vec3 a  = vec3(-0.386429, 0.394408, 0.409720);
    vec3 b1 = vec3(1.414174, 1.143924, 1.416815);
    vec3 c1 = vec3(0.189647, 0.676940, 0.641115);
    vec3 d1 = vec3(0.793470, 0.388450, -0.568490);
    vec3 b2 = vec3(0.079624, 0.813267, 1.330803);
    vec3 c2 = vec3(1.052351, 0.800573, 0.764647);
    vec3 d2 = vec3(0.286256, 0.854038, 0.863334);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif
#ifndef COLORMAP_CIVIDIS
#define COLORMAP_CIVIDIS 19

#ifndef PALETTE
#ifndef PALETTE
#define PALETTE

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.283185*(c*t+d) );
}

vec3 palette(float t, vec3 a, vec3 b0, vec3 c0, vec3 d0, vec3 b1, vec3 c1, vec3 d1)
{
    return a + b0 * cos(6.283185 * (c0 * t + d0)) + b1 * cos(6.283185 * (c1 * t + d1));
}

#endif
#endif

vec3 cividis(float t) 
{
    vec3 a  = vec3(0.471158, 0.894980, -1.390197);
    vec3 b1 = vec3(1.441757, 1.133394, 1.864691);
    vec3 c1 = vec3(0.670921, 0.196915, 0.145757);
    vec3 d1 = vec3(0.424741, 0.578773, -0.064678);
    vec3 b2 = vec3(1.085652, 0.238494, 0.032514);
    vec3 c2 = vec3(0.768613, 0.378699, 1.467550);
    vec3 d2 = vec3(0.876007, 0.999533, -0.060326);
    return palette(t, a, b1, c1, d1, b2, c2, d2);
}

#endif

vec3 colormap(in float t, in int type)
{
    if      (type == COLORMAP_PARULA) return parula(t);
    else if (type == COLORMAP_TURBO) return turbo(t);
    else if (type == COLORMAP_HSV) return hsv(t);
    else if (type == COLORMAP_HOT) return hot(t);
    else if (type == COLORMAP_COOL) return cool(t);
    else if (type == COLORMAP_SPRING) return spring(t);
    else if (type == COLORMAP_SUMMER) return summer(t);
    else if (type == COLORMAP_AUTUMN) return autumn(t);
    else if (type == COLORMAP_WINTER) return winter(t);
    else if (type == COLORMAP_GRAY) return gray(t);
    else if (type == COLORMAP_BONE) return bone(t);
    else if (type == COLORMAP_COPPER) return copper(t);
    else if (type == COLORMAP_PINK) return pink(t);
    else if (type == COLORMAP_JET) return jet(t);
    else if (type == COLORMAP_PASTELJET) return pasteljet(t);
    else if (type == COLORMAP_VIRIDIS) return viridis(t);
    else if (type == COLORMAP_PLASMA) return plasma(t);
    else if (type == COLORMAP_INFERNO) return inferno(t);
    else if (type == COLORMAP_MAGMA) return magma(t);
    else if (type == COLORMAP_CIVIDIS) return cividis(t);

    else return vec3(0.0); 
}

#endif
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
#ifndef COLOR_CONSTANTS
#define COLOR_CONSTANTS

struct ColorConstants {
    
    vec3 BLACK;
    vec3 WHITE;
    vec3 GRAY;
    vec3 LIGHT_GRAY;
    vec3 DARK_GRAY;
    vec3 TRANSPARENT;

    
    vec3 RED;
    vec3 GREEN;
    vec3 BLUE;

    vec3 LIGHT_RED;
    vec3 LIGHT_GREEN;
    vec3 LIGHT_BLUE;
    
    vec3 DARK_RED;
    vec3 DARK_GREEN;
    vec3 DARK_BLUE;

    
    vec3 CYAN;
    vec3 MAGENTA;
    vec3 YELLOW;
    vec3 LIGHT_CYAN;
    vec3 LIGHT_MAGENTA;
    vec3 LIGHT_YELLOW;
    vec3 DARK_CYAN;
    vec3 DARK_MAGENTA;
    vec3 DARK_YELLOW;

    
    vec3 PASTEL_RED;
    vec3 PASTEL_GREEN;
    vec3 PASTEL_BLUE;
    vec3 PASTEL_CYAN;
    vec3 PASTEL_MAGENTA;
    vec3 PASTEL_YELLOW;
    vec3 PASTEL_ORANGE;
    vec3 PASTEL_PINK;
    vec3 PASTEL_PURPLE;

    
    vec3 ORANGE;
    vec3 PINK;
    vec3 PURPLE;
    vec3 BROWN;
    vec3 TEAL;
    vec3 INDIGO;

    vec3 LIGHT_ORANGE;
    vec3 LIGHT_PINK;
    vec3 LIGHT_PURPLE;
    vec3 LIGHT_BROWN;
    vec3 LIGHT_TEAL;
    vec3 LIGHT_INDIGO;

    vec3 DARK_ORANGE;
    vec3 DARK_PINK;
    vec3 DARK_PURPLE;
    vec3 DARK_BROWN;
    vec3 DARK_TEAL;
    vec3 DARK_INDIGO;

    
    vec3 NAVY;
    vec3 LIME;
    vec3 SAND;
    vec3 SKY;
    vec3 MAROON;
    vec3 FOREST;

    
    vec3 GOLD;
    vec3 SILVER;

    
    vec3 BREWER_SET1[9];
};

const ColorConstants COLOR = ColorConstants(
    
    vec3(0.0, 0.0, 0.0),       
    vec3(1.0, 1.0, 1.0),       
    vec3(0.5, 0.5, 0.5),       
    vec3(0.8, 0.8, 0.8),       
    vec3(0.3, 0.3, 0.3),       
    vec3(0.0, 0.0, 0.0),       

    
    vec3(1.0, 0.0, 0.0),       
    vec3(0.0, 1.0, 0.0),       
    vec3(0.0, 0.0, 1.0),       

    vec3(1.0, 0.4, 0.4),       
    vec3(0.5, 1.0, 0.5),       
    vec3(0.4, 0.6, 1.0),       

    vec3(0.4, 0.05, 0.05),     
    vec3(0.0, 0.3, 0.0),       
    vec3(0.05, 0.05, 0.4),     

    
    vec3(0.0, 1.0, 1.0),       
    vec3(1.0, 0.0, 1.0),       
    vec3(1.0, 1.0, 0.0),       

    vec3(0.6, 1.0, 1.0),       
    vec3(1.0, 0.6, 1.0),       
    vec3(1.0, 1.0, 0.6),       

    vec3(0.0, 0.4, 0.4),       
    vec3(0.4, 0.0, 0.4),       
    vec3(0.5, 0.5, 0.0),       

    
    vec3(1.0, 0.6, 0.6),       
    vec3(0.6, 1.0, 0.6),       
    vec3(0.6, 0.6, 1.0),       
    vec3(0.6, 1.0, 1.0),       
    vec3(1.0, 0.6, 1.0),       
    vec3(1.0, 1.0, 0.6),       
    vec3(1.0, 0.8, 0.6),       
    vec3(1.0, 0.8, 0.9),       
    vec3(0.8, 0.6, 1.0),       

    
    vec3(1.0, 0.5, 0.0),    
    vec3(1.0, 0.75, 0.8),   
    vec3(0.5, 0.0, 0.5),    
    vec3(0.6, 0.3, 0.0),    
    vec3(0.0, 0.5, 0.5),    
    vec3(0.3, 0.0, 0.5),    

    vec3(1.0, 0.7, 0.3),    
    vec3(1.0, 0.85, 0.9),   
    vec3(0.8, 0.6, 1.0),    
    vec3(0.8, 0.6, 0.4),    
    vec3(0.4, 0.8, 0.8),    
    vec3(0.6, 0.4, 0.9),    

    vec3(0.7, 0.3, 0.0),    
    vec3(0.8, 0.4, 0.5),    
    vec3(0.3, 0.0, 0.3),    
    vec3(0.4, 0.2, 0.0),    
    vec3(0.0, 0.3, 0.3),    
    vec3(0.2, 0.0, 0.4),     

    
    vec3(0.0, 0.0, 0.3),       
    vec3(0.6, 1.0, 0.4),       
    vec3(0.94, 0.87, 0.72),    
    vec3(0.6, 0.8, 1.0),       
    vec3(0.5, 0.0, 0.0),       
    vec3(0.13, 0.55, 0.13),    

    
    vec3(1.0, 0.84, 0.0),      
    vec3(0.75, 0.75, 0.75),     

    
    vec3[9](
    vec3(228.0/255.0,  26.0/255.0,  28.0/255.0),  
    vec3( 55.0/255.0, 126.0/255.0, 184.0/255.0),  
    vec3( 77.0/255.0, 175.0/255.0,  74.0/255.0),  
    vec3(152.0/255.0,  78.0/255.0, 163.0/255.0),  
    vec3(255.0/255.0, 127.0/255.0,   0.0/255.0),  
    vec3(255.0/255.0, 255.0/255.0,  51.0/255.0),  
    vec3(166.0/255.0,  86.0/255.0,  40.0/255.0),  
    vec3(247.0/255.0, 129.0/255.0, 191.0/255.0),  
    vec3(153.0/255.0, 153.0/255.0, 153.0/255.0)   
    )
);

#endif
const vec4 sampling_points = vec4(0, 1, 2, 3) / 3.0;

const mat3 quad_inv_vander = mat3(
    6, -15, 9,    
   -6, 24, -18,   
    2, -9, 9      
) / 2.0;

const mat3 quad_bernstein = mat3(
    12, -3, 0,    
   -12, 12, 0,    
    4, -5, 4      
) / 4.0;

const mat4 cubic_inv_vander = mat4(
    2,   0,   0,  0,   
    -11,  18,  -9,  2,   
    18, -45,  36, -9, 
    -9,  27, -27,  9
) / 2.0;

const mat4 cubic_bernstein = mat4(
    6, 0, 0, 0,  
    -5, 18, -9, 2, 
    2, -9, 18, -5,
    0, 0, 0, 6   
) / 6.0;

const mat4x3 quintic_bernstein_weights = mat4x3(
    10, 4, 1,  
     6, 6, 3,  
     3, 6, 6,  
     1, 4,10   
) / 10.0;
#ifndef UNIFORMS_VOLUME
#define UNIFORMS_VOLUME

struct UniformsVolume 
{
    float isovalue;
    ivec3 dimensions;    
    vec3  spacing;           
    vec3  spacing_normalized;           
    vec3  inv_dimensions;   
    int   block_size;
    ivec3 blocked_dimensions;
};

uniform UniformsVolume u_volume;

#endif
#ifndef UNIFORMS_BBOX
#define UNIFORMS_BBOX

struct UniformsBbox 
{
    vec3 min_position;
    vec3 max_position;
};

uniform UniformsBbox u_bbox;

#endif
#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct UniformsTextures 
{
    sampler3D interpolation_map;
    usampler3D occupancy_map;
    usampler3D distance_map;
};

uniform UniformsTextures u_textures;

#endif
#ifndef UNIFORMS_SHADING
#define UNIFORMS_SHADING

struct UniformsShading
{
    int   colormap;
    float shininess;           
    float reflect_ambient; 
    float reflect_diffuse; 
    float reflect_specular;
    float modulate_edges;       
    float modulate_gradient;       
    float modulate_curvature;       
};

uniform UniformsShading u_shading;

#endif
#ifndef UNIFORMS_DEBUG
#define UNIFORMS_DEBUG

struct UniformsDebug
{
    int option;
    int max_groups;         
    int max_blocks;         
    int max_cells;             
    float variable1; 
    float variable2; 
    float variable3; 
    float variable4; 
    float variable5; 
};

uniform UniformsDebug u_debug;

#endif
#ifndef STRUCT_CAMERA
#define STRUCT_CAMERA

struct Camera 
{
    vec3  position;       
    vec3  direction;      
};

Camera camera; 

void set_camera()
{
    camera.position = v_camera_position;
    camera.direction = normalize(v_camera_direction);
}

#endif
#ifndef STRUCT_FRAG
#define STRUCT_FRAG

struct Frag 
{
    float depth;             
    vec3  position;          
    vec3  color_material;      
    vec3  color_ambient;
    vec3  color_diffuse;
    vec3  color_specular;
    vec3  color_directional;
    vec3  color;           
};

Frag frag; 

void set_frag()
{
    frag.depth             = 0.0;
    frag.position          = vec3(0.0);
    frag.color_material    = vec3(0.0);
    frag.color_ambient     = vec3(0.0);
    frag.color_diffuse     = vec3(0.0);
    frag.color_specular    = vec3(0.0);
    frag.color_directional = vec3(0.0);
    frag.color             = vec3(0.0);
}

#endif
#ifndef STRUCT_BOX
#define STRUCT_BOX

struct Box 
{  
    vec3  entry_position;   
    float entry_distance;   
    vec3  exit_position;     
    float exit_distance;     
    float span_distance;
    vec3  min_position;     
    vec3  max_position;   
    float min_entry_distance;
    float max_exit_distance;     
    float max_span_distance;   
   
};

Box box; 

void set_box()
{
    box.entry_position     = vec3(0.0);
    box.exit_position      = vec3(0.0);
    box.entry_distance     = 0.0;
    box.exit_distance      = 0.0;
    box.span_distance      = 0.0;
    box.min_position       = vec3(0.0);
    box.max_position       = vec3(0.0);
    box.min_entry_distance = 0.0;
    box.max_exit_distance  = 0.0;
    box.max_span_distance  = 0.0;
}

#endif
#ifndef STRUCT_RAY
#define STRUCT_RAY

struct Ray 
{
    bool  discarded;       
    vec3  direction;       
    vec3  inv_direction;   
    float spacing;         
    ivec3 signs;           
    int   octant;          
    float start_distance;  
    vec3  start_position;  
    float end_distance;    
    vec3  end_position;    
    float span_distance;   
};

Ray ray; 

void set_ray()
{
    ray.discarded      = false;
    ray.direction      = vec3(0.0);
    ray.inv_direction  = vec3(0.0);
    ray.signs          = ivec3(0);
    ray.octant         = 0;
    ray.spacing        = 0.0;
    ray.start_position = vec3(0.0);
    ray.end_position   = vec3(0.0);
    ray.start_distance = 0.0;
    ray.end_distance   = 0.0;
    ray.span_distance  = 0.0;
}

#endif
#ifndef STRUCT_TRACE
#define STRUCT_TRACE

struct Trace 
{
    bool  intersected;          
    bool  terminated;           
    vec3  position;             
    float distance;             
    float spacing;             
    float residue;           
    float prev_distance;           
    float prev_residue;         
};

Trace trace; 

void set_trace()
{
    trace.intersected   = false;
    trace.terminated    = false;
    trace.position      = vec3(0.0);
    trace.distance      = 0.0;
    trace.spacing       = 0.0;
    trace.residue       = 0.0;
    trace.prev_distance = 0.0;
    trace.prev_residue  = 0.0;
}

#endif
#ifndef STRUCT_HIT
#define STRUCT_HIT

struct Hit 
{
    bool  discarded;          
    bool  escaped;          
    bool  undefined;
    vec3  position;           
    float distance;   
    float value;        
    float residue;
    float derivative;
    float orientation;   
    vec3  gradient;   
    mat3  hessian;   
    vec3  normal;   
    vec2  curvatures;    
};

Hit hit; 

void set_hit()
{
    hit.discarded   = false;
    hit.escaped     = false;
    hit.undefined   = false;
    hit.position    = vec3(0.0);
    hit.distance    = 0.0;
    hit.value       = 0.0;
    hit.residue     = 0.0;
    hit.derivative  = 0.0;
    hit.orientation = 0.0;
    hit.gradient    = vec3(0.0);
    hit.hessian     = mat3(0.0);
    hit.normal      = vec3(0.0);
    hit.curvatures  = vec2(0.0);
}

#endif
#ifndef STRUCT_CELL
#define STRUCT_CELL

struct Cell 
{
    bool  intersected;
    bool  terminated;
    ivec3 coords;
    ivec3 exit_normal;
    vec3  min_position;
    vec3  max_position;
    float entry_distance;
    float exit_distance;
    float span_distance;
    vec3  entry_position;
    vec3  exit_position;
};

Cell cell; 

void set_cell()
{
    cell.intersected    = false;
    cell.terminated     = false;
    cell.coords         = ivec3(0);
    cell.exit_normal    = ivec3(0);
    cell.min_position   = vec3(0.0);
    cell.max_position   = vec3(0.0);
    cell.entry_distance = 0.0;
    cell.exit_distance  = 0.0;
    cell.span_distance  = 0.0;
    cell.entry_position = vec3(0.0);
    cell.exit_position  = vec3(0.0);
}

#endif
#ifndef STRUCT_BLOCK
#define STRUCT_BLOCK

struct Block
{
    bool  occupied;
    bool  terminated;
    ivec3 exit_normal;
    ivec3 coords;  
    ivec3 skip_coords;
    ivec3 max_coords;
    ivec3 min_coords;
    vec3  min_position;
    vec3  max_position;
    float entry_distance;
    float exit_distance;
    float span_distance;
    vec3  entry_position;
    vec3  exit_position;
};

Block block; 

void set_block()
{
    block.skip_coords  = ivec3(0);
    block.occupied       = false;
    block.terminated     = false;
    block.coords         = ivec3(0);
    block.exit_normal    = ivec3(0);
    block.min_coords     = ivec3(0);
    block.max_coords     = ivec3(0);
    block.min_position   = vec3(0.0);
    block.max_position   = vec3(0.0);
    block.entry_distance = 0.0;
    block.exit_distance  = 0.0;
    block.span_distance  = 0.0;
    block.entry_position = vec3(0.0);
    block.exit_position  = vec3(0.0);
}

#endif
#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec4  residuals;
    vec4  distances;
    vec4  coeffs;    
    vec4  bernstein_coeffs; 
    vec4  roots;
    float root;
    int   num_roots;
};

Cubic cubic; 

void set_cubic()
{
    cubic.roots = vec4(0);
    cubic.residuals = vec4(0);
    cubic.distances = vec4(0);
    cubic.coeffs = vec4(0);
    cubic.bernstein_coeffs = vec4(0);
    cubic.root = 0.0;
    cubic.num_roots = 0;
}

#endif
#ifndef STRUCT_QUINTIC
#define STRUCT_QUINTIC

struct Quintic 
{
    vec4 residuals;
    float coeffs[6];  
    float bernstein_coeffs[6];  
    float roots[6];
    int num_roots;
    mat4 features;
    mat3x4 biases;
    float root;
};

Quintic quintic; 

void set_quintic()
{
    quintic.residuals = vec4(0.0);
    quintic.coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.bernstein_coeffs = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.roots = float[6](0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    quintic.biases = mat3x4(0);
    quintic.features = mat4(0);
    quintic.root = 0.0;
    quintic.num_roots = 0;
}

#endif

#if DEBUG_ENABLED == 1
#ifndef STRUCT_DEBUG
#define STRUCT_DEBUG

struct Debug 
{
    vec4 variable0;
    vec4 variable1;
    vec4 variable2;
    vec4 variable3;
    vec4 variable4;
    vec4 variable5;
    vec4 variable6;
    vec4 variable7;
    vec4 variable8;
    vec4 variable9;
};

Debug debug; 

void set_debug()
{
    debug.variable0 = to_color(0.0);
    debug.variable1 = to_color(0.0);
    debug.variable2 = to_color(0.0);
    debug.variable3 = to_color(0.0);
    debug.variable4 = to_color(0.0);
    debug.variable5 = to_color(0.0);
    debug.variable6 = to_color(0.0);
    debug.variable7 = to_color(0.0);
    debug.variable8 = to_color(0.0);
    debug.variable9 = to_color(0.0);
}

#endif
#endif

#if DEBUG_ENABLED == 1
#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_texture_fetches; 
    int num_groups;
    int num_cells;
    int num_blocks;
    int num_traces;
    int num_intersection_tests;
};

Stats stats; 

void set_stats()
{
    stats.num_groups  = 0;
    stats.num_blocks  = 0;
    stats.num_cells   = 0;
    stats.num_traces  = 0;
    stats.num_texture_fetches = 0;
    stats.num_intersection_tests  = 0;
}

#endif
#endif
#ifndef UNPACK_UINT5551
#define UNPACK_UINT5551

uvec4 unpack_uint5551(in uint packed)
{
    return uvec4(
        (packed >> 11u) & 0x1Fu, 
        (packed >>  6u) & 0x1Fu, 
        (packed >>  1u) & 0x1Fu, 
        (packed >>  0u) & 0x01u  
    );
}

#endif
#ifndef SAMPLE_OCCUPANCY
#define SAMPLE_OCCUPANCY

bool sample_occupancy(in ivec3 block_coords)
{    
    return (texelFetch(u_textures.occupancy_map, block_coords, 0).r > 0u);
}

#endif
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#ifndef SAMPLE_VALUE_TRICUBIC
#define SAMPLE_VALUE_TRICUBIC

vec4 tricubic_bias(vec3 coords)
{
    vec3 pos = fract(coords - 0.5);;
    vec3 bias = pos * (pos - 1.0) * 0.5;

    return vec4(bias, 1.0);
}

vec4 tricubic_features(in vec3 coords)
{
    
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    
    return texture(u_textures.interpolation_map, texture_coords);
}

float sample_value_tricubic(in vec3 coords)
{
    
    vec4 features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}      

float sample_value_tricubic(in vec3 coords, out vec4 features)
{
    
    features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}     

float sample_residue_tricubic(in vec3 coords) 
{ 
    return sample_value_tricubic(coords) - u_volume.isovalue; 
}

float sample_residue_tricubic(in vec3 coords, out vec4 features) 
{ 
    return sample_value_tricubic(coords, features) - u_volume.isovalue; 
}

#endif
#ifndef SAMPLE_DISTANCE_ISOTROPIC
#define SAMPLE_DISTANCE_ISOTROPIC

ivec3 sample_distance_isotropic(in ivec3 block_coords, out bool occupied)
{
    uint distance = texelFetch(u_textures.distance_map, block_coords, 0).r;
    occupied = (distance == 0u);
    return ivec3(distance);
}

#endif
#ifndef SAMPLE_DISTANCE_ANISOTROPIC
#define SAMPLE_DISTANCE_ANISOTROPIC

ivec3 sample_distance_anisotropic(in ivec3 block_coords, in int octant, out bool occupied)
{        
    ivec3 texel = block_coords + ivec3(0,0,octant * u_volume.blocked_dimensions.z);
    uint distance = texelFetch(u_textures.distance_map, texel, 0).r;
    occupied = (distance == 0u);
    return ivec3(distance);
}

#endif
#ifndef SAMPLE_DISTANCE_EXTENDED_ISOTROPIC
#define SAMPLE_DISTANCE_EXTENDED_ISOTROPIC

#ifndef UNPACK_UINT5551
#ifndef UNPACK_UINT5551
#define UNPACK_UINT5551

uvec4 unpack_uint5551(in uint packed)
{
    return uvec4(
        (packed >> 11u) & 0x1Fu, 
        (packed >>  6u) & 0x1Fu, 
        (packed >>  1u) & 0x1Fu, 
        (packed >>  0u) & 0x01u  
    );
}

#endif
#endif

void sample_distance_extended_isotropic(in ivec3 block_coords, out bool occupied, out ivec3 min_distances, out ivec3 max_distances)
{
    uvec2 packed = texelFetch(u_textures.distance_map, block_coords, 0).rg;
    uvec4 min_unpacked = unpack_uint5551(packed.r);
    uvec4 max_unpacked = unpack_uint5551(packed.g);
    min_distances = ivec3(min_unpacked.xyz);
    max_distances = ivec3(max_unpacked.xyz);
    occupied = bool(min_unpacked.w);
}

#endif
#ifndef SAMPLE_DISTANCE_EXTENDED
#define SAMPLE_DISTANCE_EXTENDED

#ifndef UNPACK_UINT5551
#ifndef UNPACK_UINT5551
#define UNPACK_UINT5551

uvec4 unpack_uint5551(in uint packed)
{
    return uvec4(
        (packed >> 11u) & 0x1Fu, 
        (packed >>  6u) & 0x1Fu, 
        (packed >>  1u) & 0x1Fu, 
        (packed >>  0u) & 0x01u  
    );
}

#endif
#endif

ivec3 sample_distance_extended_anisotropic(in ivec3 block_coords, in int octant, out bool occupied)
{
    ivec3 texel = block_coords + ivec3(0,0,octant * u_volume.blocked_dimensions.z);
    uint  packed = texelFetch(u_textures.distance_map, texel, 0).r;
    uvec4 unpacked = unpack_uint5551(packed);
    ivec3 distances = ivec3(unpacked.xyz);
    occupied = bool(unpacked.w);
    return distances;
}

#endif
#if GRADIENTS_METHOD == 0
#if INTERPOLATION_METHOD == 0
#ifndef COMPUTE_GRADIENT_TRILINEAR_ANALYTIC
#define COMPUTE_GRADIENT_TRILINEAR_ANALYTIC

#ifndef SAMPLE_TRILINEAR_VOLUME
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#endif

vec3 compute_gradient(in vec3 p)
{
    
    vec3 x = p - 0.5;     
    vec3 i = floor(x); 

    vec3 a0 = x - i; 

    vec3 p0 = i + 0.5;
    vec3 p1 = i + 1.5;

    
    float f_x0y0z0 = sample_value_trilinear(vec3(p0.x, p0.y, p0.z));
    float f_x0y1z0 = sample_value_trilinear(vec3(p0.x, p1.y, p0.z));
    float f_x0y0z1 = sample_value_trilinear(vec3(p0.x, p0.y, p1.z));
    float f_x0y1z1 = sample_value_trilinear(vec3(p0.x, p1.y, p1.z));
    float f_x1y0z0 = sample_value_trilinear(vec3(p1.x, p0.y, p0.z));
    float f_x1y1z0 = sample_value_trilinear(vec3(p1.x, p1.y, p0.z));
    float f_x1y0z1 = sample_value_trilinear(vec3(p1.x, p0.y, p1.z));
    float f_x1y1z1 = sample_value_trilinear(vec3(p1.x, p1.y, p1.z));

    
    float f_xy0z0 = mix(f_x0y0z0, f_x1y0z0, a0.x);
    float f_xy1z0 = mix(f_x0y1z0, f_x1y1z0, a0.x);
    float f_xy0z1 = mix(f_x0y0z1, f_x1y0z1, a0.x);
    float f_xy1z1 = mix(f_x0y1z1, f_x1y1z1, a0.x);

    
    float f_dxy0z0 = f_x1y0z0 - f_x0y0z0;
    float f_dxy1z0 = f_x1y1z0 - f_x0y1z0;
    float f_dxy0z1 = f_x1y0z1 - f_x0y0z1;
    float f_dxy1z1 = f_x1y1z1 - f_x0y1z1;

    
    float f_xyz0  = mix(f_xy0z0,  f_xy1z0,  a0.y);
    float f_xyz1  = mix(f_xy0z1,  f_xy1z1,  a0.y);
    float f_dxyz0 = mix(f_dxy0z0, f_dxy1z0, a0.y);
    float f_dxyz1 = mix(f_dxy0z1, f_dxy1z1, a0.y);

    
    float f_xdyz0 = f_xy1z0 - f_xy0z0;
    float f_xdyz1 = f_xy1z1 - f_xy0z1;

    
    float f_dxyz = mix(f_dxyz0, f_dxyz1, a0.z);
    float f_xdyz = mix(f_xdyz0, f_xdyz1, a0.z);

    
    float f_xydz = f_xyz1 - f_xyz0;

    
    vec3 gradient = vec3(f_dxyz, f_xdyz, f_xydz);

    
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

vec3 compute_gradient(in vec3 p, out mat3 hessian)
{
    
    vec3 x = p - 0.5; 
    vec3 i = floor(x); 

    vec3 a0 = x - i; 

    vec3 p0 = i + 0.5;
    vec3 p1 = i + 1.5;

    
    float f_x0y0z0 = sample_value_trilinear(vec3(p0.x, p0.y, p0.z));
    float f_x0y1z0 = sample_value_trilinear(vec3(p0.x, p1.y, p0.z));
    float f_x0y0z1 = sample_value_trilinear(vec3(p0.x, p0.y, p1.z));
    float f_x0y1z1 = sample_value_trilinear(vec3(p0.x, p1.y, p1.z));
    float f_x1y0z0 = sample_value_trilinear(vec3(p1.x, p0.y, p0.z));
    float f_x1y1z0 = sample_value_trilinear(vec3(p1.x, p1.y, p0.z));
    float f_x1y0z1 = sample_value_trilinear(vec3(p1.x, p0.y, p1.z));
    float f_x1y1z1 = sample_value_trilinear(vec3(p1.x, p1.y, p1.z));

    
    float f_xy0z0 = mix(f_x0y0z0, f_x1y0z0, a0.x);
    float f_xy1z0 = mix(f_x0y1z0, f_x1y1z0, a0.x);
    float f_xy0z1 = mix(f_x0y0z1, f_x1y0z1, a0.x);
    float f_xy1z1 = mix(f_x0y1z1, f_x1y1z1, a0.x);

    
    float f_dxy0z0 = f_x1y0z0 - f_x0y0z0;
    float f_dxy1z0 = f_x1y1z0 - f_x0y1z0;
    float f_dxy0z1 = f_x1y0z1 - f_x0y0z1;
    float f_dxy1z1 = f_x1y1z1 - f_x0y1z1;

    
    float f_xyz0  = mix(f_xy0z0,  f_xy1z0,  a0.y);
    float f_xyz1  = mix(f_xy0z1,  f_xy1z1,  a0.y);
    float f_dxyz0 = mix(f_dxy0z0, f_dxy1z0, a0.y);
    float f_dxyz1 = mix(f_dxy0z1, f_dxy1z1, a0.y);

    
    float f_xdyz0  = f_xy1z0  - f_xy0z0;
    float f_xdyz1  = f_xy1z1  - f_xy0z1;
    float f_dxdyz0 = f_dxy1z0 - f_dxy0z0;
    float f_dxdyz1 = f_dxy1z1 - f_dxy0z1;

    
    float f_xyz   = mix(f_xyz0,   f_xyz1,   a0.z);
    float f_dxyz  = mix(f_dxyz0,  f_dxyz1,  a0.z);
    float f_xdyz  = mix(f_xdyz0,  f_xdyz1,  a0.z);
    float f_dxdyz = mix(f_dxdyz0, f_dxdyz1, a0.z);

    
    float f_xydz  = f_xyz1  - f_xyz0;
    float f_dxydz = f_dxyz1 - f_dxyz0;
    float f_xdydz = f_xdyz1 - f_xdyz0;

    
    vec3 gradient = vec3(f_dxyz, f_xdyz, f_xydz);

    
    hessian = mat3(
        0.0, f_dxdyz, f_dxydz,  
        f_dxdyz, 0.0, f_xdydz,  
        f_dxydz, f_xdydz, 0.0     
    );

    
    hessian /= outerProduct(u_volume.spacing_normalized, u_volume.spacing_normalized);
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

#endif

#elif INTERPOLATION_METHOD == 1
#ifndef COMPUTE_GRADIENT_TRICUBIC_ANALYTIC
#define COMPUTE_GRADIENT_TRICUBIC_ANALYTIC

#ifndef SAMPLE_TRICUBIC_VOLUME
#ifndef SAMPLE_VALUE_TRICUBIC
#define SAMPLE_VALUE_TRICUBIC

vec4 tricubic_bias(vec3 coords)
{
    vec3 pos = fract(coords - 0.5);;
    vec3 bias = pos * (pos - 1.0) * 0.5;

    return vec4(bias, 1.0);
}

vec4 tricubic_features(in vec3 coords)
{
    
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    
    return texture(u_textures.interpolation_map, texture_coords);
}

float sample_value_tricubic(in vec3 coords)
{
    
    vec4 features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}      

float sample_value_tricubic(in vec3 coords, out vec4 features)
{
    
    features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}     

float sample_residue_tricubic(in vec3 coords) 
{ 
    return sample_value_tricubic(coords) - u_volume.isovalue; 
}

float sample_residue_tricubic(in vec3 coords, out vec4 features) 
{ 
    return sample_value_tricubic(coords, features) - u_volume.isovalue; 
}

#endif
#endif

/*
    This function produces analytic gradients and curvatures directly from the 
    interpolation function described in "Beyond Trilinear Interpolation: Higher Quality for Free".
    There are some visible boundary artifacts between cells because gradients are C^0 piecewise continuous 
*/
vec3 compute_gradient(in vec3 p)
{
    
    vec3 x = p - 0.5; 
    vec3 i = floor(x); 

    vec3 a0 = x - i; 
    vec3 a1 = a0 - 0.5;

    vec3 p0 = i + 0.5;
    vec3 p1 = i + 1.5;

    vec4 bias = vec4(a0 * (a0 - 1.0) * 0.5, 1.0);

    
    vec4 f    = tricubic_features(p);
    vec4 f_x0 = tricubic_features(vec3(p0.x, p.y,  p.z));
    vec4 f_x1 = tricubic_features(vec3(p1.x, p.y,  p.z));
    vec4 f_y0 = tricubic_features(vec3(p.x,  p0.y, p.z));
    vec4 f_y1 = tricubic_features(vec3(p.x,  p1.y, p.z));
    vec4 f_z0 = tricubic_features(vec3(p.x,  p.y,  p0.z));
    vec4 f_z1 = tricubic_features(vec3(p.x,  p.y,  p1.z));

    
    vec4 f_dx = f_x1 - f_x0;
    vec4 f_dy = f_y1 - f_y0;
    vec4 f_dz = f_z1 - f_z0;

    
    float F_dx = dot(f_dx, bias) + f.x * a1.x;
    float F_dy = dot(f_dy, bias) + f.y * a1.y;
    float F_dz = dot(f_dz, bias) + f.z * a1.z;

    
    vec3 gradient = vec3(F_dx, F_dy, F_dz);

    
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

vec3 compute_gradient(in vec3 p, out mat3 hessian)
{
    
    vec3 x = p - 0.5; 
    vec3 i = floor(x); 

    vec3 a0 = x - i; 
    vec3 a1 = a0 - 0.5;

    vec3 p0 = i + 0.5;
    vec3 p1 = i + 1.5;

    vec4 bias = vec4(a0 * (a0 - 1.0) * 0.5, 1.0);

    
    vec4 f_x0y0z0 = tricubic_features(vec3(p0.x, p0.y, p0.z));
    vec4 f_x0y1z0 = tricubic_features(vec3(p0.x, p1.y, p0.z));
    vec4 f_x0y0z1 = tricubic_features(vec3(p0.x, p0.y, p1.z));
    vec4 f_x0y1z1 = tricubic_features(vec3(p0.x, p1.y, p1.z));
    vec4 f_x1y0z0 = tricubic_features(vec3(p1.x, p0.y, p0.z));
    vec4 f_x1y1z0 = tricubic_features(vec3(p1.x, p1.y, p0.z));
    vec4 f_x1y0z1 = tricubic_features(vec3(p1.x, p0.y, p1.z));
    vec4 f_x1y1z1 = tricubic_features(vec3(p1.x, p1.y, p1.z));

    
    vec4 f_xy0z0 = mix(f_x0y0z0, f_x1y0z0, a0.x);
    vec4 f_xy1z0 = mix(f_x0y1z0, f_x1y1z0, a0.x);
    vec4 f_xy0z1 = mix(f_x0y0z1, f_x1y0z1, a0.x);
    vec4 f_xy1z1 = mix(f_x0y1z1, f_x1y1z1, a0.x);

    
    vec4 f_dxy0z0 = f_x1y0z0 - f_x0y0z0;
    vec4 f_dxy1z0 = f_x1y1z0 - f_x0y1z0;
    vec4 f_dxy0z1 = f_x1y0z1 - f_x0y0z1;
    vec4 f_dxy1z1 = f_x1y1z1 - f_x0y1z1;

    
    vec4 f_xyz0  = mix(f_xy0z0,  f_xy1z0,  a0.y);
    vec4 f_xyz1  = mix(f_xy0z1,  f_xy1z1,  a0.y);
    vec4 f_dxyz0 = mix(f_dxy0z0, f_dxy1z0, a0.y);
    vec4 f_dxyz1 = mix(f_dxy0z1, f_dxy1z1, a0.y);

    
    vec4 f_xdyz0  = f_xy1z0  - f_xy0z0;
    vec4 f_xdyz1  = f_xy1z1  - f_xy0z1;
    vec4 f_dxdyz0 = f_dxy1z0 - f_dxy0z0;
    vec4 f_dxdyz1 = f_dxy1z1 - f_dxy0z1;

    
    vec4 f_xyz   = mix(f_xyz0,   f_xyz1,   a0.z);
    vec4 f_dxyz  = mix(f_dxyz0,  f_dxyz1,  a0.z);
    vec4 f_xdyz  = mix(f_xdyz0,  f_xdyz1,  a0.z);
    vec4 f_dxdyz = mix(f_dxdyz0, f_dxdyz1, a0.z);

    
    vec4 f_xydz  = f_xyz1  - f_xyz0;
    vec4 f_dxydz = f_dxyz1 - f_dxyz0;
    vec4 f_xdydz = f_xdyz1 - f_xdyz0;

    
    float Fx_xyz = dot(f_dxyz, bias) + f_xyz.x * a1.x;
    float Fy_xyz = dot(f_xdyz, bias) + f_xyz.y * a1.y;
    float Fz_xyz = dot(f_xydz, bias) + f_xyz.z * a1.z;

    
    float Fxy_xyz = dot(f_dxdyz, bias) + dot(vec2(f_xdyz.x, f_dxyz.y), a1.xy);
    float Fyz_xyz = dot(f_xdydz, bias) + dot(vec2(f_xydz.y, f_xdyz.z), a1.yz);
    float Fxz_xyz = dot(f_dxydz, bias) + dot(vec2(f_dxyz.z, f_xydz.x), a1.zx);

    
    float Fxx_xyz = f_xyz.x + f_dxyz.x * a1.x * 2.0;
    float Fyy_xyz = f_xyz.y + f_xdyz.y * a1.y * 2.0;
    float Fzz_xyz = f_xyz.z + f_xydz.z * a1.z * 2.0;

    
    vec3 gradient = vec3(Fx_xyz, Fy_xyz, Fz_xyz);

    
    hessian = mat3(
        Fxx_xyz, Fxy_xyz, Fxz_xyz,  
        Fxy_xyz, Fyy_xyz, Fyz_xyz,  
        Fxz_xyz, Fyz_xyz, Fzz_xyz     
    );

    
    hessian /= outerProduct(u_volume.spacing_normalized, u_volume.spacing_normalized);
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

#endif
#endif

#elif GRADIENTS_METHOD == 1
#ifndef COMPUTE_GRADIENT_TRILINEAR_SOBEL
#define COMPUTE_GRADIENT_TRILINEAR_SOBEL

#ifndef SAMPLE_TRILINEAR_VOLUME
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#endif
#ifndef COMPUTE_SECOND_DERIVATIVES
#ifndef COMPUTE_SECOND_DERIVATIVES
#define COMPUTE_SECOND_DERIVATIVES

#ifndef SAMPLE_TRILINEAR_VOLUME
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#endif

vec3 compute_second_derivatives(in vec3 p)
{
    #if INTERPOLATION_METHOD == 0

        
        vec3 s_x0yz_xy0z_xyz0 = vec3(
            sample_value_trilinear(vec3(p.x - 1.0, p.y, p.z)),
            sample_value_trilinear(vec3(p.x, p.y - 1.0, p.z)),
            sample_value_trilinear(vec3(p.x, p.y, p.z - 1.0))
        );

        vec3 s_x1yz_xy1z_xyz1 = vec3(
            sample_value_trilinear(vec3(p.x + 1.0, p.y, p.z)),
            sample_value_trilinear(vec3(p.x, p.y + 1.0, p.z)),
            sample_value_trilinear(vec3(p.x, p.y, p.z + 1.0))
        );

        
        return s_x0yz_xy0z_xyz0 + s_x1yz_xy1z_xyz1 - sample_value_trilinear(p) * 2.0;

    #elif INTERPOLATION_METHOD == 1

        return tricubic_features(p).xyz;

    #endif
}

#endif
#endif

vec3 compute_gradient(in vec3 p)
{
    
    vec3 p0 = p - 0.5;
    vec3 p1 = p + 0.5;

    
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_value_trilinear(vec3(p0.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_value_trilinear(vec3(p1.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p1.z))  
    );

    
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    0.5);

    
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    );

    
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    0.5);

    
    vec2 s_xdyz0_xdyz1 = (
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw - 
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz
    );

    
    vec2 s_dxyz_xdyz = mix(
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1.y),
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1.x), 
    0.5);

    
    float s_xydz = (
        s_xyz0_xyz1_dxyz0_dxyz1.y - 
        s_xyz0_xyz1_dxyz0_dxyz1.x
    );

    
    vec3 gradient = vec3(s_dxyz_xdyz, s_xydz);

    
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

vec3 compute_gradient(in vec3 p, out mat3 hessian)
{
    
    vec3 p0 = p - 0.5;
    vec3 p1 = p + 0.5;

    
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_value_trilinear(vec3(p0.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_value_trilinear(vec3(p1.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p1.z))  
    );

    
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    0.5);

    
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    );

    
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    0.5);

    
    vec4 s_xdyz0_xdyz1_dxdyz0_dxdyz1 = (
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw) -
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz)
    );

    
    vec3 s_dxyz_xdyz_dxdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1_dxdyz0_dxdyz1.yw),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1_dxdyz0_dxdyz1.xz), 
    0.5);

    
    vec3 s_xydz_dxydz_xdydz = (
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    );

    
    vec3 s_d2x_d2y_d2z = compute_second_derivatives(p);

    
    vec3 gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    
    hessian = mat3(
       s_d2x_d2y_d2z.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
       s_dxyz_xdyz_dxdyz.z, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
       s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
    );

    
    hessian /= outerProduct(u_volume.spacing_normalized, u_volume.spacing_normalized);
    gradient /= u_volume.spacing_normalized;

    return gradient;
}

#endif

#elif GRADIENTS_METHOD == 2
#ifndef COMPUTE_GRADIENT_TRIQUADRATIC_BSPLINE
#define COMPUTE_GRADIENT_TRIQUADRATIC_BSPLINE

#ifndef SAMPLE_TRILINEAR_VOLUME
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#endif
#ifndef SAMPLE_TRICUBIC_VOLUME
#ifndef SAMPLE_VALUE_TRICUBIC
#define SAMPLE_VALUE_TRICUBIC

vec4 tricubic_bias(vec3 coords)
{
    vec3 pos = fract(coords - 0.5);;
    vec3 bias = pos * (pos - 1.0) * 0.5;

    return vec4(bias, 1.0);
}

vec4 tricubic_features(in vec3 coords)
{
    
    vec3 texture_coords = coords * u_volume.inv_dimensions;

    
    return texture(u_textures.interpolation_map, texture_coords);
}

float sample_value_tricubic(in vec3 coords)
{
    
    vec4 features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}      

float sample_value_tricubic(in vec3 coords, out vec4 features)
{
    
    features = tricubic_features(coords);

    
    vec4 bias = tricubic_bias(coords);

    
    return dot(bias, features);
}     

float sample_residue_tricubic(in vec3 coords) 
{ 
    return sample_value_tricubic(coords) - u_volume.isovalue; 
}

float sample_residue_tricubic(in vec3 coords, out vec4 features) 
{ 
    return sample_value_tricubic(coords, features) - u_volume.isovalue; 
}

#endif
#endif
#ifndef COMPUTE_SECOND_DERIVATIVES
#ifndef COMPUTE_SECOND_DERIVATIVES
#define COMPUTE_SECOND_DERIVATIVES

#ifndef SAMPLE_TRILINEAR_VOLUME
#ifndef SAMPLE_VALUE_TRILINEAR
#define SAMPLE_VALUE_TRILINEAR

float sample_value_trilinear(in vec3 coords)
{
    vec3 texture_coords = coords * u_volume.inv_dimensions;
    return texture(u_textures.interpolation_map, texture_coords).a;
}

float sample_residue_trilinear(in vec3 coords) 
{ 
    return sample_value_trilinear(coords) - u_volume.isovalue; 
}

#endif
#endif

vec3 compute_second_derivatives(in vec3 p)
{
    #if INTERPOLATION_METHOD == 0

        
        vec3 s_x0yz_xy0z_xyz0 = vec3(
            sample_value_trilinear(vec3(p.x - 1.0, p.y, p.z)),
            sample_value_trilinear(vec3(p.x, p.y - 1.0, p.z)),
            sample_value_trilinear(vec3(p.x, p.y, p.z - 1.0))
        );

        vec3 s_x1yz_xy1z_xyz1 = vec3(
            sample_value_trilinear(vec3(p.x + 1.0, p.y, p.z)),
            sample_value_trilinear(vec3(p.x, p.y + 1.0, p.z)),
            sample_value_trilinear(vec3(p.x, p.y, p.z + 1.0))
        );

        
        return s_x0yz_xy0z_xyz0 + s_x1yz_xy1z_xyz1 - sample_value_trilinear(p) * 2.0;

    #elif INTERPOLATION_METHOD == 1

        return tricubic_features(p).xyz;

    #endif
}

#endif
#endif

/*
    The gradients produced are C^1 continuous
*/
vec3 compute_gradient(in vec3 p)
{
    
    vec3 x = p - 0.5;
    vec3 b = x - round(x);

    
    vec3 g0 = 0.5 - b;

    
    vec3 h0 = (0.5 + b) * 0.5;

    
    vec3 p0 = p - h0;
    vec3 p1 = p0 + 0.5;
 
    
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_value_trilinear(vec3(p0.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_value_trilinear(vec3(p1.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p1.z))  
    );

    
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    g0.x);

    
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    ) * 2.0;

    
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    g0.y);

    
    vec2 s_xdyz0_xdyz1 = (
        s_xy0z0_xy1z0_xy0z1_xy1z1.yw - 
        s_xy0z0_xy1z0_xy0z1_xy1z1.xz
    ) * 2.0;

    
    vec2 s_dxyz_xdyz = mix(
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1.y),
        vec2(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1.x), 
    g0.z);

    
    float s_xydz = (
        s_xyz0_xyz1_dxyz0_dxyz1.y - 
        s_xyz0_xyz1_dxyz0_dxyz1.x
    ) * 2.0;

    
    vec3 gradient = vec3(s_dxyz_xdyz, s_xydz);

    
    gradient /= u_volume.spacing_normalized;

    return gradient;
}
 
vec3 compute_gradient(in vec3 p, out mat3 hessian)
{
    
    vec3 x = p - 0.5;
    vec3 b = x - round(x);

    
    vec3 g0 = 0.5 - b;

    
    vec3 h0 = (0.5 + b) * 0.5;

    
    vec3 p0 = p - h0;
    vec3 p1 = p0 + 0.5;

    
    vec4 s_x0y0z0_x0y1z0_x0y0z1_x0y1z1 = vec4(
        sample_value_trilinear(vec3(p0.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p0.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p0.x, p1.y, p1.z))  
    );

    vec4 s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 = vec4(
        sample_value_trilinear(vec3(p1.x, p0.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p0.z)), 
        sample_value_trilinear(vec3(p1.x, p0.y, p1.z)), 
        sample_value_trilinear(vec3(p1.x, p1.y, p1.z))  
    );

    
    vec4 s_xy0z0_xy1z0_xy0z1_xy1z1 = mix(
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1, 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1, 
    g0.x);

    
    vec4 s_dxy0z0_dxy1z0_dxy0z1_dxy1z1 = (
        s_x1y0z0_x1y1z0_x1y0z1_x1y1z1 - 
        s_x0y0z0_x0y1z0_x0y0z1_x0y1z1
    ) * 2.0;

    
    vec4 s_xyz0_xyz1_dxyz0_dxyz1 = mix(
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw),
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz),
    g0.y);

    
    vec4 s_xdyz0_xdyz1_dxdyz0_dxdyz1 = (
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.yw, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.yw) -
        vec4(s_xy0z0_xy1z0_xy0z1_xy1z1.xz, s_dxy0z0_dxy1z0_dxy0z1_dxy1z1.xz)
    ) * 2.0;

    
    vec3 s_dxyz_xdyz_dxdyz = mix(
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.w, s_xdyz0_xdyz1_dxdyz0_dxdyz1.yw),
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.z, s_xdyz0_xdyz1_dxdyz0_dxdyz1.xz), 
    g0.z);

    
    vec3 s_xydz_dxydz_xdydz = (
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.yw, s_xdyz0_xdyz1_dxdyz0_dxdyz1.y) -
        vec3(s_xyz0_xyz1_dxyz0_dxyz1.xz, s_xdyz0_xdyz1_dxdyz0_dxdyz1.x)
    ) * 2.0;

    
    vec3 s_d2x_d2y_d2z = compute_second_derivatives(p);

    
    vec3 gradient = vec3(s_dxyz_xdyz_dxdyz.xy, s_xydz_dxydz_xdydz.x);

    
    hessian = mat3(
        s_d2x_d2y_d2z.x, s_dxyz_xdyz_dxdyz.z, s_xydz_dxydz_xdydz.y,  
        s_dxyz_xdyz_dxdyz.z, s_d2x_d2y_d2z.y, s_xydz_dxydz_xdydz.z,  
        s_xydz_dxydz_xdydz.y, s_xydz_dxydz_xdydz.z, s_d2x_d2y_d2z.z     
    );

    
    hessian /= outerProduct(u_volume.spacing_normalized, u_volume.spacing_normalized);
    gradient /= u_volume.spacing_normalized;

    
    return gradient;
}

#endif
#endif
#ifndef COMPUTE_CURVATURES
#define COMPUTE_CURVATURES

vec2 compute_curvatures(in vec3 gradient, in mat3 hessian)
{
    vec3 n = normalize(gradient);
    vec3 t0 = normalize(cross(n, abs(n.z) < 0.999 ? vec3(0,0,1) : vec3(0,1,0)));
    vec3 t1 = cross(n, t0);

    mat2x3 T = mat2x3(t0, t1);
    mat2 A = transpose(T) * hessian * T / length(gradient);

    float traceA = A[0][0] + A[1][1];
    float detA = A[0][0]*A[1][1] - A[0][1]*A[1][0];
    float disc = sqrt(max(traceA*traceA - 4.0*detA, 0.0));

    vec2 kappa = 0.5 * vec2(traceA - disc, traceA + disc);

    return kappa;
}

vec2 compute_curvatures(in vec3 gradient, in mat3 hessian, out vec3 eigenvectors[2])
{
    vec3 n = normalize(gradient);
    vec3 t0 = normalize(cross(n, abs(n.z) < 0.999 ? vec3(0,0,1) : vec3(0,1,0)));
    vec3 t1 = cross(n, t0);

    mat2x3 T = mat2x3(t0, t1);
    mat2 A = transpose(T) * hessian * T / length(gradient);

    float traceA = A[0][0] + A[1][1];
    float detA = A[0][0]*A[1][1] - A[0][1]*A[1][0];
    float disc = sqrt(max(traceA*traceA - 4.0*detA, 0.0));

    vec2 kappa = 0.5 * vec2(traceA - disc, traceA + disc);

    eigenvectors[0] = normalize(kappa.x * t0 + (kappa.x + A[1][1] - A[0][0]) * t1);
    eigenvectors[1] = normalize(kappa.y * t0 + (kappa.y + A[1][1] - A[0][0]) * t1);

    return kappa;
}

#endif
#ifndef COMPUTE_OCTANT
#define COMPUTE_OCTANT

int compute_octant(in vec3 d)
{
    ivec3 b = ivec3(step(0.0, d));         
    return (b.z << 2) | (b.y << 1) | b.x;
}

#endif

void main() 
{
    set_camera();
set_box();
set_ray();
set_trace();
set_hit();
set_cell();
set_block();
set_frag();
set_cubic();
set_quintic();

#if DEBUG_ENABLED == 1
set_debug();
#endif

#if DEBUG_ENABLED == 1
set_stats();
#endif
    ray.direction = normalize(v_ray_direction);
ray.inv_direction = 1.0 / ray.direction;

ray.signs = ivec3(ssign(ray.direction));
ray.octant = compute_octant(ray.direction);

ray.spacing = 1.0 / sum(abs(ray.direction));

box.min_position = vec3(0.0);
box.max_position = vec3(u_volume.dimensions);

vec2 box_min_max = intersection_box_bounds(box.min_position, box.max_position, camera.position);

vec2 box_entry_exit = intersect_box(box.min_position, box.max_position, camera.position, ray.inv_direction);

box_entry_exit = max(box_entry_exit, 0.0); 

if (box_entry_exit.x < box_entry_exit.y)
{
    
    box.min_entry_distance = box_min_max.x;
    box.max_exit_distance  = box_min_max.y;
    box.max_span_distance  = box_min_max.y - box_min_max.x;

    
    box.entry_distance = box_entry_exit.x;
    box.entry_position = box_entry_exit.x * ray.direction + camera.position;
    box.exit_distance  = box_entry_exit.y;
    box.exit_position  = box_entry_exit.y * ray.direction + camera.position;
    box.span_distance  = box_entry_exit.y - box_entry_exit.x;
    
    
    ray.start_distance = box.entry_distance;
    ray.start_position = box.entry_position;
    ray.end_distance   = box.exit_distance;
    ray.end_position   = box.exit_position;
    ray.span_distance  = box.span_distance;
}

#if BBOX_ENABLED == 1
vec2 bbox_entry_exit = intersect_box(u_bbox.min_position, u_bbox.max_position, camera.position, ray.inv_direction);

bbox_entry_exit = max(bbox_entry_exit, 0.0); 

if (bbox_entry_exit.x < bbox_entry_exit.y)
{
    
    ray.start_distance = bbox_entry_exit.x;
    ray.start_position = bbox_entry_exit.x * ray.direction + camera.position;
    ray.end_distance   = bbox_entry_exit.y;
    ray.end_position   = bbox_entry_exit.y * ray.direction + camera.position;
    ray.span_distance  = bbox_entry_exit.y - bbox_entry_exit.x;
}
#endif
    #if MARCHING_METHOD == 0
#if SKIPPING_ENABLED == 1
#if SKIPPING_STRATEGY == 0
block.exit_distance = ray.start_distance;
block.exit_position = camera.position + ray.direction * block.exit_distance; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position; 

block.coords = ivec3(round(block.exit_position)) / u_volume.block_size;
#if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position)); 
#endif

#if INTERPOLATION_METHOD == 0
cubic.residuals[3] = sample_residue_trilinear(cell.exit_position);

#elif INTERPOLATION_METHOD == 1
quintic.residuals[3] = sample_residue_tricubic(cell.exit_position, quintic.features[3]);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int j = 0; j < MAX_BLOCKS; j++) 
{
    #if SKIPPING_METHOD == 0
block.occupied = sample_occupancy(block.coords);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

block.coords += block.exit_normal * ray.signs;

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 1
block.skip_coords = sample_distance_isotropic(block.coords, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
    
#elif SKIPPING_METHOD == 2
block.skip_coords = sample_distance_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 3
ivec3 min_coords, max_coords;
sample_distance_extended_isotropic(block.coords, block.occupied, min_coords, max_coords);
min_coords = max(min_coords, 1);
max_coords = max(max_coords, 1);

block.skip_coords = mmix(min_coords, max_coords, map(-1, 1, ray.signs));

block.min_coords = block.coords - (min_coords - 1);
block.max_coords = block.coords + (max_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
   
#elif SKIPPING_METHOD == 4
block.skip_coords = sample_distance_extended_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
#endif

    if (!(block.occupied || block.terminated)) continue;

    #if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position)); 
#endif

#if INTERPOLATION_METHOD == 0
cubic.residuals[3] = sample_residue_trilinear(cell.exit_position);

#elif INTERPOLATION_METHOD == 1
quintic.residuals[3] = sample_residue_tricubic(cell.exit_position, quintic.features[3]);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

    for (int i = 0; i < MAX_CELLS_IN_BLOCK; i++) 
    {
        cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;

cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

cell.exit_distance = intersect_box_exit(cell.min_position, cell.max_position, camera.position, ray.inv_direction, cell.exit_normal);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

cell.span_distance = cell.exit_distance - cell.entry_distance;

cell.coords += cell.exit_normal * ray.signs;

cell.terminated = cell.exit_distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_cells += 1;
#endif
        #if INTERPOLATION_METHOD == 0
#if BERNSTEIN_ENABLED == 1
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

if (sign_change(cubic.bernstein_coeffs))
{
    
    cubic.coeffs = cubic.residuals * cubic_inv_vander;

    
    #if VARIATION_ENABLED == 1
    cell.intersected = poly3_has_root(cubic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.coeffs = cubic.residuals * cubic_inv_vander;

cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif

#elif INTERPOLATION_METHOD == 1
#if BERNSTEIN_ENABLED == 1
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 bernstein_coeffs = matrixCompMult(quad_bernstein * residuals * cubic_bernstein, quintic_bernstein_weights);

sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

if (sign_change(quintic.bernstein_coeffs))
{
    
    mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
    sum_anti_diags(coeffs, quintic.coeffs);

    
    #if VARIATION_ENABLED == 1
    cell.intersected = sign_change(quintic.residuals) || poly5_has_root(quintic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;

sum_anti_diags(coeffs, quintic.coeffs);

cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif
#endif

        if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) break; 
    }   

    if (cell.intersected || cell.terminated) break;
}

if (cell.intersected) 
{
    
    #if INTERPOLATION_METHOD == 0
poly3_roots(cubic.roots, cubic.coeffs, 0.0, 1.0);
cubic.root = mmin(cubic.roots);

eval_poly(cubic.coeffs, cubic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, cubic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_trilinear(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 4; ++n) 
cubic.num_roots += (cubic.roots[n] != cubic.roots[3]) ? 1 : 0;

#elif INTERPOLATION_METHOD == 1
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
quintic.root = mmin(quintic.roots);

eval_poly(quintic.coeffs, quintic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, quintic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_tricubic(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 6; ++n) 
quintic.num_roots += (quintic.roots[n] != quintic.roots[5]) ? 1 : 0;
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !cell.terminated;
    hit.discarded = true;
    hit.escaped = false;
}

#elif SKIPPING_STRATEGY == 1
block.exit_distance = ray.start_distance;
block.exit_position = camera.position + ray.direction * block.exit_distance; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position; 

block.coords = ivec3(round(block.exit_position)) / u_volume.block_size;
#if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position)); 
#endif

#if INTERPOLATION_METHOD == 0
cubic.residuals[3] = sample_residue_trilinear(cell.exit_position);

#elif INTERPOLATION_METHOD == 1
quintic.residuals[3] = sample_residue_tricubic(cell.exit_position, quintic.features[3]);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int k = 0; k < MAX_GROUPS; k++) 
{
    for (int j = 0; j < MAX_BLOCKS_IN_GROUP; j++) 
    {
        #if SKIPPING_METHOD == 0
block.occupied = sample_occupancy(block.coords);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

block.coords += block.exit_normal * ray.signs;

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 1
block.skip_coords = sample_distance_isotropic(block.coords, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
    
#elif SKIPPING_METHOD == 2
block.skip_coords = sample_distance_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 3
ivec3 min_coords, max_coords;
sample_distance_extended_isotropic(block.coords, block.occupied, min_coords, max_coords);
min_coords = max(min_coords, 1);
max_coords = max(max_coords, 1);

block.skip_coords = mmix(min_coords, max_coords, map(-1, 1, ray.signs));

block.min_coords = block.coords - (min_coords - 1);
block.max_coords = block.coords + (max_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
   
#elif SKIPPING_METHOD == 4
block.skip_coords = sample_distance_extended_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
#endif

        if (block.occupied || block.terminated) break;
    }

    if (!(block.occupied || block.terminated)) continue;
    
    #if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position)); 
#endif

#if INTERPOLATION_METHOD == 0
cubic.residuals[3] = sample_residue_trilinear(cell.exit_position);

#elif INTERPOLATION_METHOD == 1
quintic.residuals[3] = sample_residue_tricubic(cell.exit_position, quintic.features[3]);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

    for (int i = 0; i < MAX_CELLS_IN_BLOCK; i++) 
    {
        cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;

cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

cell.exit_distance = intersect_box_exit(cell.min_position, cell.max_position, camera.position, ray.inv_direction, cell.exit_normal);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

cell.span_distance = cell.exit_distance - cell.entry_distance;

cell.coords += cell.exit_normal * ray.signs;

cell.terminated = cell.exit_distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_cells += 1;
#endif
        #if INTERPOLATION_METHOD == 0
#if BERNSTEIN_ENABLED == 1
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

if (sign_change(cubic.bernstein_coeffs))
{
    
    cubic.coeffs = cubic.residuals * cubic_inv_vander;

    
    #if VARIATION_ENABLED == 1
    cell.intersected = poly3_has_root(cubic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.coeffs = cubic.residuals * cubic_inv_vander;

cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif

#elif INTERPOLATION_METHOD == 1
#if BERNSTEIN_ENABLED == 1
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 bernstein_coeffs = matrixCompMult(quad_bernstein * residuals * cubic_bernstein, quintic_bernstein_weights);

sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

if (sign_change(quintic.bernstein_coeffs))
{
    
    mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
    sum_anti_diags(coeffs, quintic.coeffs);

    
    #if VARIATION_ENABLED == 1
    cell.intersected = sign_change(quintic.residuals) || poly5_has_root(quintic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;

sum_anti_diags(coeffs, quintic.coeffs);

cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif
#endif

        if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) break; 
    }   

    if (cell.intersected || cell.terminated) break;

    #if DEBUG_ENABLED == 1
    stats.num_groups += 1;
    #endif
}

if (cell.intersected) 
{
    
    #if INTERPOLATION_METHOD == 0
poly3_roots(cubic.roots, cubic.coeffs, 0.0, 1.0);
cubic.root = mmin(cubic.roots);

eval_poly(cubic.coeffs, cubic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, cubic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_trilinear(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 4; ++n) 
cubic.num_roots += (cubic.roots[n] != cubic.roots[3]) ? 1 : 0;

#elif INTERPOLATION_METHOD == 1
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
quintic.root = mmin(quintic.roots);

eval_poly(quintic.coeffs, quintic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, quintic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_tricubic(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 6; ++n) 
quintic.num_roots += (quintic.roots[n] != quintic.roots[5]) ? 1 : 0;
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !cell.terminated;
    hit.discarded = true;
    hit.escaped = false;
}
#endif

#else
#if SKIPPING_ENABLED == 1
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#else
cell.exit_distance = ray.start_distance;
cell.exit_position = ray.start_position;
cell.coords = ivec3(round(cell.exit_position)); 
#endif

#if INTERPOLATION_METHOD == 0
cubic.residuals[3] = sample_residue_trilinear(cell.exit_position);

#elif INTERPOLATION_METHOD == 1
quintic.residuals[3] = sample_residue_tricubic(cell.exit_position, quintic.features[3]);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int i = 0; i < MAX_CELLS; i++) 
{
    cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;

cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

cell.exit_distance = intersect_box_exit(cell.min_position, cell.max_position, camera.position, ray.inv_direction, cell.exit_normal);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

cell.span_distance = cell.exit_distance - cell.entry_distance;

cell.coords += cell.exit_normal * ray.signs;

cell.terminated = cell.exit_distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_cells += 1;
#endif
    #if INTERPOLATION_METHOD == 0
#if BERNSTEIN_ENABLED == 1
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.bernstein_coeffs = cubic.residuals * cubic_bernstein;

if (sign_change(cubic.bernstein_coeffs))
{
    
    cubic.coeffs = cubic.residuals * cubic_inv_vander;

    
    #if VARIATION_ENABLED == 1
    cell.intersected = poly3_has_root(cubic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
cubic.residuals[0] = cubic.residuals[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    cubic.residuals[i] = sample_residue_trilinear(position);
}

cubic.coeffs = cubic.residuals * cubic_inv_vander;

cell.intersected = sign_change(cubic.residuals) || is_cubic_solvable(cubic.coeffs, sampling_points.xw, cubic.residuals.xw);

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif

#elif INTERPOLATION_METHOD == 1
#if BERNSTEIN_ENABLED == 1
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 bernstein_coeffs = matrixCompMult(quad_bernstein * residuals * cubic_bernstein, quintic_bernstein_weights);

sum_anti_diags(bernstein_coeffs, quintic.bernstein_coeffs);

if (sign_change(quintic.bernstein_coeffs))
{
    
    mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
    sum_anti_diags(coeffs, quintic.coeffs);

    
    #if VARIATION_ENABLED == 1
    cell.intersected = sign_change(quintic.residuals) || poly5_has_root(quintic.coeffs, 0.0, 1.0);
    #else
    cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    #endif

    #if DEBUG_ENABLED == 1
    stats.num_intersection_tests += 1;
    #endif
}

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
#endif
#else
quintic.features[0] = quintic.features[3];

#pragma unroll
for (int i = 1; i < 4; i++) 
{
    
    vec3 position = mix(cell.entry_position, cell.exit_position, sampling_points[i]);

    
    quintic.features[i] = tricubic_features(position);

    
    quintic.biases[i-1] = tricubic_bias(position);
}

mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_volume.isovalue;

quintic.residuals = vec4(quintic.residuals[3], residuals[1][0], residuals[2][1], residuals[3][2]);

mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;

sum_anti_diags(coeffs, quintic.coeffs);

cell.intersected = sign_change(quintic.residuals) || eval_poly_sign_change(quintic.coeffs);
    

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 3;
stats.num_intersection_tests += 1;
#endif
#endif
#endif

    if (cell.intersected || cell.terminated) break;
}

if (cell.intersected) 
{
    
    #if INTERPOLATION_METHOD == 0
poly3_roots(cubic.roots, cubic.coeffs, 0.0, 1.0);
cubic.root = mmin(cubic.roots);

eval_poly(cubic.coeffs, cubic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, cubic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_trilinear(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 4; ++n) 
cubic.num_roots += (cubic.roots[n] != cubic.roots[3]) ? 1 : 0;

#elif INTERPOLATION_METHOD == 1
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
quintic.root = mmin(quintic.roots);

eval_poly(quintic.coeffs, quintic.root, hit.derivative);

hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

hit.distance = mix(cell.entry_distance, cell.exit_distance, quintic.root);
hit.position = camera.position + ray.direction * hit.distance;

hit.value = sample_value_tricubic(hit.position);
hit.residue = hit.value - u_volume.isovalue;

hit.gradient = compute_gradient(hit.position, hit.hessian);

hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

for (int n = 0; n < 6; ++n) 
quintic.num_roots += (quintic.roots[n] != quintic.roots[5]) ? 1 : 0;
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !cell.terminated;
    hit.discarded = true;
    hit.escaped = false;
}
#endif

#elif MARCHING_METHOD == 1
#if SKIPPING_ENABLED == 1
#if SKIPPING_STRATEGY == 0
block.exit_distance = ray.start_distance;
block.exit_position = camera.position + ray.direction * block.exit_distance; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position; 

block.coords = ivec3(round(block.exit_position)) / u_volume.block_size;
trace.spacing = ray.spacing / 5.0;

#if SKIPPING_ENABLED == 1
trace.distance = block.entry_distance - trace.spacing * random(block.entry_position);
trace.position = camera.position + ray.direction * trace.distance;

#else
trace.distance = ray.start_distance - trace.spacing * random(ray.start_position);
trace.position = camera.position + ray.direction * trace.distance; 
#endif

#if INTERPOLATION_METHOD == 0
trace.residue = sample_residue_trilinear(trace.position);

#elif INTERPOLATION_METHOD == 1
trace.residue = sample_residue_tricubic(trace.position);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int j = 0; j < MAX_BLOCKS; j++) 
{
    #if SKIPPING_METHOD == 0
block.occupied = sample_occupancy(block.coords);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

block.coords += block.exit_normal * ray.signs;

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 1
block.skip_coords = sample_distance_isotropic(block.coords, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
    
#elif SKIPPING_METHOD == 2
block.skip_coords = sample_distance_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 3
ivec3 min_coords, max_coords;
sample_distance_extended_isotropic(block.coords, block.occupied, min_coords, max_coords);
min_coords = max(min_coords, 1);
max_coords = max(max_coords, 1);

block.skip_coords = mmix(min_coords, max_coords, map(-1, 1, ray.signs));

block.min_coords = block.coords - (min_coords - 1);
block.max_coords = block.coords + (max_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
   
#elif SKIPPING_METHOD == 4
block.skip_coords = sample_distance_extended_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
#endif

    if (!(block.occupied || block.terminated)) continue;

    trace.spacing = ray.spacing / 5.0;

#if SKIPPING_ENABLED == 1
trace.distance = block.entry_distance - trace.spacing * random(block.entry_position);
trace.position = camera.position + ray.direction * trace.distance;

#else
trace.distance = ray.start_distance - trace.spacing * random(ray.start_position);
trace.position = camera.position + ray.direction * trace.distance; 
#endif

#if INTERPOLATION_METHOD == 0
trace.residue = sample_residue_trilinear(trace.position);

#elif INTERPOLATION_METHOD == 1
trace.residue = sample_residue_tricubic(trace.position);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

    for (int i = 0; i < MAX_TRACES_IN_BLOCK; i++) 
    {
        trace.prev_distance = trace.distance;

trace.distance += trace.spacing;

trace.position = camera.position + ray.direction * trace.distance; 

trace.terminated = trace.distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_traces += 1;
#endif
        #if INTERPOLATION_METHOD == 0
trace.prev_residue = trace.residue;

trace.residue = sample_residue_trilinear(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);

#elif INTERPOLATION_METHOD == 1
trace.prev_residue = trace.residue;

trace.residue = sample_residue_tricubic(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);
#endif

        if (trace.intersected || trace.terminated || trace.distance > block.exit_distance) break;
    }   

    if (trace.intersected || trace.terminated) break; 
}

if (trace.intersected)
{
    
    #if INTERPOLATION_METHOD == 0
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_trilinear(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

#elif INTERPOLATION_METHOD == 1
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_tricubic(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !trace.terminated;
    hit.discarded = true;
    hit.escaped = false;
}

#elif SKIPPING_STRATEGY == 1
block.exit_distance = ray.start_distance;
block.exit_position = camera.position + ray.direction * block.exit_distance; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position; 

block.coords = ivec3(round(block.exit_position)) / u_volume.block_size;
trace.spacing = ray.spacing / 5.0;

#if SKIPPING_ENABLED == 1
trace.distance = block.entry_distance - trace.spacing * random(block.entry_position);
trace.position = camera.position + ray.direction * trace.distance;

#else
trace.distance = ray.start_distance - trace.spacing * random(ray.start_position);
trace.position = camera.position + ray.direction * trace.distance; 
#endif

#if INTERPOLATION_METHOD == 0
trace.residue = sample_residue_trilinear(trace.position);

#elif INTERPOLATION_METHOD == 1
trace.residue = sample_residue_tricubic(trace.position);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int k = 0; k < MAX_GROUPS; k++) 
{
    for (int j = 0; j < MAX_BLOCKS_IN_GROUP; j++) 
    {
        #if SKIPPING_METHOD == 0
block.occupied = sample_occupancy(block.coords);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

block.coords += block.exit_normal * ray.signs;

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 1
block.skip_coords = sample_distance_isotropic(block.coords, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
    
#elif SKIPPING_METHOD == 2
block.skip_coords = sample_distance_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;  

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif

#elif SKIPPING_METHOD == 3
ivec3 min_coords, max_coords;
sample_distance_extended_isotropic(block.coords, block.occupied, min_coords, max_coords);
min_coords = max(min_coords, 1);
max_coords = max(max_coords, 1);

block.skip_coords = mmix(min_coords, max_coords, map(-1, 1, ray.signs));

block.min_coords = block.coords - (min_coords - 1);
block.max_coords = block.coords + (max_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
   
#elif SKIPPING_METHOD == 4
block.skip_coords = sample_distance_extended_anisotropic(block.coords, ray.octant, block.occupied);
block.skip_coords = max(block.skip_coords, 1);

block.min_coords = block.coords - (block.skip_coords - 1);
block.max_coords = block.coords + (block.skip_coords - 1);

block.min_position = vec3((block.min_coords + 0) * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;   

block.min_position -= 0.001;
block.max_position += 0.001; 

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

block.exit_distance = intersect_box_exit(block.min_position, block.max_position, camera.position, ray.inv_direction, block.exit_normal);
block.exit_position = camera.position + ray.direction * block.exit_distance;

block.span_distance = block.exit_distance - block.entry_distance;

ivec3 exit_coords = ivec3(round(block.exit_position)) / u_volume.block_size;
ivec3 skipped_coords = block.coords + block.skip_coords * ray.signs;
block.coords = mmix(exit_coords, skipped_coords, block.exit_normal);

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
stats.num_blocks += 1;
#endif
#endif

        if (block.occupied || block.terminated) break;
    }

    if (!(block.occupied || block.terminated)) continue;

    trace.spacing = ray.spacing / 5.0;

#if SKIPPING_ENABLED == 1
trace.distance = block.entry_distance - trace.spacing * random(block.entry_position);
trace.position = camera.position + ray.direction * trace.distance;

#else
trace.distance = ray.start_distance - trace.spacing * random(ray.start_position);
trace.position = camera.position + ray.direction * trace.distance; 
#endif

#if INTERPOLATION_METHOD == 0
trace.residue = sample_residue_trilinear(trace.position);

#elif INTERPOLATION_METHOD == 1
trace.residue = sample_residue_tricubic(trace.position);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

    for (int i = 0; i < MAX_TRACES_IN_BLOCK; i++) 
    {
        trace.prev_distance = trace.distance;

trace.distance += trace.spacing;

trace.position = camera.position + ray.direction * trace.distance; 

trace.terminated = trace.distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_traces += 1;
#endif
        #if INTERPOLATION_METHOD == 0
trace.prev_residue = trace.residue;

trace.residue = sample_residue_trilinear(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);

#elif INTERPOLATION_METHOD == 1
trace.prev_residue = trace.residue;

trace.residue = sample_residue_tricubic(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);
#endif

        if (trace.intersected || trace.terminated || trace.distance > block.exit_distance) break;
    }   

    if (trace.intersected || trace.terminated) break; 

    #if DEBUG_ENABLED == 1
    stats.num_groups += 1;
    #endif
}

if (trace.intersected)
{
    
    #if INTERPOLATION_METHOD == 0
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_trilinear(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

#elif INTERPOLATION_METHOD == 1
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_tricubic(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !trace.terminated;
    hit.discarded = true;
    hit.escaped = false;
}
#endif

#else
trace.spacing = ray.spacing / 5.0;

#if SKIPPING_ENABLED == 1
trace.distance = block.entry_distance - trace.spacing * random(block.entry_position);
trace.position = camera.position + ray.direction * trace.distance;

#else
trace.distance = ray.start_distance - trace.spacing * random(ray.start_position);
trace.position = camera.position + ray.direction * trace.distance; 
#endif

#if INTERPOLATION_METHOD == 0
trace.residue = sample_residue_trilinear(trace.position);

#elif INTERPOLATION_METHOD == 1
trace.residue = sample_residue_tricubic(trace.position);
#endif

#if DEBUG_ENABLED == 1
stats.num_texture_fetches += 1;
#endif

for (int i = 0; i < MAX_TRACES; i++) 
{
    trace.prev_distance = trace.distance;

trace.distance += trace.spacing;

trace.position = camera.position + ray.direction * trace.distance; 

trace.terminated = trace.distance > ray.end_distance; 

#if DEBUG_ENABLED == 1
stats.num_traces += 1;
#endif
    #if INTERPOLATION_METHOD == 0
trace.prev_residue = trace.residue;

trace.residue = sample_residue_trilinear(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);

#elif INTERPOLATION_METHOD == 1
trace.prev_residue = trace.residue;

trace.residue = sample_residue_tricubic(trace.position);

trace.intersected = sign_change(trace.residue, trace.prev_residue);
#endif

    if (trace.intersected || trace.terminated) break;
}

if (trace.intersected)
{
    
    #if INTERPOLATION_METHOD == 0
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_trilinear(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

#elif INTERPOLATION_METHOD == 1
vec2 distances = vec2(trace.prev_distance, trace.distance);
vec2 residues = vec2(trace.prev_residue, trace.residue);

#pragma unroll
for (int i = 0; i < 10; ++i)
{
    
    hit.derivative = diff(residues) / diff(distances);
    hit.distance = distances.x - residues.x / hit.derivative;
    hit.position = camera.position + ray.direction * hit.distance; 

    
    hit.residue = sample_value_tricubic(hit.position) - u_volume.isovalue;
    
    
    if (sign_change(residues.x, hit.residue))
    {
        distances.y = hit.distance;
        residues.y = hit.residue;
    }
    else
    {
        distances.x = hit.distance;
        residues.x = hit.residue;
    }
}

hit.value = hit.residue + u_volume.isovalue;

hit.orientation = -ssign(hit.derivative);

hit.gradient = compute_gradient(hit.position, hit.hessian);
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

hit.normal = normalize(hit.gradient);

hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);
#endif

    hit.undefined = false;

    
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    
    hit.discarded = hit.escaped;
}
else
{
    
    hit.undefined = !trace.terminated;
    hit.discarded = true;
    hit.escaped = false;
}
#endif
#endif
    vec3 light_position = camera.position;
vec3 light_vector = light_position - hit.position;
vec3 view_vector = camera.position - hit.position;

vec3 light_direction = normalize(light_vector * u_volume.spacing_normalized);
vec3 view_direction = normalize(view_vector * u_volume.spacing_normalized);
vec3 halfway_direction = normalize(light_direction + view_direction);

float light_angle = dot(light_direction, hit.normal);
float view_angle = dot(view_direction, hit.normal);
float halfway_angle = dot(halfway_direction, hit.normal);

float lambertian = clamp(light_angle, 0.0, 1.0);
float specular = clamp(halfway_angle, 0.0, 1.0);
specular = pow(specular, u_shading.shininess);

float modulate_edges = smoothstep(0.0, 0.5, abs(view_angle));
float modulate_gradient = mix(0.2, 1.0, smoothstep(0.0, 0.1, length(hit.gradient)));
float modulate_curvature = mean(smoothstep(-1.2, 0.0, hit.curvatures.x), smoothstep(-1.2, 0.0, hit.curvatures.y)); 

modulate_edges = mix(1.0, modulate_edges, u_shading.modulate_edges);
modulate_gradient = mix(1.0, modulate_gradient, u_shading.modulate_gradient);
modulate_curvature = mix(1.0, modulate_curvature, u_shading.modulate_curvature);

frag.color_material = colormap(hit.value, u_shading.colormap);
frag.color_ambient = frag.color_material * u_shading.reflect_ambient;
frag.color_diffuse = frag.color_material * u_shading.reflect_diffuse  * lambertian;
frag.color_specular = frag.color_material * u_shading.reflect_specular * specular;
frag.color_directional = frag.color_diffuse + frag.color_specular;

frag.color_directional *= min(modulate_edges, modulate_gradient);
frag.color_ambient *= modulate_curvature;
frag.color = frag.color_ambient + frag.color_directional;

fragColor = vec4(frag.color, 1.0);

    #if DEBUG_ENABLED == 1
    vec4 debug_ray_discarded = to_color(ray.discarded);

vec4 debug_ray_direction = to_color(ray.direction * 0.5 + 0.5);

vec4 debug_ray_signs = to_color(vec3(ray.signs) * 0.5 + 0.5);

vec4 debug_ray_spacing = to_color(ray.spacing);

vec4 debug_ray_start_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, ray.start_distance));

vec4 debug_ray_end_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, ray.end_distance));

vec4 debug_ray_span_distance = to_color(map(0.0, box.max_span_distance, ray.span_distance));

vec4 debug_ray_start_position = to_color(map(box.min_position, box.max_position, ray.start_position));

vec4 debug_ray_end_position = to_color(map(box.min_position, box.max_position, ray.end_position));

switch (u_debug.option - 100)
{
    case  1: fragColor = debug_ray_discarded;       break;
    case  2: fragColor = debug_ray_direction;       break;
    case  3: fragColor = debug_ray_signs;           break;
    case  4: fragColor = debug_ray_spacing;         break;
    case  5: fragColor = debug_ray_start_distance;  break;
    case  6: fragColor = debug_ray_end_distance;    break;
    case  7: fragColor = debug_ray_span_distance;   break;
    case  8: fragColor = debug_ray_start_position;  break;
    case  9: fragColor = debug_ray_end_position;    break;
} 
vec4 debug_cell_intersected = to_color(cell.intersected);

vec4 debug_cell_terminated = to_color(cell.terminated);

vec4 debug_cell_coords = to_color(vec3(cell.coords) * u_volume.inv_dimensions);

vec4 debug_cell_exit_normal = to_color(vec3(cell.exit_normal));

vec4 debug_cell_entry_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, cell.entry_distance)); 

vec4 debug_cell_exit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, cell.exit_distance)); 

vec4 debug_cell_span_distance = to_color(cell.span_distance / length(cell.max_position - cell.min_position)); 

vec4 debug_cell_min_position = to_color(map(box.min_position, box.max_position, cell.min_position)); 

vec4 debug_cell_max_position = to_color(map(box.min_position, box.max_position, cell.max_position)); 

switch (u_debug.option - 200)
{ 
    case 1: fragColor = debug_cell_intersected;        break;
    case 2: fragColor = debug_cell_terminated;         break;
    case 3: fragColor = debug_cell_coords;             break;
    case 4: fragColor = debug_cell_exit_normal;        break;
    case 5: fragColor = debug_cell_max_position;       break;
    case 6: fragColor = debug_cell_min_position;       break;
    case 7: fragColor = debug_cell_entry_distance;     break;
    case 8: fragColor = debug_cell_exit_distance;      break;
    case 9: fragColor = debug_cell_span_distance;      break;
}  
vec4 debug_trace_intersected = to_color(trace.intersected);

vec4 debug_trace_terminated = to_color(trace.terminated);

vec4 debug_trace_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, trace.distance));

vec4 debug_trace_position = to_color(map(box.min_position, box.max_position, trace.position));

vec4 debug_trace_residue = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-1.0, 1.0, trace.residue / MILLI_TOLERANCE)));

vec4 debug_trace_span_residue = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-1.0, 1.0, (trace.residue - trace.prev_residue) / MILLI_TOLERANCE)));

switch (u_debug.option - 300)
{ 
    case  1: fragColor = debug_trace_intersected;     break;
    case  2: fragColor = debug_trace_terminated;      break;
    case  3: fragColor = debug_trace_distance;        break;
    case  4: fragColor = debug_trace_position;        break;
    case  5: fragColor = debug_trace_residue;         break;
    case  6: fragColor = debug_trace_span_residue;    break;
}  
vec4 debug_block_skip_coords = to_color(vec3(block.skip_coords) / 31.0);

vec4 debug_block_occupied = to_color(block.occupied);

vec4 debug_block_terminated = to_color(block.terminated);

vec4 debug_block_coords = to_color(vec3(block.coords) / vec3(u_volume.blocked_dimensions - 1));

vec4 debug_block_exit_normal = to_color(vec3(block.exit_normal));

vec4 debug_block_entry_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, block.entry_distance));

vec4 debug_block_exit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, block.exit_distance));

vec4 debug_block_span_distance = to_color(block.span_distance / length(block.max_position - block.min_position)); 

vec4 debug_block_min_position = to_color(map(box.min_position, box.max_position, block.min_position));

vec4 debug_block_max_position = to_color(map(box.min_position, box.max_position, block.max_position));

switch (u_debug.option - 400)
{
    case  1: fragColor = debug_block_skip_coords;  break;
    case  2: fragColor = debug_block_occupied;       break;
    case  3: fragColor = debug_block_terminated;     break;
    case  4: fragColor = debug_block_coords;         break;
    case  5: fragColor = debug_block_exit_normal;    break;
    case  6: fragColor = debug_block_entry_distance; break;
    case  7: fragColor = debug_block_exit_distance;  break;
    case  8: fragColor = debug_block_span_distance;  break;
    case  9: fragColor = debug_block_min_position;   break;
    case 10: fragColor = debug_block_max_position;   break;
}  
vec4 debug_hit_discarded = to_color(hit.discarded);

vec4 debug_hit_escaped = to_color(hit.escaped);

vec4 debug_hit_undefined = to_color(hit.undefined);

vec4 debug_hit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, hit.distance));

vec4 debug_hit_position = to_color(map(box.min_position, box.max_position, hit.position));

vec4 debug_hit_residue = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-0.001, 0.001, hit.residue)));

vec4 debug_hit_derivative = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, map(-0.1, 0.1, hit.derivative)));

vec4 debug_hit_orientation = to_color(map(-1.0, 1.0, hit.orientation));

vec4 debug_hit_normal = to_color((map(-1.0, 1.0, hit.normal)));

vec4 debug_hit_gradient = to_color(map(-1.0, 1.0, normalize(hit.gradient)) * length(hit.gradient));

vec4 debug_hit_steepness = to_color(map(0.0, 1.0, length(hit.gradient)));

vec4 debug_hit_curvatures = to_color(mmix2(                
    COLOR.DARK_CYAN, COLOR.DARK_BLUE, COLOR.MAGENTA, 
    COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.ORANGE,  
    COLOR.MAGENTA,   COLOR.ORANGE,    COLOR.GOLD,    
    map(-2.0, 2.0, hit.curvatures)                   
));                 

switch (u_debug.option - 450)
{ 
    case  1: fragColor = debug_hit_discarded;       break;
    case  2: fragColor = debug_hit_escaped;         break;
    case  3: fragColor = debug_hit_undefined;       break;
    case  4: fragColor = debug_hit_distance;        break;
    case  5: fragColor = debug_hit_position;        break;
    case  6: fragColor = debug_hit_residue;         break;
    case  7: fragColor = debug_hit_derivative;      break;
    case  8: fragColor = debug_hit_orientation;     break;
    case  9: fragColor = debug_hit_normal;          break;
    case 10: fragColor = debug_hit_gradient;        break;
    case 11: fragColor = debug_hit_steepness;       break;
    case 12: fragColor = debug_hit_curvatures;      break;
    
    
    
}  
vec4 debug_frag_color_material = to_color(frag.color_material);

vec4 debug_frag_color_ambient = to_color(frag.color_ambient);

vec4 debug_frag_color_diffuse = to_color(frag.color_diffuse);

vec4 debug_frag_color_specular = to_color(frag.color_specular);

vec4 debug_frag_color_directional = to_color(frag.color_directional);

vec4 debug_frag_color = to_color(frag.color);

vec4 debug_frag_luminance = to_color(dot(frag.color, vec3(0.2126, 0.7152, 0.0722)));

switch (u_debug.option - 500)
{
   
    case 11: fragColor = debug_frag_color_material;     break; 
    case 12: fragColor = debug_frag_color_ambient;      break; 
    case 13: fragColor = debug_frag_color_diffuse;      break; 
    case 14: fragColor = debug_frag_color_specular;     break; 
    case 15: fragColor = debug_frag_color_directional;  break; 
    case 16: fragColor = debug_frag_color;              break; 
    case 17: fragColor = debug_frag_luminance;          break; 
}               
vec4 debug_box_entry_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, box.entry_distance));

vec4 debug_box_exit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, box.exit_distance));

vec4 debug_box_span_distance = to_color(map(0.0, box.max_span_distance, box.span_distance));

vec4 debug_box_entry_position = to_color(map(box.min_position, box.max_position, box.entry_position));

vec4 debug_box_exit_position = to_color(map(box.min_position, box.max_position, box.exit_position));

switch (u_debug.option - 600)
{
    case 1: fragColor = debug_box_entry_distance;     break;
    case 2: fragColor = debug_box_exit_distance;      break;
    case 3: fragColor = debug_box_span_distance;      break;
    case 4: fragColor = debug_box_entry_position;     break;
    case 5: fragColor = debug_box_exit_position;      break;
}   
vec4 debug_camera_direction = to_color(camera.direction * 0.5 + 0.5);

vec4 debug_camera_position = to_color(map(box.min_position, box.max_position, camera.position));

switch (u_debug.option - 700)
{
    case 1: fragColor = debug_camera_position;  break;
    case 2: fragColor = debug_camera_direction; break;
}          
vec4 debug_cubic_root = to_color(cubic.root);

vec4 debug_cubic_num_roots = to_color(float(cubic.num_roots) / 3.0);

vec4 cubic_coeffs = abs_l1_normalization(cubic.coeffs);

vec4 debug_cubic_coeffs = to_color(
    cubic_coeffs.x * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + 
    cubic_coeffs.y * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + 
    cubic_coeffs.z * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + 
    cubic_coeffs.w * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   
); 

vec4 cubic_bernstein_coeffs = abs_l1_normalization(cubic.bernstein_coeffs);

vec4 debug_cubic_bernstein_coeffs = to_color(
    cubic_bernstein_coeffs.x * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + 
    cubic_bernstein_coeffs.y * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + 
    cubic_bernstein_coeffs.z * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + 
    cubic_bernstein_coeffs.w * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   
); 

vec4 debug_cubic_bernstein_spread = to_color(mmax(cubic.bernstein_coeffs) - mmin(cubic.bernstein_coeffs));

switch (u_debug.option - 800)
{ 
    case 1: fragColor = debug_cubic_root;             break;
    case 2: fragColor = debug_cubic_num_roots;        break;
    case 3: fragColor = debug_cubic_coeffs;           break;
    case 4: fragColor = debug_cubic_bernstein_coeffs; break;
    case 5: fragColor = debug_cubic_bernstein_spread; break;
}          
vec4 debug_quintic_root = to_color(quintic.root);

vec4 debug_quintic_num_roots = to_color(float(quintic.num_roots) / 5.0);

float quintic_coeffs[6]; abs_l1_normalization(quintic.coeffs, quintic_coeffs);

vec4 debug_quintic_coeffs = to_color(
    quintic_coeffs[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + 
    quintic_coeffs[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + 
    quintic_coeffs[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + 
    quintic_coeffs[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + 
    quintic_coeffs[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + 
    quintic_coeffs[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   
); 

float quintic_bernstein_coeffs[6]; abs_l1_normalization(quintic.bernstein_coeffs, quintic_bernstein_coeffs);

vec4 debug_quintic_bernstein_coeffs = to_color(  
    quintic_bernstein_coeffs[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + 
    quintic_bernstein_coeffs[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + 
    quintic_bernstein_coeffs[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + 
    quintic_bernstein_coeffs[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + 
    quintic_bernstein_coeffs[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + 
    quintic_bernstein_coeffs[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   
); 

vec4 debug_quintic_bernstein_spread = to_color(mmax(quintic.bernstein_coeffs) - mmin(quintic.bernstein_coeffs));

switch (u_debug.option - 850)
{ 
    case 1: fragColor = debug_quintic_root;                 break;
    case 2: fragColor = debug_quintic_num_roots;            break;
    case 3: fragColor = debug_quintic_coeffs;               break;
    case 4: fragColor = debug_quintic_bernstein_coeffs;     break;
    case 5: fragColor = debug_quintic_bernstein_spread;     break;
}          
switch (u_debug.option - 1000)
{ 
    case 0  : fragColor = debug.variable0; break;
    case 1  : fragColor = debug.variable1; break;
    case 2  : fragColor = debug.variable2; break;
    case 3  : fragColor = debug.variable3; break;
    case 4  : fragColor = debug.variable4; break;
    case 5  : fragColor = debug.variable5; break;
    case 6  : fragColor = debug.variable6; break;
    case 7  : fragColor = debug.variable7; break;
    case 8  : fragColor = debug.variable8; break;
    case 9  : fragColor = debug.variable9; break;
}               

#if DEBUG_ENABLED == 1
vec4 debug_stats_num_cells = to_color(float(stats.num_cells) / float(MAX_CELLS) * 10.0);

vec4 debug_stats_num_traces = to_color(float(stats.num_traces) / float(MAX_TRACES) * 10.0);

vec4 debug_stats_num_blocks = to_color(float(stats.num_blocks) / float(MAX_BLOCKS) * 10.0);

vec4 debug_stats_num_groups = to_color(float(stats.num_groups) / float(MAX_GROUPS) * 10.0);

vec4 debug_stats_num_texture_fetches = to_color(float(stats.num_texture_fetches) / float(MAX_CELLS) * 10.0);

vec4 debug_stats_num_intersection_tests = to_color(float(stats.num_intersection_tests) / float(MAX_BLOCKS) * 100.0);

switch (u_debug.option - 900)
{
    case 1: fragColor = debug_stats_num_cells;              break;
    case 2: fragColor = debug_stats_num_traces;             break;
    case 3: fragColor = debug_stats_num_blocks;             break;
    case 4: fragColor = debug_stats_num_groups;             break;
    case 5: fragColor = debug_stats_num_texture_fetches;    break;
    case 6: fragColor = debug_stats_num_intersection_tests; break;
}  
#endif
    #endif

    #if DISCARDING_ENABLED == 1
    fragColor.a *= hit.discarded ? 0.0 : 1.0;
    #endif
}