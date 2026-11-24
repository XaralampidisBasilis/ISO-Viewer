#if MARCHING_METHOD == 0
int fine_step_count = stats.num_cells;
#else
int fine_step_count = stats.num_traces;
#endif

int debug_count = 0;
switch (u_debug.option - 900)
{
    case 1: debug_count = fine_step_count; break;
    case 2: debug_count = stats.num_traces; break;
    case 3: debug_count = stats.num_blocks; break;
    case 4: debug_count = stats.num_groups; break;
    case 5: debug_count = stats.num_volume_reads + stats.num_occupancy_reads + stats.num_distance_reads; break;
    case 6: debug_count = stats.num_intersection_tests; break;
    case 7: debug_count = stats.num_volume_reads; break;
    case 8: debug_count = stats.num_occupancy_reads; break;
    case 9: debug_count = stats.num_distance_reads; break;
    case 10: debug_count = stats.num_root_solves; break;
    case 11: debug_count = stats.num_bernstein_rejections; break;
}

if (u_debug.counter_reference > 0.0)
{
    vec3 counter_color = debug_count == 0 ? vec3(0.0) : turboBurn(float(debug_count) / u_debug.counter_reference);
    fragColor = to_color(counter_color);
}
