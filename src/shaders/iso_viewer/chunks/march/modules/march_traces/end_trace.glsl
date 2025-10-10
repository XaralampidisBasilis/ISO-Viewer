
if (trace.intersected)
{
    // Compute hit details
    #include "./compute_hit"

    hit.undefined = false;

    // Escaped if outside valid range
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    // Discard if escaped
    hit.discarded = hit.escaped;
}
else
{
    // Undefined when neither intersection nor termination
    hit.undefined = !trace.terminated;
    hit.discarded = true;
    hit.escaped = false;
}