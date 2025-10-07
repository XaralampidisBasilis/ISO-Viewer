
// COMPUTE DEBUG

vec4 cubic_coeffs = abs_l1_normalization(cubic.coeffs);
vec4 cubic_bernstein_coeffs = abs_l1_normalization(cubic.bernstein_coeffs);

// coeffs
vec4 debug_cubic_coeffs = to_color(
    cubic_coeffs.x * COLOR.BREWER_SET1[0] + // #e41a1c
    cubic_coeffs.y * COLOR.BREWER_SET1[1] + // #377eb8
    cubic_coeffs.z * COLOR.BREWER_SET1[2] + // #4daf4a
    cubic_coeffs.w * COLOR.BREWER_SET1[4]   // #ff7f00
); 

// bernstein coeffs
vec4 debug_cubic_bernstein_coeffs = to_color(
    cubic_bernstein_coeffs.x * COLOR.BREWER_SET1[0] + // #e41a1c
    cubic_bernstein_coeffs.y * COLOR.BREWER_SET1[1] + // #377eb8
    cubic_bernstein_coeffs.z * COLOR.BREWER_SET1[2] + // #4daf4a
    cubic_bernstein_coeffs.w * COLOR.BREWER_SET1[4]   // #ff7f00
); 

// num roots
vec4 debug_cubic_num_roots = to_color(COLOR.BREWER_SET1[cubic.num_roots]);

// root
vec4 debug_cubic_root = to_color(cubic.root);

// PRINT DEBUG

switch (u_debug.option - 800)
{ 
    case 1: fragColor = debug_cubic_coeffs; break;
    case 2: fragColor = debug_cubic_bernstein_coeffs; break;
    case 3: fragColor = debug_cubic_num_roots; break;
    case 4: fragColor = debug_cubic_root; break;
}