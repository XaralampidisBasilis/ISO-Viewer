
vec3 debug_block_coords_step = (vec3(block.coords_step) / float(u_distmap.max_distance)) * 0.5 + 0.5;

debug.block_coords_step  = vec4(debug_block_coords_step, 1.0);