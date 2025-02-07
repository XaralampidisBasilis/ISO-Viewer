#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_multiplications;
    int num_additions;
    int num_divisions;
    int num_branches;         // if/else, switch
    int num_fetches;          // texture fetch
    int num_steps;
    int num_skips;
    int num_intensity_map_fetches;
    int num_distance_map_fetches;
    int num_block_count;
    int num_cell_count;
    int num_trace_count;
};

Stats set_stats()
{
    Stats stats;
    stats.num_multiplications = 0;
    stats.num_additions       = 0;
    stats.num_divisions       = 0;
    stats.num_branches        = 0;
    stats.num_fetches         = 0;
    stats.num_steps           = 0;
    stats.num_skips           = 0;
    return stats;
}

#endif // STRUCT_STATS