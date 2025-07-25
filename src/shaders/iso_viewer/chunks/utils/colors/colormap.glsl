#ifndef COLORMAP
#define COLORMAP

#include "./colormap/parula"
#include "./colormap/turbo"
#include "./colormap/hsv"
#include "./colormap/hot"
#include "./colormap/cool"
#include "./colormap/spring"
#include "./colormap/summer"
#include "./colormap/autumn"
#include "./colormap/winter"
#include "./colormap/gray"
#include "./colormap/bone"
#include "./colormap/copper"
#include "./colormap/pink"
#include "./colormap/jet"
#include "./colormap/pasteljet"
#include "./colormap/viridis"
#include "./colormap/plasma"
#include "./colormap/inferno"
#include "./colormap/magma"
#include "./colormap/cividis"

vec3 colormap(in float t, in int type)
{
    if (type == PARULA) return parula(t);
    else if (type == TURBO) return turbo(t);
    else if (type == HSV) return hsv(t);
    else if (type == HOT) return hot(t);
    else if (type == COOL) return cool(t);
    else if (type == SPRING) return spring(t);
    else if (type == SUMMER) return summer(t);
    else if (type == AUTUMN) return autumn(t);
    else if (type == WINTER) return winter(t);
    else if (type == GRAY) return gray(t);
    else if (type == BONE) return bone(t);
    else if (type == COPPER) return copper(t);
    else if (type == PINK) return pink(t);
    else if (type == JET) return jet(t);
    else if (type == PASTELJET) return pasteljet(t);
    else if (type == VIRIDIS) return viridis(t);
    else if (type == PLASMA) return plasma(t);
    else if (type == INFERNO) return inferno(t);
    else if (type == MAGMA) return magma(t);
    else if (type == CIVIDIS) return cividis(t);

    else return vec3(0.0); 
}

#endif