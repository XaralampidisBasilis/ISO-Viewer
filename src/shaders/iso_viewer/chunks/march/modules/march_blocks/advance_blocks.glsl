#if SKIPPING_STRATEGY == 1
#if DEBUG_ENABLED == 1
stats.num_groups += 1;
#endif

for (int j = 0; j < MAX_BLOCKS_IN_GROUP; j++)
{
    #include "./update_block"
    if (block.occupied || block.terminated) break;
}
#else
#include "./update_block"
#endif
