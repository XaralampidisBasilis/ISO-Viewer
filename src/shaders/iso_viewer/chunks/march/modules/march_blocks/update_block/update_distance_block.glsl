// Convert the sampled skip bounds to the expanded ray-intersection box.
block.min_position = vec3(block.min_coords * u_volume.block_size) - 0.5;
block.max_position = vec3((block.max_coords + 1) * u_volume.block_size) - 0.5;
block.min_position -= 0.001;
block.max_position += 0.001;

block.entry_distance = block.exit_distance;
block.entry_position = block.exit_position;

#include "./update_distance_block_exit"
block.exit_position = camera.position + ray.direction * block.exit_distance;
block.span_distance = block.exit_distance - block.entry_distance;

#include "./advance_distance_block"

block.terminated = block.exit_distance > ray.end_distance;

#if DEBUG_ENABLED == 1
stats.num_blocks += 1;
#endif
