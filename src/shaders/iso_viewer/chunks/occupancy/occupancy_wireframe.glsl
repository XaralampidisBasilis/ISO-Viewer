float occupancyEdgeCoverage(float distance, ivec3 face_step, vec3 block_min, vec3 block_max,
                            vec3 direction_dx, vec3 direction_dy)
{
    int face_count = face_step.x + face_step.y + face_step.z;
    if (face_count == 0) return 0.0;
    if (face_count > 1) return 1.0;

    int axis = face_step.x != 0 ? 0 : (face_step.y != 0 ? 1 : 2);
    vec3 position = camera.position + distance * ray.direction;
    vec3 edge_distance = max(min(position - block_min, block_max - position), 0.0);

    // Differentiate the ray/plane intersection in the two screen directions.
    // The derivatives of the ray itself were taken before divergent traversal.
    vec3 slope = ray.direction * ray.inv_direction[axis];
    vec3 face_dx = distance * (direction_dx - direction_dx[axis] * slope);
    vec3 face_dy = distance * (direction_dy - direction_dy[axis] * slope);
    vec3 pixel_width = min(abs(face_dx) + abs(face_dy), 0.2 * (block_max - block_min));
    vec3 edge_pixels = edge_distance / max(pixel_width, vec3(1e-5));
    edge_pixels[axis] = 2.0;
    return 1.0 - smoothstep(0.18, 0.82, mmin(edge_pixels));
}

float occupancyWireframe(float surface_distance, vec3 direction_dx, vec3 direction_dy)
{
    ivec3 entry_step, bounds_exit_step;
    vec2 interval = intersectOccupiedBounds(entry_step, bounds_exit_step);
    float entry_distance = max(interval.x, 0.0);
    float end_distance = min(interval.y, surface_distance);
    if (end_distance <= entry_distance) return 0.0;
    if (interval.x < 0.0) entry_step = ivec3(0);

    vec3 entry_position = camera.position + ray.direction * entry_distance;
    ivec3 last_coords = u_volume.blocked_dimensions - 1;
    ivec3 coords = clamp(positionToBlockCoords(entry_position), ivec3(0), last_coords);
    vec3 far_distances = blockCoordsToFarDistances(coords);
    vec3 step_distances = float(u_volume.block_size) * abs(ray.inv_direction);
    float coverage = 0.0;

    for (int i = 0; i < MAX_BLOCKS; ++i)
    {
        ivec3 exit_step;
        float exit_distance = intersectBlockFarDistances(coords, far_distances, exit_step);
        if (min(exit_distance, end_distance) > entry_distance && sample_occupancy(coords))
        {
            vec3 block_min = vec3(coords * u_volume.block_size) - 0.5;
            vec3 block_max = min(block_min + float(u_volume.block_size), vec3(u_volume.dimensions));
            block_min = max(block_min, vec3(0.0));

            // Take the maximum so neighboring blocks do not darken shared edges.
            coverage = max(coverage, occupancyEdgeCoverage(entry_distance, entry_step, block_min, block_max,
                                                           direction_dx, direction_dy));
            float face_exit = min(exit_distance, interval.y);
            if (face_exit <= end_distance)
            {
                ivec3 face_step = exit_distance <= interval.y ? exit_step : bounds_exit_step;
                coverage = max(coverage, occupancyEdgeCoverage(face_exit, face_step, block_min, block_max,
                                                               direction_dx, direction_dy));
            }
            if (coverage >= 1.0) break;
        }

        if (exit_distance >= end_distance) break;
        coords += exit_step * ray.signs;
        if (any(lessThan(coords, ivec3(0))) || any(greaterThan(coords, last_coords))) break;
        far_distances = advanceBlockFarDistances(far_distances, step_distances, exit_distance, exit_step);
        entry_distance = max(entry_distance, exit_distance);
        entry_step = exit_step;
    }
    return coverage;
}
