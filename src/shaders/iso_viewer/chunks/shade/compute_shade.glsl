// Compute ambient component
#include "./modules/compute_scene"
#include "./modules/compute_color"
#include "./modules/compute_ambient"
#include "./modules/compute_diffuse"
#include "./modules/compute_specular"
#include "./modules/compute_edge"
#include "./modules/compute_shadow"

// Compute directional component
vec3 directional_color = mix(frag.diffuse_color, frag.specular_color, specular);
directional_color *= min(shadows_fading, edge_fading);

// Compose colors
frag.shaded_color.rgb = frag.ambient_color + directional_color;
frag.shaded_color.rgb *= u_lighting.intensity;

// Assign frag color
fragColor = frag.shaded_color;

// Compute fragment depth
#include "./modules/compute_depth"

