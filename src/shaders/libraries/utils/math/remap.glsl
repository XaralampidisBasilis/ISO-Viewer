#ifndef REMAP
#define REMAP

float remap(in float a, in float b, in float y) { return a + y * (b - a); }
vec2  remap(in float a, in float b, in vec2  y) { return a + y * (b - a); }
vec3  remap(in float a, in float b, in vec3  y) { return a + y * (b - a); }
vec4  remap(in float a, in float b, in vec4  y) { return a + y * (b - a); }
vec2  remap(in vec2  a, in vec2  b, in vec2  y) { return a + y * (b - a); }
vec3  remap(in vec3  a, in vec3  b, in vec3  y) { return a + y * (b - a); }
vec4  remap(in vec4  a, in vec4  b, in vec4  y) { return a + y * (b - a); }

#endif // MAP