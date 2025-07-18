#ifndef TRICUBIC_BIAS
#define TRICUBIC_BIAS

#ifndef CELL_SPACE
#include "./cell_space"
#endif

vec4 tricubic_bias(vec3 coords)
{
    vec3 r = cell_space(coords);
    vec3 bias = r * (r - 1.0) * 0.5;
    
    return vec4(bias, 1.0);
}

#endif