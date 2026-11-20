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

const int COLORMAP_IVORY = 20;
const int COLORMAP_SILVER = 21;
const int COLORMAP_TEAL = 22;
const int COLORMAP_AMBER = 23;
const int COLORMAP_LAVENDER = 24;

vec3 tinted_ramp(in float t, in vec3 tint)
{
    // Preserve the original tint at the demo's opening isovalue.
    const float reference = 0.35;
    if (t < reference) return mix(0.55 * tint, tint, t / reference);
    return mix(tint, vec3(1.0), 0.45 * (t - reference) / (1.0 - reference));
}

vec3 colormap(in float t, in int type)
{
    if      (type == COLORMAP_PARULA) return parula(t);
    else if (type == COLORMAP_TURBO) return turbo(t);
    else if (type == COLORMAP_HSV) return hsv(t);
    else if (type == COLORMAP_HOT) return hot(t);
    else if (type == COLORMAP_COOL) return cool(t);
    else if (type == COLORMAP_SPRING) return spring(t);
    else if (type == COLORMAP_SUMMER) return summer(t);
    else if (type == COLORMAP_AUTUMN) return autumn(t);
    else if (type == COLORMAP_WINTER) return winter(t);
    else if (type == COLORMAP_GRAY) return gray(t);
    else if (type == COLORMAP_BONE) return bone(t);
    else if (type == COLORMAP_COPPER) return copper(t);
    else if (type == COLORMAP_PINK) return pink(t);
    else if (type == COLORMAP_JET) return jet(t);
    else if (type == COLORMAP_PASTELJET) return pasteljet(t);
    else if (type == COLORMAP_VIRIDIS) return viridis(t);
    else if (type == COLORMAP_PLASMA) return plasma(t);
    else if (type == COLORMAP_INFERNO) return inferno(t);
    else if (type == COLORMAP_MAGMA) return magma(t);
    else if (type == COLORMAP_CIVIDIS) return cividis(t);
    else if (type == COLORMAP_IVORY) return tinted_ramp(t, vec3(0.93, 0.86, 0.73));
    else if (type == COLORMAP_SILVER) return tinted_ramp(t, vec3(0.81, 0.87, 0.94));
    else if (type == COLORMAP_TEAL) return tinted_ramp(t, vec3(0.43, 0.82, 0.76));
    else if (type == COLORMAP_AMBER) return tinted_ramp(t, vec3(0.95, 0.69, 0.42));
    else if (type == COLORMAP_LAVENDER) return tinted_ramp(t, vec3(0.80, 0.70, 0.94));

    else return vec3(0.0); 
}

#endif
