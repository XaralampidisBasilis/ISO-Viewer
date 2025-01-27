
float debug_block_skip_count = float(block.skip_count) / float(u_rendering.max_block_count);

debug.block_skip_count = vec4(vec3(debug_block_skip_count), 1.0);
