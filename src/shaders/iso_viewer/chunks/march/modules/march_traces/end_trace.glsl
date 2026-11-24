
if (trace.intersected)
{
    #if DEBUG_ENABLED == 1
    stats.num_root_solves += 1;
    #endif

    // Compute hit details
    #include "./compute_hit"

    hit.undefined = false;

    // Escaped if outside valid range
    hit.escaped = (hit.distance < ray.start_distance || hit.distance > ray.end_distance);

    // Discard if escaped
    hit.discarded = hit.escaped;

    // Clamp hit distance
    hit.distance = clamp(hit.distance, ray.start_distance, ray.end_distance);
    hit.position = camera.position + ray.direction * hit.distance;
}
else
{
    // Undefined when neither intersection nor termination
    hit.undefined = !trace.terminated;
    hit.discarded = true;
    hit.escaped = false;

    // Set discarded distance the ray end
    hit.distance = ray.end_distance;
    hit.position = camera.position + ray.direction * hit.distance;
}
