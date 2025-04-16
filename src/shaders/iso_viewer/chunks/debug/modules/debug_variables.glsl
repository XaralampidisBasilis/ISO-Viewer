
debug.variable1 = to_color(v_position * u_intensity_map.inv_dimensions);

// PRINT DEBUG

switch (u_debugging.option - 1000)
{ 
    case 1: fragColor = debug.variable1; break;
    case 2: fragColor = debug.variable2; break;
    case 3: fragColor = debug.variable3; break;
}