#ifndef STRUCT_POLY
#define STRUCT_POLY

struct Poly 
{
    vec2 start;
    vec2 end;
    vec3 roots;
    vec4 intensities;    
    vec4 distances;
    vec4 coefficients;    
    vec4 weights;
    mat4 inv_vander; // inverse vandermonde matrix
};

Poly poly; // Global mutable struct

void set_poly()
{
    poly.start = vec2(0.0, 0.0);
    poly.end = vec2(1.0, 0.0);
    poly.roots = vec3(0.0);
    poly.intensities = vec4(0.0);
    poly.distances = vec4(0.0);
    poly.coefficients = vec4(0.0);
    poly.weights = vec4(0.0, 1.0, 2.0, 3.0) / 3.0;
    poly.inv_vander = mat4
    (
        1.0, -5.5,   9.0,   -4.5,
        0.0,  9.0, -22.5,   13.5,
        0.0, -4.5, 18.0, -13.5,
        0.0, 1.0, -4.5,   4.5 
    );
}

#endif 
