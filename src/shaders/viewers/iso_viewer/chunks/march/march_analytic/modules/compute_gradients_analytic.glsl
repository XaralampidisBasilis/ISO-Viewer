
// Sample neighbors
vec3 min_position = (vec3(cell.coords) - 0.5) * u_volume.inv_dimensions;
vec3 max_position = (vec3(cell.coords) + 0.5) * u_volume.inv_dimensions;

vec3 backward_values;
vec3 forward_values;

for (int i = 0; i < 3; i++)
{
    vec3 texture_position = trace.position * u_volume.inv_size;

    texture_position[i] = min_position[i];
    backward_values[i] = texture(u_textures.taylor_map, texture_position).r;
    
    texture_position[i] = max_position[i];
    forward_values[i] = texture(u_textures.taylor_map, texture_position).r;
}

// update voxel
voxel.gradient = (forward_values - backward_values) * u_volume.inv_spacing;

// update trace
trace.derivative = dot(voxel.gradient, ray.step_direction);
