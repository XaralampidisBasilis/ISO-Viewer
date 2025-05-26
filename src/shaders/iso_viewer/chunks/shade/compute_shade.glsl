// Source: https://learnwebgl.brown37.net/09_lights/lights_combined.html

// Compute surface properties
#include "./modules/compute_surface"

// Compute shading angles
#include "./modules/compute_angles"

// Compute parameters
float lambertian = clamp(frag.light_angle, 0.0, 1.0);
float specular = pow(clamp(frag.halfway_angle, 0.0, 1.0), u_shading.shininess);

// Edges 
frag.edge_factor = smoothstep(0.0, u_shading.edge_contrast, abs(frag.view_angle));

// Gradient
frag.gradient_factor = softstep_hill(0.0, 0.3, length(surface.gradient), 0.9);

// Material
frag.material_color = sample_color_maps(trace.intensity);

// Ambient 
frag.ambient_color = frag.material_color * (u_shading.ambient_reflectance * u_lighting.ambient_color);
// frag.ambient_color *= smoothstep(-2.0, 0.0, surface.max_curvature); 

// Diffuse
frag.diffuse_color = frag.material_color * (u_shading.diffuse_reflectance * u_lighting.diffuse_color * lambertian);

// Specular
frag.specular_color = mix(frag.material_color, u_lighting.specular_color, u_shading.specular_reflectance * specular);

// Directional
frag.direct_color = mix(frag.diffuse_color, frag.specular_color, specular);
// frag.direct_color *= mmin(frag.edge_factor, frag.gradient_factor);
frag.direct_color *= frag.edge_factor;

// Compose colors
frag.color = frag.ambient_color + frag.direct_color;
frag.color *= u_lighting.intensity;

// Assign frag color
fragColor = vec4(frag.color, 1.0);

// Compute fragment depth
#include "./modules/compute_depth"