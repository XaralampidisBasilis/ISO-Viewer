
poly_roots(quintic.roots, quintic.coefficients, poly.interval.x, poly.interval.y);

float root = quintic.roots[5];
root = min(root, quintic.roots[0]);
root = min(root, quintic.roots[1]);
root = min(root, quintic.roots[2]);
root = min(root, quintic.roots[3]);
root = min(root, quintic.roots[4]);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_laplacians_intensity_map(trace.position).a;
trace.error = trace.intensity - u_rendering.intensity;

debug.variable0 = to_color(quintic.roots[0]);
debug.variable1 = to_color(quintic.roots[1]);
debug.variable2 = to_color(quintic.roots[2]);
debug.variable3 = to_color(quintic.roots[3]);
debug.variable4 = to_color(quintic.roots[4]);
debug.variable5 = to_color(quintic.roots[5]);
