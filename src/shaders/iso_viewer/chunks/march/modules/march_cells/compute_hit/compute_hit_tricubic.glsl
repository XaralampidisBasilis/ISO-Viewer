
// Compute quintic polynomial roots in [0, 1]
// poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);

#if VARIATION_ENABLED == 1
poly5_roots_with_cubic_deflation(quintic.roots, quintic.coeffs, 0.0, 1.0);
#else
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
#endif

quintic.root = mmin(quintic.roots);

// Compute derivative at root
eval_poly(quintic.coeffs, quintic.root, hit.derivative);

// Compute orientation
hit.orientation = -ssign(hit.derivative); 
hit.derivative /= cell.span_distance;

// Compute intersection distance
hit.distance = mix(cell.entry_distance, cell.exit_distance, quintic.root);
hit.position = camera.position + ray.direction * hit.distance;

// Sample value
hit.value = sample_value_tricubic(hit.position);
hit.residue = hit.value - u_volume.isovalue;

// Compute gradients and hessian
hit.gradient = compute_gradient(hit.position, hit.hessian);

// Fix the orientation
hit.gradient *= hit.orientation; 
hit.hessian *= hit.orientation;

// Compute normal
hit.normal = normalize(hit.gradient);

// Compute principal curvatures
hit.curvatures = compute_curvatures(hit.gradient, hit.hessian);

// Count roots
for (int n = 0; n < 6; ++n) 
quintic.num_roots += (quintic.roots[n] != quintic.roots[5]) ? 1 : 0;

