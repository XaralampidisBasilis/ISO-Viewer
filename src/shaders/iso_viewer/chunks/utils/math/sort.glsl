#ifndef SORT
#define SORT

// n-element Bose–Nelson networks

void sort(inout float a, inout float b)
{
    if (a > b) { float t = a; a = b; b = t; }
}

void sort(inout float a, inout float b, inout float c)
{
    if (a > b) { float t = a; a = b; b = t; }
    if (b > c) { float t = b; b = c; c = t; }
    if (a > b) { float t = a; a = b; b = t; }
}

void sort(inout float a, inout float b, inout float c, inout float d)
{
    if (a > b) { float t = a; a = b; b = t; }
    if (c > d) { float t = c; c = d; d = t; }
    if (a > c) { float t = a; a = c; c = t; }
    if (b > d) { float t = b; b = d; d = t; }
    if (b > c) { float t = b; b = c; c = t; }
}

void sort(inout vec2 v)
{
    v = (v.x > v.y) ? v.yx : v.xy;
}

void sort(inout vec3 v)
{
    v.xy = (v.x > v.y) ? v.yx : v.xy;
    v.yz = (v.y > v.z) ? v.zy : v.yz;
    v.xy = (v.x > v.y) ? v.yx : v.xy;
}

void sort(inout vec4 v)
{
    v.xy = (v.x > v.y) ? v.yx : v.xy;
    v.zw = (v.z > v.w) ? v.wz : v.zw;
    v.xz = (v.x > v.z) ? v.zx : v.xz;
    v.yw = (v.y > v.w) ? v.wy : v.yw;
    v.yz = (v.y > v.z) ? v.zy : v.yz;
}

#endif // SORT
