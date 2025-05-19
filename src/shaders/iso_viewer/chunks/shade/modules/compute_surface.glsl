
// Compute gradient and hessian via triquadratic reconstruction
// trilinear_sobel_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);
triquadratic_bspline_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);
// tricubic_bspline_gradient_hessian(u_textures.intensity_map, trace.position, surface.gradient, surface.hessian);

// Scale derivatives to physical space
vec3 scaling = normalize(u_intensity_map.spacing);
surface.hessian /= outerProduct(scaling, scaling);
surface.gradient /= scaling;

// Compute laplacian from the hessian matrix
surface.laplacian = surface.hessian[0][0] + surface.hessian[1][1] + surface.hessian[2][2];

// Compute steepness, curvatures and curvient vectors
surface.steepness = length(surface.gradient);
surface.curvatures = principal_curvatures(surface.gradient, surface.hessian, surface.curvients);

// Compute the normal of the surface and correctly orient curvatures
surface.orientation = ssign(dot(surface.gradient, camera.position - trace.position));
surface.normal = normalize(surface.gradient) * surface.orientation;
surface.curvatures *= surface.orientation;
surface.curvients *= surface.orientation;

// Compute specific curvatures
surface.mean_curvature = mean(surface.curvatures);
surface.gauss_curvature = prod(surface.curvatures);
surface.max_curvature = maxabs(surface.curvatures);
surface.soft_curvature = (surface.laplacian / surface.steepness) * 0.5;
surface.soft_curvature *= surface.orientation;
