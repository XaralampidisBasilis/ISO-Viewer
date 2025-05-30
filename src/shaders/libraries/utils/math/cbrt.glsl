
#ifndef CBRT
#define CBRT

float cbrt(in float v) { return sign(v) * pow(abs(v), 1.0/3.0); }
vec2  cbrt(in vec2  v) { return sign(v) * vec2(pow(abs(v.x), 1.0/3.0), pow(abs(v.y), 1.0/3.0)); }
vec3  cbrt(in vec3  v) { return sign(v) * vec3(pow(abs(v.x), 1.0/3.0), pow(abs(v.y), 1.0/3.0), pow(abs(v.z), 1.0/3.0)); }
vec4  cbrt(in vec4  v) { return sign(v) * vec4(pow(abs(v.x), 1.0/3.0), pow(abs(v.y), 1.0/3.0), pow(abs(v.z), 1.0/3.0), pow(abs(v.w), 1.0/3.0)); }


// https://www.shadertoy.com/view/ssyyDh
float _cbrt( float x )
{
    float y = uintBitsToFloat(709973695u+floatBitsToUint(x)/3u);
    y = y*(2.0/3.0) + (1.0/3.0)*x/(y*y);
    y = y*(2.0/3.0) + (1.0/3.0)*x/(y*y);
    return y;
}

#endif // CBRT
