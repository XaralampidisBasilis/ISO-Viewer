// COMPUTE DEBUG 

// discarded
vec4 debug_hit_discarded = to_color(hit.discarded);

// distance
vec4 debug_hit_distance = to_color(map(box.min_entry_distance, box.max_exit_distance, hit.distance));

// position
vec4 debug_hit_position = to_color(map(box.min_position, box.max_position, hit.position));

// residue
vec4 debug_trace_residue = to_color(mmix(COLOR.BLUE, COLOR.BLACK, COLOR.RED, 
    map(-MILLI_TOLERANCE, MILLI_TOLERANCE, hit.residue))
);

// normal
vec4 debug_hit_normal = to_color((map(-1.0, 1.0, hit.normal)));

// gradient
vec4 debug_hit_gradient = to_color(map(-1.0, 1.0, hit.gradient));

// steepness
vec4 debug_hit_steepness = to_color(map(0.0, 1.0, length(hit.gradient)));

// curvatures
/*
| k_2 \ k_1  | < 0                 | = 0              | > 0                 |
| ---------- | ------------------- | ---------------- | ------------------- |
| < 0        | Concave Ellipsoid   | Concave Cylinder | Hyperboloid Surface |
| = 0        | Concave Cylinder    | Flat Plane       | Convex Cylinder     |
| > 0        | Hyperboloid Surface | Convex Cylinder  | Convex Ellipsoid    |
*/
vec4 debug_hit_curvatures = to_color(mmix2(
    COLOR.DARK_CYAN, COLOR.DARK_BLUE, COLOR.MAGENTA, 
    COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.ORANGE,
    COLOR.MAGENTA,   COLOR.ORANGE,    COLOR.GOLD,  
    map(-2.0, 2.0, hit.curvatures)
));

// mean curvature
vec4 debug_hit_mean_curvature = to_color(mmix(COLOR.LIGHT_BLUE, COLOR.DARK_GRAY, COLOR.LIGHT_RED, 
    map(-2.0, 2.0, mean(hit.curvatures) * 2.0))
);

// max curvature
vec4 debug_hit_max_curvature = to_color(mmix(COLOR.BLUE, COLOR.DARK_GRAY, COLOR.RED, 
    map(-2.0, 2.0, maxabs(hit.curvatures)))
);

// soft curvature
vec4 debug_hit_total_curvature = to_color(mmix(COLOR.DARK_BLUE, COLOR.DARK_GRAY, COLOR.LIGHT_YELLOW, 
    map(-2.0, 2.0, mean(abs(hit.curvatures))))
);

// PRINT DEBUG

switch (u_debug.option - 200)
{ 
    case  1: fragColor = debug_hit_discarded;       break;
    case  2: fragColor = debug_hit_distance;        break;
    case  3: fragColor = debug_hit_position;        break;
    case  4: fragColor = debug_trace_residue;       break;
    case  5: fragColor = debug_hit_normal;          break;
    case  6: fragColor = debug_hit_gradient;        break;
    case  7: fragColor = debug_hit_steepness;       break;
    case  8: fragColor = debug_hit_curvatures;      break;
    case  9: fragColor = debug_hit_mean_curvature;  break;
    case 11: fragColor = debug_hit_max_curvature;   break;
    case 12: fragColor = debug_hit_total_curvature; break;
}