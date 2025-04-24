
// compute bounding box min/max positions in grid space
vec3 bbox_min_position = u_bbox.min_position;
vec3 bbox_max_position = u_bbox.max_position;

// make sure bounding box is not bigger than box
bbox_min_position = clamp(bbox_min_position, box.min_position, box.max_position);
bbox_max_position = clamp(bbox_max_position, box.min_position, box.max_position);

// compute ray intersection distances with bounding box
vec2 ray_bbox_distances = intersect_box(bbox_min_position, bbox_max_position, camera.position, ray.direction);
ray_bbox_distances = max(ray_bbox_distances, 0.0); // clamp bbox distances above zero for the case we are inside

// update ray if there is an intersection
if (ray_bbox_distances.x < ray_bbox_distances.y)
{
    // update ray bbox distances
    ray.start_distance = ray_bbox_distances.x;
    ray.start_position = ray_bbox_distances.x * ray.direction + camera.position;
    ray.end_distance   = ray_bbox_distances.y;
    ray.end_position   = ray_bbox_distances.y * ray.direction + camera.position;
    ray.span_distance  = ray_bbox_distances.y - ray_bbox_distances.x;
}
else // discard ray if no intersection
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #else
    ray.discarded = true;
    #endif
}
