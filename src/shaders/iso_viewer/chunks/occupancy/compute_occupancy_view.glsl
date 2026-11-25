set_camera();
#include "../raycast/modules/start_ray"

ivec3 entry_step, exit_step;
vec2 interval = intersectOccupiedBounds(entry_step, exit_step);
float entry_distance = max(interval.x, 0.0);
if (interval.y <= entry_distance) discard;
if (interval.x < 0.0) entry_step = ivec3(0);

vec3 entry_position = camera.position + ray.direction * entry_distance;
ivec3 last_coords = u_volume.blocked_dimensions - 1;
ivec3 coords = clamp(positionToBlockCoords(entry_position), ivec3(0), last_coords);
vec3 far_distances = blockCoordsToFarDistances(coords);
vec3 step_distances = float(u_volume.block_size) * abs(ray.inv_direction);

for (int i = 0; i < MAX_BLOCKS; ++i)
{
    float exit_distance = intersectBlockFarDistances(coords, far_distances, exit_step);
    if (min(exit_distance, interval.y) > entry_distance && sample_occupancy(coords))
    {
        // From inside an occupied block, display its exit face.
        float face_distance = entry_distance;
        if (all(equal(entry_step, ivec3(0))))
        {
            face_distance = min(exit_distance, interval.y);
            entry_step = exit_step;
        }
        vec3 position = camera.position + ray.direction * face_distance;
        vec3 block_min = vec3(coords * u_volume.block_size) - 0.5;
        vec3 block_max = block_min + float(u_volume.block_size);
        block_min = max(block_min, vec3(0.0));
        block_max = min(block_max, vec3(u_volume.dimensions));
        vec3 local = clamp((position - block_min) / (block_max - block_min), 0.0, 1.0);
        float edge = mmin(mix(min(local, 1.0 - local), vec3(1.0), notEqual(entry_step, ivec3(0))));
        float light = dot(normalize(vec3(entry_step)), normalize(vec3(0.6, 0.8, 1.0)));
        vec3 fill_color = vec3(0.24, 0.83, 0.84) * mix(0.65, 1.0, light);
        fragColor = vec4(mix(vec3(0.04, 0.18, 0.20), fill_color, smoothstep(0.02, 0.10, edge)), 1.0);
        #if WRITE_SURFACE_DEPTH == 1
        writeRayDepth(face_distance);
        #endif
        return;
    }

    if (exit_distance >= interval.y) break;
    coords += exit_step * ray.signs;
    if (any(lessThan(coords, ivec3(0))) || any(greaterThan(coords, last_coords))) break;
    far_distances = advanceBlockFarDistances(far_distances, step_distances, exit_distance, exit_step);
    entry_distance = max(entry_distance, exit_distance);
    entry_step = exit_step;
}

discard;
