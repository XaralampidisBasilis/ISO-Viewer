#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec2 interval;
    vec3 roots;
    vec4 intensities;    
    vec4 errors;
    vec4 distances;
    vec4 coeffs;    
    vec4 bcoeffs; // berstein coefficients
    vec4 weights;
    mat4 vander;
    mat4 inv_vander; // inverse vandermonde matrix
    mat4 bernstein;  // monomial to berstein basis matrix
};

Cubic cubic; // Global mutable struct

void set_cubic()
{
    cubic.interval = vec2(0, 1);
    cubic.roots = vec3(0);
    cubic.intensities = vec4(0);
    cubic.errors = vec4(0);
    cubic.distances = vec4(0);
    cubic.coeffs = vec4(0);
    cubic.bcoeffs = vec4(0);
    cubic.weights = vec4(0, 1, 2, 3) / 3.0;
    cubic.vander = mat4
    (
        27, 27,  27,  27,
         0,  9,  18,  27,
         0,  3, 12, 27,
        0, 1,  8, 27 
    ) / 27.0;
    cubic.inv_vander = mat4
    (
        1, -5.5,   9,   -4.5,
        0,  9, -22.5,   13.5,
        0, -4.5, 18, -13.5,
        0, 1, -4.5,   4.5 
    );
    cubic.bernstein = mat4
    (
        1, 0, 0, 0,
        -3, 3, 0, 0,
        3, -6, 3, 0,
        -1, 3, -3, 1
    );

}

#endif 
