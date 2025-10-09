
// COMPUTE DEBUG

// root
vec4 debug_cubic_root = to_color(cubic.root);

// num roots
vec4 debug_cubic_num_roots = to_color(float(cubic.num_roots) / 3.0);

// coeffs
vec4 cubic_coeffs = abs_l1_normalization(cubic.coeffs);

vec4 debug_cubic_coeffs = to_color(
    cubic_coeffs.x * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + // #FF0000
    cubic_coeffs.y * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + // #80FF00
    cubic_coeffs.z * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + // #00FFFF 
    cubic_coeffs.w * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   // #8000FF 
); 

// bernstein coeffs
vec4 cubic_bernstein_coeffs = abs_l1_normalization(cubic.bernstein_coeffs);

vec4 debug_cubic_bernstein_coeffs = to_color(
    cubic_bernstein_coeffs.x * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + // #FF0000
    cubic_bernstein_coeffs.y * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + // #80FF00 
    cubic_bernstein_coeffs.z * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + // #00FFFF  
    cubic_bernstein_coeffs.w * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   // #8000FF 
); 

// bernstein spread
vec4 debug_cubic_bernstein_spread = to_color(mmax(cubic.bernstein_coeffs) - mmin(cubic.bernstein_coeffs));

// PRINT DEBUG

switch (u_debug.option - 800)
{ 
    case 1: fragColor = debug_cubic_root;             break;
    case 2: fragColor = debug_cubic_num_roots;        break;
    case 3: fragColor = debug_cubic_coeffs;           break;
    case 4: fragColor = debug_cubic_bernstein_coeffs; break;
    case 5: fragColor = debug_cubic_bernstein_spread; break;
}
