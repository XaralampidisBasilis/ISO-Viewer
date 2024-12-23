
float debug_block_distance = float(block.distance) / float(u_distmap.max_distance);

debug.block_distance = vec4(vec3(debug_block_distance), 1.0);