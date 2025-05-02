#ifndef UNIFORMS_TEXTURES
#define UNIFORMS_TEXTURES

struct Textures 
{
    mediump sampler2D color_maps;      
    mediump sampler3D intensity_map;
    mediump usampler3D distance_map;
    mediump usampler3D anisotropic_distance_map;
    mediump usampler3D extended_anisotropic_distance_map;
};

uniform Textures u_textures;

#endif