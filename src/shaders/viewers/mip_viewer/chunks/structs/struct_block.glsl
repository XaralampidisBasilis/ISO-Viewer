#ifndef STRUCT_BLOCK
#define STRUCT_BLOCK

// struct to hold the current occumap parameters
struct Block
{
    float min_value;
    float max_value;
    int   distance;
    bool  occupied;
    ivec3 coords;  
    ivec3 min_coords;  
    ivec3 max_coords;  
    ivec3 step_coords;  
    vec3  texture_coords;
    vec3  min_position;
    vec3  max_position;
    int   skip_count;
};

Block set_block()
{
    Block block;
    block.min_value      = 0.0;
    block.max_value      = 0.0;
    block.distance       = 0;
    block.occupied       = false;
    block.coords         = ivec3(0);
    block.min_coords     = ivec3(0);
    block.max_coords     = ivec3(0);
    block.step_coords    = ivec3(0);
    block.texture_coords = vec3(0.0);
    block.min_position   = vec3(0.0);
    block.max_position   = vec3(0.0);
    block.skip_count     = 0;
    return block;
}

#endif // STRUCT_BLOCK