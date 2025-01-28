#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_multiplications;
    int num_additions;
    int num_divisions;
    int num_branches;         // if/else, switch
    int num_fetches;          // texture fetch
};

Stats init_stats()
{
    Stats stats;
    stats.num_multiplications = 0;
    stats.num_additions       = 0;
    stats.num_divisions       = 0;
    stats.num_branches        = 0;
    stats.num_fetches         = 0;
    return stats;
}

#endif // STRUCT_STATS