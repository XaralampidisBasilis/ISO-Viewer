
poly5_roots(quintic.roots, quintic.coeffs, 0.0, 1.0);

float hit_distance = quintic.roots[5];
hit_distance = min(hit_distance, quintic.roots[0]);
hit_distance = min(hit_distance, quintic.roots[1]);
hit_distance = min(hit_distance, quintic.roots[2]);
hit_distance = min(hit_distance, quintic.roots[3]);
hit_distance = min(hit_distance, quintic.roots[4]);

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, hit_distance);
trace.position = mix(cell.entry_position, cell.exit_position, hit_distance);
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_tricubic_volume(trace.position);
trace.error = trace.intensity - u_rendering.intensity;
