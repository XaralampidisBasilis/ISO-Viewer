
// COMPUTE DEBUG

// num fetches
vec4 debug_stats_num_fetches = to_color(float(stats.num_fetches) / mix(0.0, float(MAX_CELLS * 2), u_debugging.variable1));

// num steps
vec4 debug_stats_num_cells = to_color(float(stats.num_cells) / mix(0.0, float(MAX_CELLS), u_debugging.variable1));

// num skips
vec4 debug_stats_num_blocks = to_color(float(stats.num_blocks) / mix(0.0, float(MAX_BLOCKS), u_debugging.variable1));

// PRINT DEBUG

switch (u_debugging.option - 900)
{
    case 1: fragColor = debug_stats_num_fetches; break;
    case 2: fragColor = debug_stats_num_cells;   break;
    case 3: fragColor = debug_stats_num_blocks;   break;
}