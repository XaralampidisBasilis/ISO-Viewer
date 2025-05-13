
// Compute gradient and hessian with triquadratic reconstruction
tricubic_sampling(u_textures.intensity_map, trace.position, surface.gradient);

// Scale derivatives
vec3 spacing = normalize(u_intensity_map.spacing);
surface.gradient /= spacing;

// Update trace
trace.gradient = surface.gradient;

// debug.variable2 = to_color(map(-2.0, 2.0, vec3(surface.hessian[0][0], surface.hessian[1][1], surface.hessian[2][2])));
// debug.variable3 = to_color(map(-2.0, 2.0, vec3(surface.hessian[1][2], surface.hessian[0][2], surface.hessian[0][1])));

// debug.variable2 = to_color(normalize(surface.curvients[0]) * 0.5 + 0.5);
// debug.variable3 = to_color(normalize(surface.curvients[1]) * 0.5 + 0.5);

// debug.variable2 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.mean_curvature)));
// debug.variable3 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.max_curvature)));
