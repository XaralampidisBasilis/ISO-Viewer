
#include "../march_blocks/start_block"
#include "./start_trace"

#if SKIPPING_STRATEGY == 0
for (int k = 0; k < MAX_BLOCKS; k++)
#else
for (int k = 0; k < MAX_GROUPS; k++)
#endif
{
    #include "../march_blocks/advance_blocks"

    if (!(block.occupied || block.terminated)) continue;

    #include "./start_trace"

    for (int i = 0; i < MAX_TRACES_IN_BLOCK; i++) 
    {
        #include "./update_trace"
        #include "./intersected_trace"

        if (trace.intersected || trace.terminated || trace.distance > block.exit_distance) break;
    }   

    if (trace.intersected || trace.terminated) break; 
}

#include "./end_trace"
