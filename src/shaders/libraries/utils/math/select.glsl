#ifndef SELECT
#define SELECT

float select(in bool condition, in float a, in float b) 
{ 
    return (condition) ? a : b; 
}

vec2 select(in bvec2 condition, in vec2 a, in vec2 b) 
{ 
    return vec2
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y
    );
}

vec3 select(in bvec3 condition, in vec3 a, in vec3 b) 
{ 
    return vec3
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y,
        condition.z ? a.z : b.z
    );
}

vec4 select(in bvec4 condition, in vec4 a, in vec4 b) 
{ 
    return vec4
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y,
        condition.z ? a.z : b.z,
        condition.w ? a.w : b.w
    );
}

int select(in bool condition, in int a, in int b) 
{ 
    return condition ? a : b; 
}

ivec2 select(in bvec2 condition, in ivec2 a, in ivec2 b) 
{ 
    return ivec2
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y
    );
}

ivec3 select(in bvec3 condition, in ivec3 a, in ivec3 b) 
{ 
    return ivec3
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y,
        condition.z ? a.z : b.z
    );
}

ivec4 select(in bvec4 condition, in ivec4 a, in ivec4 b) 
{ 
    return ivec4
    (
        condition.x ? a.x : b.x,
        condition.y ? a.y : b.y,
        condition.z ? a.z : b.z,
        condition.w ? a.w : b.w
    );
}

#endif
