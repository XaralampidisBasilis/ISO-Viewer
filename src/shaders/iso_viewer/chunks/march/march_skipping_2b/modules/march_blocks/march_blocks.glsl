
// Skip empty space using the precomputed chebyshev distance map 
#include "./start_block"

for (int i = 0; i < MAX_BLOCKS_PER_GROUP; i++) 
{
    #include "./update_block"

    if (block.occupied || block.terminated) 
    {
        break;
    }  
}