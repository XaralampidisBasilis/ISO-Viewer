#ifndef STRUCT_CELL
#define STRUCT_CELL


struct Cell 
{
    bool  intersected;
    bool  terminated;
    ivec3 coords;
    int   axis;
    ivec3 axes;
    vec3  min_position;
    vec3  max_position;
    float entry_distance;
    float exit_distance;
    vec3  entry_position;
    vec3  exit_position;   
};

Cell cell; // Global mutable struct

void set_cell()
{
    cell.intersected        = false;
    cell.terminated         = false;
    cell.coords             = ivec3(0);
    cell.axis               = 0;
    cell.axes               = ivec3(0);
    cell.min_position       = vec3(0.0);
    cell.max_position       = vec3(0.0);
    cell.entry_distance     = 0.0;
    cell.exit_distance      = 0.0;
    cell.entry_position     = vec3(0.0);
    cell.exit_position      = vec3(0.0);
}

#endif 
