// COMPUTE DEBUG 

// orientation
vec4 debug_surface_orientation = to_color((map(-1.0, 1.0, surface.orientation)));

// normal
vec4 debug_surface_normal = to_color((map(-1.0, 1.0, surface.normal)));

// gradient
vec4 debug_surface_gradient = to_color(map(-1.0, 1.0, surface.gradient));

// hessian diag
vec3 hessian_diag = vec3(surface.hessian[0][0], surface.hessian[1][1], surface.hessian[2][2]);
vec4 debug_surface_hessian_diag = to_color(map(-1.0, 1.0, hessian_diag));

// hessian mix
vec3 hessian_mix = vec3(surface.hessian[0][1], surface.hessian[1][2], surface.hessian[2][0]);
vec4 debug_surface_hessian_mix = to_color(map(-1.0, 1.0, hessian_mix));

// curvient1
vec4 debug_surface_curvient1 = to_color((map(-1.0, 1.0, surface.curvients[0])));

// curvient2
vec4 debug_surface_curvient2 = to_color((map(-1.0, 1.0, surface.curvients[1])));

// steepness
vec4 debug_surface_steepness = to_color(map(0.0, 1.0, surface.steepness));

// laplacian
vec4 debug_surface_laplacian = to_color(map(-2.0, 2.0, surface.laplacian));

// curvatures
/*
| k_2 \ k_1  | < 0                 | = 0              | > 0                 |
| ---------- | ------------------- | ---------------- | ------------------- |
| < 0        | Concave Ellipsoid   | Concave Cylinder | Hyperboloid Surface |
| = 0        | Concave Cylinder    | Flat Plane       | Convex Cylinder     |
| > 0        | Hyperboloid Surface | Convex Cylinder  | Convex Ellipsoid    |
*/
vec4 debug_surface_curvatures = to_color(mmix2(
    COLOR.DARK_CYAN, COLOR.DARK_BLUE, COLOR.MAGENTA,
    COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.ORANGE,
    COLOR.MAGENTA,   COLOR.ORANGE,    COLOR.GOLD,  
    map(-2.0, 2.0, surface.curvatures)
));

// mean curvature
vec4 debug_surface_mean_curvature = to_color(mmix(COLOR.LIGHT_BLUE, COLOR.DARK_GRAY, COLOR.LIGHT_RED, map(-2.0, 2.0, surface.mean_curvature * 2.0)));

// gauss curvature
vec4 debug_surface_gauss_curvature = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.ORANGE, map(-atan(3.0), atan(3.0), atan(surface.gauss_curvature * 10.0))));

// max curvature
vec4 debug_surface_max_curvature = to_color(mmix(COLOR.BLUE, COLOR.DARK_GRAY, COLOR.RED, map(-2.0, 2.0, surface.max_curvature)));

// soft curvature
vec4 debug_surface_soft_curvature = to_color(mmix(COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.LIGHT_YELLOW, map(-2.0, 2.0, surface.soft_curvature)));

// PRINT DEBUG

switch (u_debugging.option - 450)
{ 
    case  1: fragColor = debug_surface_orientation;     break;
    case  2: fragColor = debug_surface_normal;          break;
    case  3: fragColor = debug_surface_gradient;        break;
    case  4: fragColor = debug_surface_hessian_diag;    break;
    case  5: fragColor = debug_surface_hessian_mix;     break;
    case  6: fragColor = debug_surface_curvient1;       break;
    case  7: fragColor = debug_surface_curvient2;       break;
    case  8: fragColor = debug_surface_steepness;       break;
    case  9: fragColor = debug_surface_laplacian;       break;
    case 10: fragColor = debug_surface_curvatures;      break;
    case 11: fragColor = debug_surface_mean_curvature;  break;
    case 12: fragColor = debug_surface_gauss_curvature; break;
    case 13: fragColor = debug_surface_max_curvature;   break;
    case 14: fragColor = debug_surface_soft_curvature;  break;
}