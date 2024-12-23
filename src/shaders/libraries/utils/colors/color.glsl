#ifndef COLOR
#define COLOR

vec4 color(float x) { return vec4(vec3(x), 1.0); }
vec4 color(vec3  x) { return vec4(x, 1.0); }

#endif