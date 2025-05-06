#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_fetches; // texture fetch
    int num_cells;
    int num_blocks;
};

Stats stats; // Global mutable struct

void set_stats()
{
    stats.num_fetches = 0;
    stats.num_cells   = 0;
    stats.num_blocks  = 0;
}

#endif // STRUCT_STATS