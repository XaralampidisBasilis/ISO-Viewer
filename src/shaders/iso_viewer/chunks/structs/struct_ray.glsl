#ifndef STRUCT_RAY
#define STRUCT_RAY

struct Ray 
{
    bool  discarded;            // flag indicating if the ray has been discarded

    vec3  step_direction;       // direction vector for each step along the ray
    vec3  texture_direction;   
    float step_distance;        // fixed step distance for each ray 
    float rand_distance;        // random distance for dithering

    vec3  start_position;       // starting position of the current ray in 3d model coordinates for ray march
    vec3  end_position;         // ending position of the current ray in 3d model coordinates for ray march
    float start_distance;       // starting distance along the current ray from origin for ray march
    float end_distance;         // ending distance along the current ray from origin for ray march
    float span_distance;        // total distance that can be covered by the current ray for ray march

    int   max_step_count;       // maximum number of steps allowed
    int   max_skip_count;       // maximum number of skips allowed
};

Ray set_ray()
{
    Ray ray;
    ray.discarded         = false;
    ray.step_direction    = normalize(v_ray_direction);
    ray.texture_direction = normalize(v_ray_direction) * u_volume.inv_size;
    ray.step_distance     = 0.0;
    ray.rand_distance     = 0.0;
    ray.start_position    = vec3(0.0);
    ray.end_position      = vec3(0.0);
    ray.start_distance    = 0.0;
    ray.end_distance      = 0.0;
    ray.span_distance     = 0.0;
    ray.max_step_count    = 0;
    ray.max_skip_count    = 0;
    return ray;
}

void discard_ray(inout Ray ray)
{
    ray.discarded = true;
}

#endif // STRUCT_RAY
