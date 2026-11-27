// Only the inspection material compiles these hooks. Each fragment records one
// event while executing the same ray, avoiding changes to traversal decisions.
int capture_count = 0;
vec4 capture_min = vec4(0.0);
vec4 capture_max = vec4(0.0);
vec4 capture_exit = vec4(0.0);

void captureEvent(vec3 minimum, vec3 maximum, float entry, float exit, float kind)
{
    if (exit <= ray.start_distance || entry >= ray.end_distance || exit <= entry) return;

    if (capture_count == int(gl_FragCoord.x) - 2)
    {
        capture_min = vec4(minimum, kind);
        capture_max = vec4(maximum, max(entry, ray.start_distance));
        capture_exit = vec4(camera.position + ray.direction * min(exit, ray.end_distance), min(exit, ray.end_distance));
    }
    capture_count++;
}

void captureBlock()
{
    if (block.occupied)
    {
        vec3 lo = clamp(vec3(block.current_coords * u_volume.block_size) - 0.5, vec3(0.0), vec3(u_volume.dimensions));
        vec3 hi = clamp(vec3((block.current_coords + 1) * u_volume.block_size) - 0.5, vec3(0.0), vec3(u_volume.dimensions));
        captureEvent(lo, hi, block.entry_distance, block.exit_distance, 3.0);
        return;
    }

    ivec3 minimum = block.min_coords;
    ivec3 maximum = block.max_coords;
    #if SKIPPING_METHOD == 2 || SKIPPING_METHOD == 4
    // Signed maps guarantee emptiness in the ray's octant. Their symmetric
    // intersection bounds also extend behind the current block.
    ivec3 positive = ivec3(greaterThanEqual(ray.signs, ivec3(0)));
    minimum = mmix(minimum, block.current_coords, positive);
    maximum = mmix(block.current_coords, maximum, positive);
    #endif

    vec3 lo = clamp(vec3(minimum * u_volume.block_size) - 0.5, vec3(0.0), vec3(u_volume.dimensions));
    vec3 hi = clamp(vec3((maximum + 1) * u_volume.block_size) - 0.5, vec3(0.0), vec3(u_volume.dimensions));
    captureEvent(lo, hi, block.entry_distance, block.exit_distance, 1.0);
}
