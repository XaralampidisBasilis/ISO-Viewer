
// COMPUTE DEBUG

// coefficients
vec4 debug_quintic_intensities_0 = to_color(vec3(quintic.values[0], quintic.values[1], quintic.values[2])); 
vec4 debug_quintic_intensities_1 = to_color(vec3(quintic.values[3], quintic.values[4], quintic.values[5])); 

// coefficients
vec4 debug_quintic_coefficients_0 = to_color(vec3(quintic.coeffs[0], quintic.coeffs[1], quintic.coeffs[2])); 
vec4 debug_quintic_coefficients_1 = to_color(vec3(quintic.coeffs[3], quintic.coeffs[4], quintic.coeffs[5])); 

// roots
vec4 debug_quintic_roots_0 = to_color(vec3(quintic.roots[0], quintic.roots[1], quintic.roots[2])); 
vec4 debug_quintic_roots_1 = to_color(vec3(quintic.roots[3], quintic.roots[4], quintic.roots[5])); 

// PRINT DEBUG

switch (u_debugging.option - 850)
{ 
    case 1: fragColor = debug_quintic_intensities_0;  break;
    case 2: fragColor = debug_quintic_intensities_1;  break;
    case 3: fragColor = debug_quintic_coefficients_0; break;
    case 4: fragColor = debug_quintic_coefficients_1; break;
    case 5: fragColor = debug_quintic_roots_0;        break;
    case 6: fragColor = debug_quintic_roots_1;        break;
}
