// Source: https://learnwebgl.brown37.net/09_lights/lights_combined.html

// Compute surface properties
#include "./modules/compute_surface"

// Compute light position in texture coordinated
vec3 light_position = camera.position;

// Compute shading vectors in texture coordinated
frag.light_vector = light_position - trace.position;
frag.view_vector = camera.position - trace.position;
frag.halfway_vector = frag.light_vector + frag.view_vector;

// Normalize shading vectors in model coordinates
vec3 scale = normalize(u_intensity_map.spacing);
frag.light_vector   = normalize(frag.light_vector * scale);
frag.view_vector    = normalize(frag.view_vector * scale);
frag.halfway_vector = normalize(frag.halfway_vector * scale);

// Compute normal vector
frag.normal_vector = surface.normal;
frag.normal_vector *= ssign(dot(frag.normal_vector, frag.view_vector));

// Compute vector angles
frag.light_angle   = dot(frag.light_vector, frag.normal_vector);
frag.view_angle    = dot(frag.view_vector, frag.normal_vector);
frag.halfway_angle = dot(frag.halfway_vector, frag.normal_vector);

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
frag.ambient_color *= smoothstep(-2.0, 0.0, surface.max_curvature); 

// Diffuse
frag.diffuse_color = frag.material_color * (u_shading.diffuse_reflectance * u_lighting.diffuse_color * lambertian);

// Specular
frag.specular_color = mix(frag.material_color, u_lighting.specular_color, u_shading.specular_reflectance * specular);

// Directional
frag.direct_color = mix(frag.diffuse_color, frag.specular_color, specular);
frag.direct_color *= mmin(frag.edge_factor, frag.gradient_factor);

// Compose colors
frag.color = frag.ambient_color + frag.direct_color;
frag.color *= u_lighting.intensity;

// Assign frag color
fragColor = vec4(frag.color, 1.0);

// Compute fragment depth
#include "./modules/compute_depth"