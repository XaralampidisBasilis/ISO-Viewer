
#include "./start_trace"

for (int i = 0; i < MAX_CELLS_PER_BLOCK * 2; i++) 
{
    #include "./update_trace"
    
    #include "./intersected_trace"

    if (trace.intersected || trace.terminated || trace.distance > block.exit_distance) 
    {
        break;
    }
}   
