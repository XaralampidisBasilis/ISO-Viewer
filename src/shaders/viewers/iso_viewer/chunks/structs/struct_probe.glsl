#ifndef STRUCT_PROBE
#define STRUCT_PROBE

struct Probe 
{
    bool  saturated;
    vec4  data;
    float value;           
    float error;           
    vec3  gradient;    
    float derivative;    
};

Probe set_probe()
{
    Probe probe;
    probe.saturated  = false;
    probe.data       = vec4(0.0);
    probe.value      = 0.0;
    probe.error      = 0.0
    probe.gradient   = vec3(0.0);
    probe.derivative = 0.0;
    return probe;
}
