
// COMPUTE DEBUG

// num fetches
vec4 debug_stats_num_fetches = to_color(float(stats.num_fetches) / float(MAX_CELLS * 3));

// num steps
vec4 debug_stats_num_cells = to_color(float(stats.num_cells) / float(MAX_CELLS));

// num skips
vec4 debug_stats_num_blocks = to_color(float(stats.num_blocks) / float(MAX_BLOCKS));

// num checks
vec4 debug_stats_num_checks = to_color(float(stats.num_tests) / mix(0.0, 100.0, u_debug.variable2));

// PRINT DEBUG

switch (u_debug.option - 900)
{
    case 1: fragColor = debug_stats_num_fetches; break;
    case 2: fragColor = debug_stats_num_cells;   break;
    case 3: fragColor = debug_stats_num_blocks;  break;
    case 4: fragColor = debug_stats_num_checks;  break;
}