#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec2 interval;
    vec3 roots;
    vec4 intensities;    
    vec4 errors;
    vec4 distances;
    vec4 coefficients;    
    vec4 weights;
    mat4 vander;
    mat4 inv_vander; // inverse vandermonde matrix
};

Cubic cubic; // Global mutable struct

void set_cubic()
{
    cubic.interval = vec2(0.0, 1.0);
    cubic.roots = vec3(0.0);
    cubic.intensities = vec4(0.0);
    cubic.errors = vec4(0.0);
    cubic.distances = vec4(0.0);
    cubic.coefficients = vec4(0.0);
    cubic.weights = vec4(0.0, 1.0, 2.0, 3.0) / 3.0;
    cubic.vander = mat4
    (
        27.0, 27.0,  27.0,  27.0,
         0.0,  9.0,  18.0,  27.0,
         0.0,  3.0, 12.0, 27.0,
        0.0, 1.0,  8.0, 27.0 
    ) / 27.0;
    cubic.inv_vander = mat4
    (
        1.0,  -5.5,   9.0,   -4.5,
         0.0,  9.0, -22.5,   13.5,
         0.0, -4.5, 18.0, -13.5,
        0.0, 1.0, -4.5,   4.5 
    );
}

#endif 
