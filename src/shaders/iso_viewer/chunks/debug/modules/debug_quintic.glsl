
// COMPUTE DEBUG

// root
vec4 debug_quintic_root = to_color(quintic.root);

// num roots
int quintic_num_roots = 0;
for (int i = 0; i <= 5; ++i) 
{   
    if (quintic.roots[i] != quintic.roots[5])
    {
        quintic_num_roots++;
    }
}

vec4 debug_quintic_num_roots = to_color(float(quintic_num_roots) / 5.0);

// degree
float quintic_maxabs = 0.0;
for (int i = 0; i <= 5; ++i) 
{
    quintic_maxabs = max(quintic_maxabs, abs(quintic.coeffs[i]));
}

int quintic_degree = 0;
for (int i = 5; i >= 0; --i)
{
    if (abs(quintic.coeffs[i]) / max(quintic_maxabs, 1e-20) > 0.01)
    {
        quintic_degree = i;
        break;
    }
}

vec4 debug_quintic_degree;
switch(quintic_degree)
{
    case 0: debug_quintic_degree = to_color(hsv2rgb(vec3(0.0/6.0, 1.0, 1.0))); break; //  #FF0000 
    case 1: debug_quintic_degree = to_color(hsv2rgb(vec3(1.0/6.0, 1.0, 1.0))); break; //  #FFFF00 
    case 2: debug_quintic_degree = to_color(hsv2rgb(vec3(2.0/6.0, 1.0, 1.0))); break; //  #00FF00
    case 3: debug_quintic_degree = to_color(hsv2rgb(vec3(3.0/6.0, 1.0, 1.0))); break; //  #00FFFF 
    case 4: debug_quintic_degree = to_color(hsv2rgb(vec3(4.0/6.0, 1.0, 1.0))); break; //  #0000FF 
    case 5: debug_quintic_degree = to_color(hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))); break; //  #FF00FF
}

// coeffs
float quintic_weights[6]; 
float quintic_weights_sum = 0.0;
for (int i = 0; i < 6; ++i)
{
    quintic_weights_sum += abs(quintic.coeffs[i]);
}
for (int i = 0; i < 6; ++i)
{
    quintic_weights[i] = abs(quintic.coeffs[i]) / max(quintic_weights_sum, 1e-20);
}

vec4 debug_quintic_weights = to_color(
    quintic_weights[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + //  #FF0000 
    quintic_weights[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + //  #FFFF00 
    quintic_weights[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + //  #00FF00
    quintic_weights[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + //  #00FFFF 
    quintic_weights[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + //  #0000FF 
    quintic_weights[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   //  #FF00FF
); 

// bernstein coeffs
float quintic_bernstein_weights[6]; 
float quintic_bernstein_weights_sum = 0.0;
for (int i = 0; i < 6; ++i)
{
    quintic_bernstein_weights_sum += abs(quintic.bernstein_coeffs[i]);
}
for (int i = 0; i < 6; ++i)
{
    quintic_bernstein_weights[i] = abs(quintic.bernstein_coeffs[i]) / max(quintic_bernstein_weights_sum, 1e-20);
}

vec4 debug_quintic_bernstein_weights = to_color(  
    quintic_bernstein_weights[0] * hsv2rgb(vec3(0.0/6.0, 1.0, 1.0)) + //  #FF0000  
    quintic_bernstein_weights[1] * hsv2rgb(vec3(1.0/6.0, 1.0, 1.0)) + //  #FFFF00  
    quintic_bernstein_weights[2] * hsv2rgb(vec3(2.0/6.0, 1.0, 1.0)) + //  #00FF00
    quintic_bernstein_weights[3] * hsv2rgb(vec3(3.0/6.0, 1.0, 1.0)) + //  #00FFFF  
    quintic_bernstein_weights[4] * hsv2rgb(vec3(4.0/6.0, 1.0, 1.0)) + //  #0000FF  
    quintic_bernstein_weights[5] * hsv2rgb(vec3(5.0/6.0, 1.0, 1.0))   //  #FF00FF
); 

// bernstein spread
vec4 debug_quintic_bernstein_spread = to_color(mmax(quintic.bernstein_coeffs) - mmin(quintic.bernstein_coeffs));

// PRINT DEBUG
switch (u_debug.option - 850)
{ 
    case 1: fragColor = debug_quintic_root;                 break;
    case 2: fragColor = debug_quintic_num_roots;            break;
    case 3: fragColor = debug_quintic_degree;               break;
    case 4: fragColor = debug_quintic_weights;              break;
    case 5: fragColor = debug_quintic_bernstein_weights;    break;
    case 6: fragColor = debug_quintic_bernstein_spread; break;
    case 7: fragColor = to_color(0.5 + atan(quintic.residuals[0]) / 3.1415926536); break;
    case 8: fragColor = to_color(0.5 + atan(quintic.residuals[1]) / 3.1415926536); break;
    case 9: fragColor = to_color(0.5 + atan(quintic.residuals[2]) / 3.1415926536); break;
    case 10: fragColor = to_color(0.5 + atan(quintic.residuals[3]) / 3.1415926536); break;
    case 11: fragColor = to_color(0.5 + atan(quintic.coeffs[0]) / 3.1415926536); break;
    case 12: fragColor = to_color(0.5 + atan(quintic.coeffs[1]) / 3.1415926536); break;
    case 13: fragColor = to_color(0.5 + atan(quintic.coeffs[2]) / 3.1415926536); break;
    case 14: fragColor = to_color(0.5 + atan(quintic.coeffs[3]) / 3.1415926536); break;
    case 15: fragColor = to_color(0.5 + atan(quintic.coeffs[4]) / 3.1415926536); break;
    case 16: fragColor = to_color(0.5 + atan(quintic.coeffs[5]) / 3.1415926536); break;
    case 17: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[0]) / 3.1415926536); break;
    case 18: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[1]) / 3.1415926536); break;
    case 19: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[2]) / 3.1415926536); break;
    case 20: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[3]) / 3.1415926536); break;
    case 21: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[4]) / 3.1415926536); break;
    case 22: fragColor = to_color(0.5 + atan(quintic.bernstein_coeffs[5]) / 3.1415926536); break;
    case 23: fragColor = to_color(quintic.roots[0]); break;
    case 24: fragColor = to_color(quintic.roots[1]); break;
    case 25: fragColor = to_color(quintic.roots[2]); break;
    case 26: fragColor = to_color(quintic.roots[3]); break;
    case 27: fragColor = to_color(quintic.roots[4]); break;
    case 28: fragColor = to_color(0.5 + atan(quintic.features[0].xyz) / 3.1415926536); break;
    case 29: fragColor = to_color(0.5 + atan(quintic.features[1].xyz) / 3.1415926536); break;
    case 30: fragColor = to_color(0.5 + atan(quintic.features[2].xyz) / 3.1415926536); break;
    case 31: fragColor = to_color(0.5 + atan(quintic.features[3].xyz) / 3.1415926536); break;
    case 32: fragColor = to_color(quintic.features[0].w); break;
    case 33: fragColor = to_color(quintic.features[1].w); break;
    case 34: fragColor = to_color(quintic.features[2].w); break;
    case 35: fragColor = to_color(quintic.features[3].w); break;
    case 36: fragColor = to_color(map(-0.125, 0.0, quintic.biases[0].xyz)); break;
    case 37: fragColor = to_color(map(-0.125, 0.0, quintic.biases[1].xyz)); break;
    case 38: fragColor = to_color(map(-0.125, 0.0, quintic.biases[2].xyz)); break;
}
