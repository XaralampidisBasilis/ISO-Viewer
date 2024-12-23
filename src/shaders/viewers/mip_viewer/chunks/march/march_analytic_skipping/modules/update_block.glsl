
// Compute block coords from trace position
block.coords = ivec3((trace.position + u_volume.spacing * 0.5) * u_distmap.inv_spacing);

// Sample the distance map and compute if block is occupied
vec2 texture_data = texelFetch(u_textures.distance_map, block.coords, 0).rg;
block.max_value = texture_data.r;
block.distance = int(round(texture_data.g) * 255.0);

// debug.variable1 = vec4(vec3(texture_data, 0.0), 1.0);

// Check occupancy
block.occupied = voxel.value < block.max_value;
