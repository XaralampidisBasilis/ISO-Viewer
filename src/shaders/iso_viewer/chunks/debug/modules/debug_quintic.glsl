
// COMPUTE DEBUG

float quintic_coeffs[6];
float quintic_bernstein_coeffs[6];
abs_l1_normalization(quintic.coeffs, quintic_coeffs);
abs_l1_normalization(quintic.bernstein_coeffs, quintic_bernstein_coeffs);

// coeffs
vec4 debug_quintic_coeffs = to_color(
    quintic_coeffs[0] * COLOR.BREWER_SET1[0] + // #e41a1c
    quintic_coeffs[1] * COLOR.BREWER_SET1[1] + // #377eb8
    quintic_coeffs[2] * COLOR.BREWER_SET1[2] + // #4daf4a
    quintic_coeffs[3] * COLOR.BREWER_SET1[3] + // #984ea3
    quintic_coeffs[4] * COLOR.BREWER_SET1[4] + // #ff7f00
    quintic_coeffs[5] * COLOR.BREWER_SET1[5]   // #ffff33
); 

// bernstein coeffs
vec4 debug_quintic_bernstein_coeffs = to_color(  
    quintic_bernstein_coeffs[0] * COLOR.BREWER_SET1[0] + // #e41a1c
    quintic_bernstein_coeffs[1] * COLOR.BREWER_SET1[1] + // #377eb8
    quintic_bernstein_coeffs[2] * COLOR.BREWER_SET1[2] + // #4daf4a
    quintic_bernstein_coeffs[3] * COLOR.BREWER_SET1[3] + // #984ea3
    quintic_bernstein_coeffs[4] * COLOR.BREWER_SET1[4] + // #ff7f00
    quintic_bernstein_coeffs[5] * COLOR.BREWER_SET1[5]   // #ffff33
); 

// num roots
vec4 debug_quintic_num_roots = to_color(COLOR.BREWER_SET1[quintic.num_roots]);

// root
vec4 debug_quintic_root = to_color(quintic.root);

// PRINT DEBUG

switch (u_debug.option - 850)
{ 
    case 1: fragColor = debug_quintic_coeffs; break;
    case 2: fragColor = debug_quintic_bernstein_coeffs; break;
    case 3: fragColor = debug_quintic_num_roots; break;
    case 4: fragColor = debug_quintic_root; break;
}