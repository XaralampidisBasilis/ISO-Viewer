
// COMPUTE DEBUG

// root
vec4 debug_quintic_root = to_color(quintic.root);

// num roots
vec4 debug_quintic_num_roots = to_color(float(quintic.num_roots) / 5.0);

// coeffs
float quintic_coeffs[6]; abs_l1_normalization(quintic.coeffs, quintic_coeffs);

vec4 debug_quintic_coeffs = to_color(
    quintic_coeffs[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + //  #FF0000 
    quintic_coeffs[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + //  #FFFF00 
    quintic_coeffs[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + //  #00FF00
    quintic_coeffs[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + //  #00FFFF 
    quintic_coeffs[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + //  #0000FF 
    quintic_coeffs[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   //  #FF00FF
); 

// bernstein coeffs
float quintic_bernstein_coeffs[6]; abs_l1_normalization(quintic.bernstein_coeffs, quintic_bernstein_coeffs);

vec4 debug_quintic_bernstein_coeffs = to_color(  
    quintic_bernstein_coeffs[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + //  #FF0000  
    quintic_bernstein_coeffs[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + //  #FFFF00  
    quintic_bernstein_coeffs[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + //  #00FF00
    quintic_bernstein_coeffs[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + //  #00FFFF  
    quintic_bernstein_coeffs[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + //  #0000FF  
    quintic_bernstein_coeffs[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   //  #FF00FF
); 

// bernstein spread
vec4 debug_quintic_bernstein_spread = to_color(mmax(quintic.bernstein_coeffs) - mmin(quintic.bernstein_coeffs));

// PRINT DEBUG

switch (u_debug.option - 850)
{ 
    case 1: fragColor = debug_quintic_root;                 break;
    case 2: fragColor = debug_quintic_num_roots;            break;
    case 3: fragColor = debug_quintic_coeffs;               break;
    case 4: fragColor = debug_quintic_bernstein_coeffs;     break;
    case 5: fragColor = debug_quintic_bernstein_spread;     break;
}
