
// Start march 
#include "./modules/start_trace"

for (int i = 0; i < MAX_BATCH_COUNT; i++) 
{
    // March empty blocks inside volume
    #include "./modules/start_block"

    for (int b = 0; b < MAX_BLOCK_SUB_COUNT; b++) 
    {
        if (block.occupied || block.terminated) 
        {
            break;
        }
        
        #include "./modules/update_block"
    }

    // Terminate march loop
    if (block.terminated && !block.occupied) 
    {
        break;
    }

    // March cells inside current block
    #include "./modules/start_cell"

    for (int c = 0; c < MAX_CELL_SUB_COUNT; c++) 
    {
        if (cell.intersected || cell.terminated) 
        {
            break;
        }

        #include "./modules/update_cell"
    }   

    // March trace 
    #include "./modules/update_trace"

    // Terminate march loop
    if (cell.intersected || trace.terminated) 
    {
        break;
    }
}   

// Terminate march, compute intersection and gradient
#include "./modules/end_trace"
