
#ifndef NUM_BLOCKS
#define NUM_BLOCKS MAX_BLOCKS / 2
#endif

block.exit_distance = ray.start_distance;
block.exit_position = ray.start_position; 

for (int i = 0; i < NUM_BLOCKS; i++) 
{
    #include "./update_forward"

    if (block.occupied || block.terminated) 
    {
        break;
    }  
}

ray.start_distance = block.entry_distance;
ray.start_position = block.entry_position;
