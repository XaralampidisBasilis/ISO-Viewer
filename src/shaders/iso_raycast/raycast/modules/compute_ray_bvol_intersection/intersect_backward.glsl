
#ifndef NUM_BLOCKS
#define NUM_BLOCKS MAX_BLOCKS / 2
#endif

block.entry_distance = ray.end_distance;
block.entry_position = ray.end_position; 

for (int i = 0; i < NUM_BLOCKS; i++) 
{
    #include "./update_backward"

    if (block.occupied || block.terminated) 
    {
        break;
    }  
}

ray.end_distance = block.exit_distance;
ray.end_position = block.exit_position;