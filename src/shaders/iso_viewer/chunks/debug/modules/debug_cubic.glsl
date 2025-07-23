
// COMPUTE DEBUG

// distances
vec4 debug_cubic_distances = to_color(map(cell.entry_distance, cell.exit_distance, cubic.distances.xyz)); 

// coefficients
vec4 debug_cubic_coefficients = to_color(cubic.coeffs.xyz / cubic.coeffs.w); 

// PRINT DEBUG

switch (u_debug.option - 800)
{ 
    case 1: fragColor = debug_cubic_distances;    break;
    case 3: fragColor = debug_cubic_coefficients; break;
}