#ifndef UNIFORMS_BBOX
#define UNIFORMS_BBOX

struct Bbox 
{
    ivec3 min_block_coords;
    ivec3 max_block_coords;
    ivec3 min_cell_coords;
    ivec3 max_cell_coords;
    vec3  min_position;
    vec3  max_position;
};

uniform Bbox u_bbox;

#endif