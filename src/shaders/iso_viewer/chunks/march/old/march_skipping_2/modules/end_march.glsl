
trace.exhausted = !(cell.intersected || cell.terminated);

if (cell.intersected) 
{
    #include "./compute_intersection"
    #include "./compute_gradients"
}

if (cell.terminated)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}

