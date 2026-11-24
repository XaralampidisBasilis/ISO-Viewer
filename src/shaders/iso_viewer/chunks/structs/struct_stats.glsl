#ifndef STRUCT_STATS
#define STRUCT_STATS

struct Stats
{
    int num_volume_reads;
    int num_occupancy_reads;
    int num_distance_reads;
    int num_groups;
    int num_cells;
    int num_blocks;
    int num_traces;
    int num_intersection_tests;
    int num_root_solves;
    int num_bernstein_rejections;
};

Stats stats; // Global mutable struct

void set_stats()
{
    stats.num_groups  = 0;
    stats.num_blocks  = 0;
    stats.num_cells   = 0;
    stats.num_traces  = 0;
    stats.num_volume_reads = 0;
    stats.num_occupancy_reads = 0;
    stats.num_distance_reads = 0;
    stats.num_intersection_tests  = 0;
    stats.num_root_solves = 0;
    stats.num_bernstein_rejections = 0;
}

#endif // STRUCT_STATS
