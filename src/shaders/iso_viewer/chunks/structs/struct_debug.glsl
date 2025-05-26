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

Debug debug; // Global mutable struct

void set_debug()
{
    debug.variable0 = vec4(vec3(0.0), 1.0);
    debug.variable1 = vec4(vec3(0.0), 1.0);
    debug.variable2 = vec4(vec3(0.0), 1.0);
    debug.variable3 = vec4(vec3(0.0), 1.0);
    debug.variable4 = vec4(vec3(0.0), 1.0);
    debug.variable5 = vec4(vec3(0.0), 1.0);
    debug.variable6 = vec4(vec3(0.0), 1.0);
    debug.variable7 = vec4(vec3(0.0), 1.0);
    debug.variable8 = vec4(vec3(0.0), 1.0);
    debug.variable9 = vec4(vec3(0.0), 1.0);
}

#endif // STRUCT_DEBUG