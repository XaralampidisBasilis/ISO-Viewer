
// COMPUTE DEBUG

// root
vec4 debug_cubic_root = to_color(cubic.root);

// num roots
int cubic_num_roots = 0;
for (int i = 0; i <= 3; ++i) 
{   
    if (cubic.roots[i] != cubic.roots[3])
    {
        cubic_num_roots++;
    }
}

vec4 debug_cubic_num_roots = to_color(float(cubic_num_roots) / 3.0);

// degree
float cubic_maxabs = 0.0;
for (int i = 0; i <= 3; ++i) 
{
    cubic_maxabs = max(cubic_maxabs, abs(cubic.coeffs[i]));
}

int cubic_degree = 0;
for (int i = 3; i >= 0; --i)
{
    if (abs(cubic.coeffs[i]) / max(cubic_maxabs, 1e-20) > 0.01)
    {
        cubic_degree = i;
        break;
    }
}

vec4 debug_cubic_degree;
switch(cubic_degree)
{
    case 0: debug_cubic_degree = to_color(hsv2rgb(vec3(0.0/4.0, 1.0, 1.0))); break; // #FF0000
    case 1: debug_cubic_degree = to_color(hsv2rgb(vec3(1.0/4.0, 1.0, 1.0))); break; // #80FF00
    case 2: debug_cubic_degree = to_color(hsv2rgb(vec3(2.0/4.0, 1.0, 1.0))); break; // #00FFFF 
    case 3: debug_cubic_degree = to_color(hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))); break; // #8000FF 
}

// weights
vec4 cubic_weights = abs(cubic.coeffs) / max(sum(abs(cubic.coeffs)), 1e-20);

vec4 debug_cubic_weights = to_color(
    cubic_weights[0] * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + // #FF0000
    cubic_weights[1] * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + // #80FF00
    cubic_weights[2] * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + // #00FFFF 
    cubic_weights[3] * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   // #8000FF 
); 

// bernstein weights
vec4 cubic_bernstein_weights = abs(cubic.bernstein_coeffs) / max(sum(abs(cubic.bernstein_coeffs)), 1e-20);

vec4 debug_cubic_bernstein_weights = to_color(
    cubic_bernstein_weights[0] * hsv2rgb(vec3(0.0/4.0, 1.0, 1.0)) + // #FF0000
    cubic_bernstein_weights[1] * hsv2rgb(vec3(1.0/4.0, 1.0, 1.0)) + // #80FF00 
    cubic_bernstein_weights[2] * hsv2rgb(vec3(2.0/4.0, 1.0, 1.0)) + // #00FFFF  
    cubic_bernstein_weights[3] * hsv2rgb(vec3(3.0/4.0, 1.0, 1.0))   // #8000FF 
); 

// bernstein spread
vec4 debug_cubic_bernstein_spread = to_color(mmax(cubic.bernstein_coeffs) - mmin(cubic.bernstein_coeffs));

// PRINT DEBUG
switch (u_debug.option - 800)
{ 
    case 1: fragColor = debug_cubic_root;              break;
    case 2: fragColor = debug_cubic_num_roots;         break;
    case 3: fragColor = debug_cubic_degree;            break;
    case 4: fragColor = debug_cubic_weights;           break;
    case 5: fragColor = debug_cubic_bernstein_weights; break;
    case 6: fragColor = debug_cubic_bernstein_spread; break;
    case 7: fragColor = to_color(0.5 + atan(cubic.residuals[0]) / 3.1415926536); break;
    case 8: fragColor = to_color(0.5 + atan(cubic.residuals[1]) / 3.1415926536); break;
    case 9: fragColor = to_color(0.5 + atan(cubic.residuals[2]) / 3.1415926536); break;
    case 10: fragColor = to_color(0.5 + atan(cubic.residuals[3]) / 3.1415926536); break;
    case 11: fragColor = to_color(0.5 + atan(cubic.coeffs[0]) / 3.1415926536); break;
    case 12: fragColor = to_color(0.5 + atan(cubic.coeffs[1]) / 3.1415926536); break;
    case 13: fragColor = to_color(0.5 + atan(cubic.coeffs[2]) / 3.1415926536); break;
    case 14: fragColor = to_color(0.5 + atan(cubic.coeffs[3]) / 3.1415926536); break;
    case 15: fragColor = to_color(0.5 + atan(cubic.bernstein_coeffs[0]) / 3.1415926536); break;
    case 16: fragColor = to_color(0.5 + atan(cubic.bernstein_coeffs[1]) / 3.1415926536); break;
    case 17: fragColor = to_color(0.5 + atan(cubic.bernstein_coeffs[2]) / 3.1415926536); break;
    case 18: fragColor = to_color(0.5 + atan(cubic.bernstein_coeffs[3]) / 3.1415926536); break;
    case 19: fragColor = to_color(cubic.roots[0]); break;
    case 20: fragColor = to_color(cubic.roots[1]); break;
    case 21: fragColor = to_color(cubic.roots[2]); break;
}
