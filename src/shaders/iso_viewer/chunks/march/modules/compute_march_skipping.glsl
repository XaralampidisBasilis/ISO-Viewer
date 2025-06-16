
#include "./march_blocks/start_block"

for (int n = 0; n < MAX_GROUPS; n++) 
{
    #include "./march_blocks/march_blocks"
    
    if (!(block.occupied || block.terminated)) 
    {
        continue;
    }

    #include "./march_cells/march_cells_per_block"

    if (cell.intersected || cell.terminated) 
    {
        break;
    }
}   

#include "./end_march"
