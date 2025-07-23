
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
#if GRADIENTS_METHOD == 1

    hit.gradient = sample_gradient_tricubic_analytic(hit.position, hit.curvatures);

#endif
#if GRADIENTS_METHOD == 2

    hit.gradient = sample_gradient_trilinear_sobel(hit.position, hit.curvatures);

#endif
#if GRADIENTS_METHOD == 3

    hit.gradient = sample_gradient_triquadratic_bspline(hit.position, hit.curvatures);

#endif
#if GRADIENTS_METHOD == 4

    hit.gradient = sample_gradient_tricubic_bspline(hit.position, hit.curvatures);

#endif

// Compute termination condition
hit.discarded = (hit.distance < ray.start_distance || ray.end_distance < hit.distance);

