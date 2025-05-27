#ifndef XSIGN
#define XSIGN

// Returns true if a and b have different signs (cross zero)
bool xsign(float a, float b) 
{
    return (a < 0.0) != (b < 0.0);
}

bvec2 xsign(vec2 a, vec2 b) 
{
    return notEqual(lessThan(a, vec2(0.0)), lessThan(b, vec2(0.0)));
}

bvec3 xsign(vec3 a, vec3 b) 
{
    return notEqual(lessThan(a, vec3(0.0)), lessThan(b, vec3(0.0)));
}

bvec4 xsign(vec4 a, vec4 b) 
{
    return notEqual(lessThan(a, vec4(0.0)), lessThan(b, vec4(0.0)));
}

#endif