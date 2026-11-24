
#include "../march_blocks/start_block"
#include "./start_cell"

#if SKIPPING_STRATEGY == 0
for (int k = 0; k < MAX_BLOCKS; k++)
#else
for (int k = 0; k < MAX_GROUPS; k++)
#endif
{
    #include "../march_blocks/advance_blocks"

    if (!(block.occupied || block.terminated)) continue;

    #include "./start_cell"

    for (int i = 0; i < MAX_CELLS_IN_BLOCK; i++) 
    {
        #include "./update_cell"
        #include "./intersected_cell"

        if (cell.intersected || cell.terminated || cell.exit_distance > block.exit_distance) break; 
    }   

    if (cell.intersected || cell.terminated) break;
}

#include "./end_cell"
