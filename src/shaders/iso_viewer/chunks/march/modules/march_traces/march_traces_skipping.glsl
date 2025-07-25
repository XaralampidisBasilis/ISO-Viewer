
#include "../march_blocks/start_block"

for (int n = 0; n < MAX_GROUPS; n++) 
{
    #include "../march_blocks/march_blocks"

    if (!(block.occupied || block.terminated)) 
    {
        continue;
    }

    #include "./march_traces_per_block"

    if (trace.intersected || trace.terminated) 
    {
        break;
    }
}

#include "./end_trace"
