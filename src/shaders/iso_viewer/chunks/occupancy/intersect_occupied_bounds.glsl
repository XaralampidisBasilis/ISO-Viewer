vec2 intersectOccupiedBounds(out ivec3 entry_step, out ivec3 exit_step)
{
    entry_step = ivec3(0);
    exit_step = ivec3(0);
    if (!u_bbox.occupied) return vec2(0.0);

    // Give parallel rays unbounded slabs after checking that they lie within the box.
    bvec3 parallel = isinf(ray.inv_direction);
    vec3 clamped_camera = clamp(camera.position, u_bbox.min_position, u_bbox.max_position);
    if (any(notEqual(mix(clamped_camera, camera.position, parallel), clamped_camera))) return vec2(0.0);
    vec3 bounds_min = mix(u_bbox.min_position, camera.position - 1.0, parallel);
    vec3 bounds_max = mix(u_bbox.max_position, camera.position + 1.0, parallel);
    return intersect_box(bounds_min, bounds_max, camera.position, ray.inv_direction, entry_step, exit_step);
}
