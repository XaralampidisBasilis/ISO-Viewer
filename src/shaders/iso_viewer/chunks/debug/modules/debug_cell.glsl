
// COMPUTE DEBUG

// terminated
vec4 debug_cell_intersected = to_color(cell.intersected);

// terminated
vec4 debug_cell_terminated = to_color(cell.terminated);

// coords
vec4 debug_cell_coords = to_color(vec3(cell.coords) * u_intensity_map.inv_dimensions);

// entry distance
vec4 debug_cell_entry_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, cell.entry_distance)); 

// exit distance
vec4 debug_cell_exit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, cell.exit_distance)); 

// span distance
vec4 debug_cell_span_distance = to_color((cell.exit_distance - cell.entry_distance) / u_intensity_map.spacing_length); 

// min position
vec4 debug_cell_min_position = to_color(map(box.min_position, box.max_position, cell.min_position)); 

// max position
vec4 debug_cell_max_position = to_color(map(box.min_position, box.max_position, cell.max_position)); 

// PRINT DEBUG

switch (u_debugging.option - 300)
{ 
    case 1: fragColor = debug_cell_intersected;        break;
    case 2: fragColor = debug_cell_terminated;         break;
    case 3: fragColor = debug_cell_coords;             break;
    case 4: fragColor = debug_cell_max_position;       break;
    case 5: fragColor = debug_cell_min_position;       break;
    case 6: fragColor = debug_cell_entry_distance;     break;
    case 7: fragColor = debug_cell_exit_distance;      break;
    case 8: fragColor = debug_cell_span_distance;      break;
}