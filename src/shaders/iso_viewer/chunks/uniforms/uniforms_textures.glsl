#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct Textures 
{
    sampler3D intensity_map;
    sampler3D occupancy_map;
    sampler3D distance_map;
    sampler2D color_maps;      
};

uniform Textures u_textures;

#endif