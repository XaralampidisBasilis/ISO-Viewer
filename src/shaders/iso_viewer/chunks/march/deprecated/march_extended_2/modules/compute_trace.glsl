
// // compute minimum intersection inside the cell
// cubic.roots = cubic_roots_4(cubic.coeffs);
// bvec3 is_inside = inside_closed(cubic.interval.x, cubic.interval.y, cubic.roots);
// cubic.roots = pick(is_inside, cubic.roots, cubic.interval.y);
// float root = mmin(cubic.roots);

// // update trace 
// trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
// trace.position = mix(cell.entry_position, cell.exit_position, root); 
// trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// // compute error
// trace.intensity = sample_intensity(trace.position);
// trace.error = trace.intensity - u_rendering.intensity;



float root;
if (u_debugging.variable1 > 0.7)
{
    root = bisection_root(cubic.coeffs, cubic.interval);
}
else if (u_debugging.variable1 > 0.5)
{
    root = neubauer_root(cubic.coeffs, cubic.interval);
}
else if (u_debugging.variable1 > 0.3)
{
    root = newton_bisection_root(cubic.coeffs, cubic.interval);
}
else
{
    root = newton_neubauer_root(cubic.coeffs, cubic.interval);
}

// update trace 
trace.distance = mix(cell.entry_distance, cell.exit_distance, root);
trace.position = mix(cell.entry_position, cell.exit_position, root); 
trace.intersected = inside_closed(ray.start_distance, ray.end_distance, trace.distance);

// compute error
trace.intensity = sample_intensity(trace.position);
trace.error = trace.intensity - u_rendering.intensity;



