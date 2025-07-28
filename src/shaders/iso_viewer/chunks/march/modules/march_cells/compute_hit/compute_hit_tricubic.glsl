
// Construct the quintic coefficients
mat4x3 residuals = transpose(quintic.biases) * quintic.features - u_rendering.isovalue;
mat4x3 coeffs = quad_inv_vander * residuals * cubic_inv_vander;
sum_anti_diags(coeffs, quintic.coeffs);

// Compute quintic polynomial roots in [0, 1]
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);
quintic.root = mmin(quintic.roots);

// Compute quintic derivative at min root
eval_poly(quintic.coeffs, quintic.root, quintic.derivative);

// Compute intersection distance
hit.distance = mix(cell.entry_distance, cell.exit_distance, quintic.root);

// Compute intersection position
hit.position = camera.position + ray.direction * hit.distance;

// Sample value
hit.value = sample_value_tricubic(hit.position);

// Compute intersection residue (should be near zero)
hit.residue = hit.value - u_rendering.isovalue;

// Compute gradients and hessian
hit.gradient = compute_gradient(hit.position, hit.hessian);

// Compute facing
hit.facing = -ssign(quintic.derivative); // hit.facing = -ssign(dot(hit.gradient, ray.direction * u_volume.anisotropy));

// Align gradient and hessian to view direction
hit.gradient *= hit.facing; 
hit.hessian *= hit.facing;

// Compute normal
hit.normal = normalize(hit.gradient);

// Compute principal curvatures
hit.curvatures = principal_curvatures(hit.gradient, hit.hessian);

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

