
// start trace
#if SKIPPING_ENABLED == 1

    trace.distance = block.entry_distance - random(block.entry_position);
    trace.position = camera.position + ray.direction * trace.distance;

#else

    trace.distance = ray.start_distance - random(ray.start_position);
    trace.position = camera.position + ray.direction * trace.distance; 

#endif

// start interpolant
#if INTERPOLATION_METHOD == 1

    trace.residue = sample_volume_trilinear(trace.position) - u_rendering.isovalue;

#endif
#if INTERPOLATION_METHOD == 2

    trace.residue = sample_volume_tricubic(trace.position) - u_rendering.isovalue;

#endif

#if STATS_ENABLED == 1
stats.num_fetches += 1;
#endif

