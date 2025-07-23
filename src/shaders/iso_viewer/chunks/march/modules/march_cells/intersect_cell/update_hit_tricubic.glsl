
// Compute intersection distance
float min_root = mmin(quintic.roots);
hit.distance = mix(cell.entry_distance, cell.exit_distance, min_root);

// Compute intersection position
hit.position = camera.position + ray.direction * hit.distance;

// Sample value
hit.value = sample_volume_tricubic(hit.position);

// Compute intersection residue (should be near zero)
hit.residue = hit.value - u_rendering.isovalue;

// Compute gradients and curvatures
hit.gradient = compute_gradient(hit.position, hit.curvatures);

// Compute polarity of gradient with view direction
float polarity = ssign(dot(camera.position - hit.position, hit.gradient));

// Compute normal
hit.normal = normalize(hit.gradient * polarity);
hit.curvatures *= polarity;

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

