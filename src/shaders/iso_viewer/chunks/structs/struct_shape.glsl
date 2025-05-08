#ifndef STRUCT_SHAPE
#define STRUCT_SHAPE

// struct to hold information about the current ray trace 
struct Shape 
{
    vec3  gradient;             // gradient vector
    float  curvature;            // mean curvature
};

Shape trace; // Global mutable struct

void set_trace()
{
    trace.gradient    = vec3(0.0);
    trace.curvature   = 0.0;
}

#endif // STRUCT_TRACE
