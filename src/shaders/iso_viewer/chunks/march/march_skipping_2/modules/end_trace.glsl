
trace.exhausted = !(block.terminated || cell.intersected);

if (cell.intersected) 
{
    #include "./compute_intersection"
    #include "./compute_gradients"
}

if (block.terminated)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}

