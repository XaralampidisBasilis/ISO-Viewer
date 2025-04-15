#ifndef UNIFORMS_RENDERING
#define UNIFORMS_RENDERING

struct Rendering 
{
    float intensity;  
    int   max_count;         
    int   max_cells;     
    int   max_blocks;   
};

uniform Rendering u_rendering;

#endif 