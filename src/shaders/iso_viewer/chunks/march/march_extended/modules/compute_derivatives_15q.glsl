
// Compute gradient and hessian with triquadratic reconstruction
triquadratic_sampling(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);

// Scale derivatives
vec3 spacing = normalize(u_intensity_map.spacing);
surface.gradient /= spacing;
surface.hessian /= outerProduct(spacing, spacing);

// Compute curvatures
surface.curvatures = principal_curvatures(surface.gradient, surface.hessian, surface.curvients);
surface.curvatures *= ssign(dot(surface.gradient, camera.position - trace.position));
surface.curvients *= ssign(dot(surface.gradient, camera.position - trace.position));

// Special curvatures
surface.mean_curvature = mean(surface.curvatures);
surface.gauss_curvature = prod(surface.curvatures);
surface.max_curvature = maxabs(surface.curvatures);

// Update trace
trace.gradient = surface.gradient;
trace.curvature = (surface.curvatures.x + surface.curvatures.y) * 0.5;

// debug.variable2 = to_color(vec3(surface.hessian[0][0], surface.hessian[1][1], surface.hessian[2][2]) * 0.5 + 0.5);
// debug.variable3 = to_color(vec3(surface.hessian[1][2], surface.hessian[0][2], surface.hessian[0][1]) * 0.5 + 0.5);

// debug.variable2 = to_color(normalize(surface.curvients[0]) * 0.5 + 0.5);
// debug.variable3 = to_color(normalize(surface.curvients[1]) * 0.5 + 0.5);

// debug.variable2 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.mean_curvature)));
// debug.variable3 = to_color(mmix(COLOR.CYAN, COLOR.BLACK, COLOR.MAGENTA, map(-2.0, 2.0, surface.max_curvature)));
