
// compute box min/max positions
cell.min_position = vec3(cell.coords) - 0.5;
cell.max_position = vec3(cell.coords) + 0.5;

// compute entry from previous exit
cell.entry_distance = cell.exit_distance;
cell.entry_position = cell.exit_position;

// compute exit from cell ray intersection 
cell.exit_distance = intersect_box_max(cell.min_position, cell.max_position, camera.position, ray.inv_direction, cell.exit_face);
cell.exit_position = camera.position + ray.direction * cell.exit_distance; 

// compute termination condition
cell.terminated = cell.exit_distance > ray.end_distance; 

// compute next coordinates
cell.coords += cell.exit_face * ray.signs;

// compute cell polynomial interpolation
#if INTERPOLATION_METHOD == 0
// #include "./update_cubic"

    #if VARIATION_ENABLED == 0
    #include "./update_cubic"
    #else
    #include "./update_cubic_2"
    #endif

#elif INTERPOLATION_METHOD == 1
#include "./update_quintic"

    // #if VARIATION_ENABLED == 0
    // #include "./update_quintic"
    // #else
    // #include "./update_quintic_2"
    // #endif

#elif INTERPOLATION_METHOD == 2
#include "./update_poly"

    // #if VARIATION_ENABLED == 0
    // #include "./update_poly"
    // #else
    // #include "./update_poly_2"
    // #endif

#endif

// update stats
#if STATS_ENABLED == 1
stats.num_cells += 1;
#endif
