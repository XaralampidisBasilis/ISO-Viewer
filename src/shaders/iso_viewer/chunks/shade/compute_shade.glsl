// Source: https://learnwebgl.brown37.net/09_lights/lights_combined.html

// Compute light position in texture coordinated
vec3 light_position = camera.position;

// Compute shading vectors in texture coordinated
vec3 vector_view = camera.position - hit.position;
vec3 vector_light = light_position - hit.position;
vec3 vector_halfway = vector_light + vector_view;

// Normalize shading vectors in model coordinates
vec3 scale = normalize(u_volume.spacing);
vector_view = normalize(vector_view * scale);
vector_light = normalize(vector_light * scale);
vector_halfway = normalize(vector_halfway * scale);

// Compute vector angles
float angle_view = dot(vector_view, hit.normal);
float angle_light = dot(vector_light, hit.normal);
float angle_halfway = dot(vector_halfway, hit.normal);

// Compute parameters
float lambertian = clamp(angle_light, 0.0, 1.0);
float specular = pow(clamp(angle_halfway, 0.0, 1.0), u_shading.shininess);

// Colors 
frag.color_material = sample_colormap(hit.value);
frag.color_ambient = frag.color_material * u_shading.reflect_ambient;
frag.color_diffuse = frag.color_material * u_shading.reflect_diffuse  * lambertian;
frag.color_specular = frag.color_material + (1.0 - frag.color_material) * u_shading.reflect_specular * specular;
frag.color_directional = mix(frag.color_diffuse, frag.color_specular, specular);

// Modulations
float edge_modulation = smoothstep(0.0, u_shading.edge_contrast, abs(angle_view));
float grad_modulation = softstep_hill(0.0, 0.3, length(hit.gradient), 0.9);
float curv_modulation = mean(
    smoothstep(-1.2, 0.0, hit.curvatures.x), 
    smoothstep(-1.2, 0.0, hit.curvatures.y)
); 

frag.color_directional *= mmin(edge_modulation, grad_modulation);
frag.color_ambient *= curv_modulation;

// Compose colors
frag.color = frag.color_ambient + frag.color_directional;
frag.color *= u_lighting.intensity;

// Assign frag color
fragColor = vec4(frag.color, 1.0);
