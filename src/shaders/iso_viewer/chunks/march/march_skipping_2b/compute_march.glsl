
// start march at ray start
#include "./modules/start_march"

for (int batch = 0; batch < MAX_GROUPS; batch++) 
{
    // Skip empty space using the precomputed chebyshev distance map 
    #include "./modules/start_block"

    for (int count = 0; count < MAX_BLOCKS_PER_GROUP; count++) 
    {
        #include "./modules/update_block"

        if (block.occupied || block.terminated) 
        {
            break;
        }  
    }

    // March analytically the volume cells inside an occupied block
    #include "./modules/start_cell"

    for (int count = 0; count < MAX_CELLS_PER_BLOCK; count++) 
    {
        #include "./modules/update_cell"

        if (cell.intersected || cell.terminated) 
        {
            break;
        }
    }   

    // Termination condition
    cell.terminated = cell.exit_distance > ray.end_distance;

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

// terminate march, compute intersection and gradient
#include "./modules/end_march"
