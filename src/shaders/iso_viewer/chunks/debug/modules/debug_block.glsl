

// COMPUTE DEBUG 

// radius
vec4 debug_block_radius = to_color(float(block.radius) / 31.0);

// radii
vec4 debug_block_radii = to_color(vec3(block.radii) / 31.0);

// occupied
vec4 debug_block_occupied = to_color(block.occupied);

// terminated
vec4 debug_block_terminated = to_color(block.terminated);

// coords
vec4 debug_block_coords = to_color(vec3(block.coords) / vec3(u_distance_map.dimensions - 1));

// min position
vec4 debug_block_min_position = to_color(map(box.min_position, box.max_position, block.min_position));

// max position
vec4 debug_block_max_position = to_color(map(box.min_position, box.max_position, block.max_position));

// entry distance
vec4 debug_block_entry_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, block.entry_distance));

// exit distance
vec4 debug_block_exit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, block.exit_distance));

// entry position
vec4 debug_block_entry_position = to_color(map(box.min_position, box.max_position, block.entry_position));

// exit position
vec4 debug_block_exit_position = to_color(map(box.min_position, box.max_position, block.exit_position));

// PRINT DEBUG

switch (u_debugging.option - 400)
{
    case  1: fragColor = debug_block_radius;         break;
    case  2: fragColor = debug_block_radii;          break;
    case  3: fragColor = debug_block_occupied;       break;
    case  4: fragColor = debug_block_terminated;     break;
    case  5: fragColor = debug_block_coords;         break;
    case  6: fragColor = debug_block_min_position;   break;
    case  7: fragColor = debug_block_max_position;   break;
    case  8: fragColor = debug_block_entry_distance; break;
    case  9: fragColor = debug_block_exit_distance;  break;
    case 10: fragColor = debug_block_entry_position; break;
    case 11: fragColor = debug_block_exit_position;  break;
}

  