#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec2 interval;
    vec4 roots;
    vec4 values;    
    vec4 residuals;
    vec4 distances;
    vec4 coeffs;    
    vec4 bernstein_coeffs; // berstein coefficients
    vec4 points;
};

Cubic cubic; // Global mutable struct

void set_cubic()
{
    cubic.interval = vec2(0, 1);
    cubic.roots = vec4(0);
    cubic.values = vec4(0);
    cubic.residuals = vec4(0);
    cubic.distances = vec4(0);
    cubic.coeffs = vec4(0);
    cubic.bernstein_coeffs = vec4(0);
    cubic.points = vec4(0, 1, 2, 3) / 3.0;
}

#endif 
