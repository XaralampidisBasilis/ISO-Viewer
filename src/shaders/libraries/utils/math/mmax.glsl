/*
contributors: Patricio Gonzalez Vivo
description: extend GLSL Max function to add more arguments
use:
    - <float> mmax(<float> A, <float> B, <float> C[, <float> D])
    - <vec2|vec3|vec4> mmax(<vec2|vec3|vec4> A)
license:
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Prosperity License - https://prosperitylicense.com/versions/3.0.0
    - Copyright (c) 2021 Patricio Gonzalez Vivo under Patron License - https://lygia.xyz/license
*/

#ifndef MMAX
#define MMAX

float mmax(in float a) { return a; }
float mmax(in float a, in float b) { return max(a, b); }
float mmax(in float a, in float b, in float c) { return max(a, max(b, c)); }
float mmax(in float a, in float b, in float c, in float d) { return max(max(a, b), max(c, d)); }

int mmax(in int a) { return a; }
int mmax(in int a, in int b) { return max(a, b); }
int mmax(in int a, in int b, in int c) { return max(a, max(b, c)); }
int mmax(in int a, in int b, in int c, in int d) { return max(max(a, b), max(c, d)); }

float mmax(vec2 v) { return max(v.x, v.y); }
float mmax(vec3 v) { return mmax(v.x, v.y, v.z); }
float mmax(vec4 v) { return mmax(v.x, v.y, v.z, v.w); }
float mmax(float v[6]) 
{
    float r = v[0];
    for (int i = 1; i < 6; ++i) 
    {
        r = max(r, v[i]);
    }
    return r;
}

int mmax(ivec2 v) { return max(v.x, v.y); }
int mmax(ivec3 v) { return mmax(v.x, v.y, v.z); }
int mmax(ivec4 v) { return mmax(v.x, v.y, v.z, v.w); }

#endif // MMAX
