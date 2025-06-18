
#include "./modules/start_march"

for (int i = 0; i < MAX_ITERATIONS; i++) 
{

    for (int b = 0; b < MAX_BLOCKS_PER_ITERATIONS; b++) 
    {
        #include "./update_block"

        if (block.occupied || block.terminated) break;
    }    

    if (!(block.occupied || block.terminated)) continue;

    #include "./start_cell"

    for (int c = 0; c < MAX_CELLS_PER_BLOCK; c++) 
    {
        #include "./update_cell"

        if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) break;
    }   


    if (cell.intersected || cell.terminated) break;
}   

#include "./modules/end_march"
