
// compute bounding box min/max positions in grid space
vec3 bbox_min_position = u_bbox.min_position * u_intensity_map.inv_spacing;
vec3 bbox_max_position = u_bbox.max_position * u_intensity_map.inv_spacing;
bbox_min_position += TOLERANCE.CENTI;
bbox_max_position -= TOLERANCE.CENTI;

// make sure volume bounding box is not bigger than box
bbox_min_position = max(bbox_min_position, box.min_position);
bbox_max_position = min(bbox_max_position, box.max_position);

// compute ray intersection distances with bounding box
vec2 ray_bbox_distances = intersect_box(bbox_min_position, bbox_max_position, camera.position, ray.direction);
ray_bbox_distances = max(ray_bbox_distances, 0.0); // clamp bbox distances above zero for the case we are inside

// update ray if there is an intersection
if (ray_bbox_distances.x < ray_bbox_distances.y)
{
    ray.start_distance = ray.start_distance + ray_bbox_distances.x;
    ray.start_position = ray.start_position + ray_bbox_distances.x * ray.direction;
    ray.end_distance   = ray.start_distance + ray_bbox_distances.y;
    ray.end_position   = ray.start_position + ray_bbox_distances.y * ray.direction;
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
