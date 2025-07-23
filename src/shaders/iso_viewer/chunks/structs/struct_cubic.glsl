#ifndef STRUCT_CUBIC
#define STRUCT_CUBIC

struct Cubic 
{
    vec4 residuals;
    vec4 distances;
    vec4 coeffs;    
    vec4 bernstein_coeffs; 
    vec4 roots;
};

Cubic cubic; // Global mutable struct

void set_cubic()
{
    cubic.roots = vec4(0);
    cubic.residuals = vec4(0);
    cubic.distances = vec4(0);
    cubic.coeffs = vec4(0);
    cubic.bernstein_coeffs = vec4(0);
}

#endif 
