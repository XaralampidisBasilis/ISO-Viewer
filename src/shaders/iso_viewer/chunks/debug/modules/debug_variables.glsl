
// PRINT DEBUG

// debug.variable1 = to_color(surface.steepness <  u_debug.variable2);

// debug.variable9 = to_color(mmix2(
//     COLOR.DARK_CYAN, COLOR.DARK_BLUE, COLOR.MAGENTA,
//     COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.ORANGE,
//     COLOR.MAGENTA,   COLOR.ORANGE,    COLOR.GOLD,  
//     map(box.min_position.xy, box.max_position.xy, ray.start_position.xy)
// ));


switch (u_debug.option - 1000)
{ 
    case 0  : fragColor = debug.variable0; break;
    case 1  : fragColor = debug.variable1; break;
    case 2  : fragColor = debug.variable2; break;
    case 3  : fragColor = debug.variable3; break;
    case 4  : fragColor = debug.variable4; break;
    case 5  : fragColor = debug.variable5; break;
    case 6  : fragColor = debug.variable6; break;
    case 7  : fragColor = debug.variable7; break;
    case 8  : fragColor = debug.variable8; break;
    case 9  : fragColor = debug.variable9; break;
}