#ifndef UNIFORMS_COLORMAP
#define UNIFORMS_COLORMAP

struct UniformsColormap 
{
    int  levels;      
    int  name;        
    vec2 thresholds;  
    vec2 start_coords;
    vec2 end_coords;  
};

uniform UniformsColormap u_colormap;

#endif
