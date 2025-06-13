
// Compute gradient and hessian via triquadratic reconstruction
// trilinear_sobel_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);
// triquadratic_bspline_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);
// tricubic_bspline_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);


#if SKIPPING_ENABLED == 1
triquadratic_bspline_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);
#else
sample_trilaplacian_gradient_hessian(trace.position, surface.gradient, surface.hessian);
#endif

// Scale derivatives to physical space
vec3 spacing = normalize(u_intensity_map.spacing);
surface.hessian /= outerProduct(spacing, spacing);
surface.gradient /= spacing;

// Compute laplacian from the hessian matrix
surface.laplacian = surface.hessian[0][0] + surface.hessian[1][1] + surface.hessian[2][2];

// Compute steepness, curvatures and curvient vectors
surface.normal = normalize(surface.gradient);
surface.steepness = length(surface.gradient);
surface.curvatures = principal_curvatures(surface.gradient, surface.hessian, surface.curvients);

// Compute the normal of the surface and correctly orient curvatures
surface.orientation = acos(dot(surface.normal, normalize(camera.position - trace.position))) < MATH.HALF_PI * (1.0 + u_debugging.variable1) ? 1.0 : -1.0;
// surface.orientation = ssign(dot(surface.normal, camera.position - trace.position));
surface.normal *= surface.orientation;
surface.curvatures *= surface.orientation;
surface.curvients *= surface.orientation;

// Compute specific curvatures
surface.mean_curvature = mean(surface.curvatures);
surface.gauss_curvature = prod(surface.curvatures);
surface.max_curvature = maxabs(surface.curvatures);
surface.soft_curvature = (surface.laplacian / surface.steepness) * 0.5;
surface.soft_curvature *= surface.orientation;
