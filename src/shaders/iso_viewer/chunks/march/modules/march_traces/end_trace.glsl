// Mark hit as undefined when the trace has neither an intersection nor a termination point
hit.undefined = !(trace.intersected || trace.terminated);
hit.discarded = !trace.intersected;
hit.escaped = false;

if (trace.intersected) 
{
    // Compute the hit details for the intersected trace
    #include "./compute_hit"

    // Mark as escaped if the hit lies outside the ray's valid range
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    // Keep the hit only if it’s within the valid distance range
    hit.discarded = hit.escaped;
}

if (hit.discarded) 
{
    #if DISCARDING_ENABLED == 1
    discard;
    #endif
}
