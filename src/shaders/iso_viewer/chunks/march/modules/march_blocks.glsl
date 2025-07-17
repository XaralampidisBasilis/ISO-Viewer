
for (int i = 0; i < MAX_BLOCKS_PER_GROUP; i++) 
{
    #include "./march_blocks/update_block"

    if (block.occupied || block.terminated) 
    {
        break;
    }  
}