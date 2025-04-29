#ifndef STRUCT_BLOCK
#define STRUCT_BLOCK

// struct to hold the current occumap parameters
struct Block
{
    int   radius;
    bool  occupied;
    bool  terminated;
    ivec3 coords;  
    int   axis;
    ivec3 axes;
    ivec3 min_coords;
    ivec3 max_coords;
    vec3  min_position;
    vec3  max_position;
    float entry_distance;
    float exit_distance;
    vec3  entry_position;
    vec3  exit_position;
};

Block block; // Global mutable struct

void set_block()
{
    block.radius         = 0;
    block.occupied       = false;
    block.terminated     = false;
    block.coords         = ivec3(0);
    block.axis           = 0;
    block.axes           = ivec3(0);
    block.min_coords     = ivec3(0);
    block.max_coords     = ivec3(0);
    block.min_position   = vec3(0.0);
    block.max_position   = vec3(0.0);
    block.entry_distance = 0.0;
    block.exit_distance  = 0.0;
    block.entry_position = vec3(0.0);
    block.exit_position  = vec3(0.0);
}

#endif // STRUCT_BLOCK