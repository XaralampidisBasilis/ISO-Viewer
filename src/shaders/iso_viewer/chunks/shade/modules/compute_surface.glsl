
// Compute gradient and hessian via triquadratic reconstruction
surface.gradient = sample_triquadratic_gradient(hit.position, surface.curvatures);

// Compute steepness, curvatures and curvient vectors
surface.normal = normalize(surface.gradient);
surface.steepness = length(surface.gradient);

// Compute the normal of the surface and correctly orient curvatures
surface.orientation = dot(surface.normal, normalize(camera.position - hit.position)) >= 0.0 ? 1.0 : -1.0;
surface.normal *= surface.orientation;
surface.curvatures *= surface.orientation;

// Compute specific curvatures
surface.mean_curvature = mean(surface.curvatures);
surface.gauss_curvature = prod(surface.curvatures);
surface.max_curvature = maxabs(surface.curvatures);
