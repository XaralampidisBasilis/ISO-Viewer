// Source: https://learnwebgl.brown37.net/09_lights/lights_combined.html

// The light and the eye share the camera position.
vec3 view_direction = normalize((camera.position - hit.position) * u_volume.spacing_normalized);
float view_angle = dot(view_direction, hit.normal);

// Compute parameters
float lambertian = clamp(view_angle, 0.0, 1.0);
float specular = pow(lambertian, u_shading.shininess);

// Modulations
float modulate_edges = smoothstep(0.0, 0.5, abs(view_angle));
float modulate_gradient = mix(0.2, 1.0, smoothstep(0.0, 0.1, length(hit.gradient)));
float modulate_curvature = mean(smoothstep(-1.2, 0.0, hit.curvatures.x), smoothstep(-1.2, 0.0, hit.curvatures.y)); 

modulate_edges = mix(1.0, modulate_edges, u_shading.modulate_edges);
modulate_gradient = mix(1.0, modulate_gradient, u_shading.modulate_gradient);
modulate_curvature = mix(1.0, modulate_curvature, u_shading.modulate_curvature);

// Colors 
frag.color_material = colormap(hit.value, u_shading.colormap);
frag.color_ambient = frag.color_material * u_shading.reflect_ambient;
frag.color_diffuse = frag.color_material * u_shading.reflect_diffuse  * lambertian;
frag.color_specular = frag.color_material * u_shading.reflect_specular * specular;
frag.color_directional = frag.color_diffuse + frag.color_specular;

frag.color_directional *= min(modulate_edges, modulate_gradient);
frag.color_ambient *= modulate_curvature;
frag.color = frag.color_ambient + frag.color_directional;

// Compose colors
fragColor = vec4(frag.color, 1.0);
