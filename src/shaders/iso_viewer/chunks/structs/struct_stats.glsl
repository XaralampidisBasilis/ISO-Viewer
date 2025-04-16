#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_fetches; // texture fetch
    int num_steps;
    int num_skips;
};

Stats stats; // Global mutable struct

void set_stats()
{
    stats.num_fetches = 0;
    stats.num_steps   = 0;
    stats.num_skips   = 0;
}

#endif // STRUCT_STATS