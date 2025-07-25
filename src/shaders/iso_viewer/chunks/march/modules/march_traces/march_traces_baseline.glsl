
#include "./start_trace"

for (int i = 0; i < MAX_CELLS * 2; i++) 
{
    #include "./update_trace"

    #include "./intersected_trace"

    if (trace.intersected || trace.terminated) 
    {
        break;
    }
}

#include "./end_trace"
