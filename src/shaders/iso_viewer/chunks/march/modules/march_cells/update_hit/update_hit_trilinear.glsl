
// Compute intersection distance
float min_root = mmin(cubic.roots);
hit.distance = mix(cell.entry_distance, cell.exit_distance, min_root);

// Compute intersection position
hit.position = camera.position + ray.direction * hit.distance;

// Sample value
hit.value = sample_volume_trilinear(hit.position);

// Compute intersection residue (should be near zero)
hit.residue = hit.value - u_rendering.isovalue;

// Compute gradients and hessian
hit.gradient = compute_gradient(hit.position, hit.hessian);

// Compute gradients facing relative to view direction
hit.facing = -ssign(dot(hit.gradient, ray.direction * u_volume.anisotropy));

// Align gradient and hessian to view direction
hit.gradient *= hit.facing;
hit.hessian *= hit.facing;

// Compute normal
hit.normal = normalize(hit.gradient);

// Compute principal curvatures
hit.curvatures = principal_curvatures(hit.gradient, hit.hessian);

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

