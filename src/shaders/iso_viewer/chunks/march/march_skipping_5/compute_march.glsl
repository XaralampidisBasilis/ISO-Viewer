
#include "./modules/start_march"

for (int n = 0; n < MAX_BLOCK_COUNT; n++) 
{
    #include "./modules/update_block"

    if (block.occupied)
    {
        #include "./modules/start_cell"

        for (int i = 0; i < MAX_CELL_SUB_COUNT; i++) 
        {
            #include "./modules/update_cell"

            if (cell.intersected || cell.terminated) 
            {
                break;
            }
        }
    }

    if (cell.intersected || block.terminated) 
    {
        break;
    }
}   

#include "./modules/end_march"