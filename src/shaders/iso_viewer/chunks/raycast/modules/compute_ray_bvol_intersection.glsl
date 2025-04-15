
// Compute ray entry with bounding volume
block.exit_distance = ray.start_distance;
block.exit_position = ray.start_position;

for (int i = 0; i < MAX_BLOCKS / 4; i++) 
{
    #include "./compute_ray_bvol_intersection/update_ray_start"

    if (block.occupied || block.terminated) 
    {
        break;
    }  
}

// Compute ray exit with bounding volume
block.entry_distance = ray.end_distance;
block.entry_position = ray.end_position;

for (int i = 0; i < MAX_BLOCKS / 4; i++) 
{
    #include "./compute_ray_bvol_intersection/update_ray_end"

      if (block.occupied || block.terminated) 
    {
        break;
    }  
}

// Discard ray if no intersection with bounding volume
ray.span_distance = ray.end_distance - ray.start_distance;

if (ray.span_distance < 0.0)
{
    #include "./discard_ray"
}
