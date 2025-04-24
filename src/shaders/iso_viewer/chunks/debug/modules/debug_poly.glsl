
// COMPUTE DEBUG

// distances
vec4 debug_poly_distances = to_color(map(cell.entry_distance, cell.exit_distance, poly.distances.xyz)); 

// intensities
vec4 debug_poly_intensities = to_color(poly.intensities.xyz);

// coefficients
vec4 debug_poly_coefficients = to_color(poly.coefficients.xyz / poly.coefficients.w); 

// PRINT DEBUG

switch (u_debugging.option - 800)
{ 
    case 1: fragColor = debug_poly_distances;    break;
    case 2: fragColor = debug_poly_intensities;  break;
    case 3: fragColor = debug_poly_coefficients; break;
}