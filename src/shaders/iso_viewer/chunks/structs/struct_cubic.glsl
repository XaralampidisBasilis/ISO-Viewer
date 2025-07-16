#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec2 interval;
    vec3 roots;
    vec4 values;    
    vec4 residuals;
    vec2 extrema;
    vec4 distances;
    vec4 coeffs;    
    vec4 bcoeffs; // berstein coefficients
    vec4 points;
    mat4 vander;
    mat4 inv_vander; // inverse vandermonde matrix
    mat4 pow_bernstein;  // power to berstein basis matrix
    mat4 bernstein_pow;  // berstein to power basis matrix
    mat4 sample_bernstein; // samples to berstein basis
};

Cubic cubic; // Global mutable struct

void set_cubic()
{
    cubic.interval = vec2(0, 1);
    cubic.roots = vec3(0);
    cubic.values = vec4(0);
    cubic.residuals = vec4(0);
    cubic.extrema = vec2(0);
    cubic.distances = vec4(0);
    cubic.coeffs = vec4(0);
    cubic.bcoeffs = vec4(0);
    cubic.points = vec4(0, 1, 2, 3) / 3.0;
    cubic.vander = mat4
    (
        27, 27,  27,  27,
         0,  9,  18,  27,
         0,  3, 12, 27,
        0, 1,  8, 27 
    ) / 27.0;
    cubic.inv_vander = mat4
    (
        2, -11, 18, -9,
        0, 18, -45, 27,
        0, -9, 36, -27,
        0, 2, -9, 9 
    ) / 2.0;
    cubic.pow_bernstein = mat4
    (
        3, 0, 0, 0,
        3, 1, 0, 0,
        3, 2, 1, 0,
        3, 3, 3, 1
    ) / 3.0;
    cubic.bernstein_pow = mat4
    (
        1, 0, 0, 0,
        -3, 3, 0, 0,
        3, -6, 3, 0,
        -1, 3, -3, 1
    );
    cubic.sample_bernstein = mat4
    (
        6, -5, 2, 0,
        0, 18, -9, 0,
        0, -9, 18, 0,
        0, 2, -5, 6
    ) / 6.0;
}

#endif 
