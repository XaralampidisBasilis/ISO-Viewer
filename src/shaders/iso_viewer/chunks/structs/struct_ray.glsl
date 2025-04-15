#ifndef STRUCT_RAY
#define STRUCT_RAY

struct Ray 
{
    bool  discarded;  // flag indicating if the ray has been discarded

    vec3  direction;      // direction vector for each step along the ray
    vec3  direction_uvw;   
    float step_distance;  // fixed step distance for each ray 
    ivec3 octant;          // the sign of the direction vector

    vec3  start_position;  // starting position of the current ray in 3d model coordinates for ray march
    vec3  end_position;    // ending position of the current ray in 3d model coordinates for ray march
    float start_distance;  // starting distance along the current ray from origin for ray march
    float end_distance;    // ending distance along the current ray from origin for ray march
    float span_distance;   // total distance that can be covered by the current ray for ray march

    int   max_cells;       // maximum number of steps allowed
    int   max_blocks;       // maximum number of skips allowed
};

Ray set_ray()
{
    Ray ray;
    ray.discarded       = false;
    ray.direction       = normalize(v_ray_direction);
    ray.direction_uvw   = ray.direction * u_intensity_map.inv_size;
    ray.octant          = ivec3(ssign(ray.direction));
    ray.step_distance   = 0.0;
    ray.start_position  = vec3(0.0);
    ray.end_position    = vec3(0.0);
    ray.start_distance  = 0.0;
    ray.end_distance    = 0.0;
    ray.span_distance   = 0.0;
    ray.max_cells  = 0;
    ray.max_blocks = 0;
    return ray;
}

#endif // STRUCT_RAY
