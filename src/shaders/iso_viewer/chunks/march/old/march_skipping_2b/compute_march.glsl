
// start march at ray start
#include "./modules/start_march"

for (int n = 0; n < MAX_GROUPS; n++) 
{
    #include "./modules/march_blocks/march_blocks"
    
    #include "./modules/march_cells/march_cells"

    // Termination condition
    if (cell.intersected || block.terminated) 
    {
        break;
    }
}   

// terminate march, compute intersection and gradient
#include "./modules/end_march"
