#ifndef UNIFORMS_RENDERING
#define UNIFORMS_RENDERING

struct UniformsRendering 
{
    float isovalue;  
    int   max_groups;         
    int   max_cells;     
    int   max_blocks;   
};

uniform UniformsRendering u_rendering;

#endif 