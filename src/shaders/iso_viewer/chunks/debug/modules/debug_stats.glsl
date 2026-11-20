
// COMPUTE DEBUG

// Fine traversal steps for the active marching method.
#if MARCHING_METHOD == 0
vec4 debug_stats_num_steps = to_color(float(stats.num_cells) / float(MAX_CELLS) * 10.0);
#else
vec4 debug_stats_num_steps = to_color(float(stats.num_traces) / float(MAX_TRACES) * 10.0);
#endif

// num traces
vec4 debug_stats_num_traces = to_color(float(stats.num_traces) / float(MAX_TRACES) * 10.0);

// num blocks
vec4 debug_stats_num_blocks = to_color(float(stats.num_blocks) / float(MAX_BLOCKS) * 10.0);

// num groups
vec4 debug_stats_num_groups = to_color(float(stats.num_groups) / float(MAX_GROUPS) * 10.0);

// num fetches
vec4 debug_stats_num_texture_fetches = to_color(float(stats.num_texture_fetches) / float(MAX_CELLS) * 10.0);

// num tests
vec4 debug_stats_num_intersection_tests = to_color(inferno(clamp(float(stats.num_intersection_tests) / float(MAX_CELLS) * 10.0, 0.0, 1.0)));


// PRINT DEBUG
switch (u_debug.option - 900)
{
    case 1: fragColor = debug_stats_num_steps;              break;
    case 2: fragColor = debug_stats_num_traces;             break;
    case 3: fragColor = debug_stats_num_blocks;             break;
    case 4: fragColor = debug_stats_num_groups;             break;
    case 5: fragColor = debug_stats_num_texture_fetches;    break;
    case 6: fragColor = debug_stats_num_intersection_tests; break;
}
