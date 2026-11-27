int debug_count = 0;
switch (u_debug.option - 900)
{
    case 1: debug_count = stats.num_cells; break;
    case 2: debug_count = stats.num_traces; break;
    case 3: debug_count = stats.num_blocks; break;
    case 4: debug_count = stats.num_groups; break;
    case 5: debug_count = stats.num_volume_fetches + stats.num_occupancy_fetches + stats.num_distance_fetches; break;
    case 6: debug_count = stats.num_intersection_tests; break;
    case 7: debug_count = stats.num_volume_fetches; break;
    case 8: debug_count = stats.num_occupancy_fetches; break;
    case 9: debug_count = stats.num_distance_fetches; break;
    case 10: debug_count = stats.num_root_solves; break;
    case 11: debug_count = stats.num_bernstein_rejections; break;
}

if (u_debug.counter_reference > 0.0)
{
    float maximum = u_debug.counter_maximum > 0.0 ? u_debug.counter_maximum : u_debug.counter_reference;
    float t = min(float(debug_count) / maximum, 2.0);
    vec3 counter_color = debug_count == 0 ? vec3(0.0) : turboBurn(t);
    fragColor = to_color(counter_color);
}
