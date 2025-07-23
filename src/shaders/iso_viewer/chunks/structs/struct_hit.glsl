#ifndef STRUCT_HIT
#define STRUCT_HIT

// struct to hold information about the current ray hit 
struct Hit 
{
    bool  discarded;          
    vec3  position;           
    float distance;   
    float value;        
    float residue;    
    vec3  gradient;   
    vec3  normal;   
    vec2  curvatures;    
};

Hit hit; // Global mutable struct

void set_hit()
{
    hit.discarded  = true;
    hit.position   = vec3(0.0);
    hit.distance   = 0.0;
    hit.value      = 0.0;
    hit.residue    = 0.0;
    hit.gradient   = vec3(0.0);
    hit.normal     = vec3(0.0);
    hit.curvatures = vec2(0.0);
}

#endif // STRUCT_HIT
