#ifndef STRUCT_DEBUG
#define STRUCT_DEBUG

struct Debug 
{
    int  slot_ray;
    int  slot_trace;
    int  slot_cell;
    int  slot_block;
    int  slot_frag;
    int  slot_box;
    int  slot_camera;
    int  slot_stats;
    int  slot_variables;

    vec4 variable1;
    vec4 variable2;
    vec4 variable3;
};

Debug debug; // Global mutable struct

void set_debug()
{
    debug.variable1 = vec4(vec3(0.0), 1.0);
    debug.variable2 = vec4(vec3(0.0), 1.0);
    debug.variable3 = vec4(vec3(0.0), 1.0);
}

#endif // STRUCT_DEBUG