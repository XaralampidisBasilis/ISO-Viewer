// Mark hit as undefined when the cell has neither an intersection nor a termination point
hit.undefined = !(cell.intersected || cell.terminated);
hit.discarded = !cell.intersected;
hit.escaped = false;

if (cell.intersected) 
{
    // Compute the hit details for the intersected cell
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
