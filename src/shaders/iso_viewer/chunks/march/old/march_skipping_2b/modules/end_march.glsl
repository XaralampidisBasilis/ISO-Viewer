

if (cell.intersected) 
{
    #include "./compute_intersection"
    #include "./compute_gradients"
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}

trace.exhausted = !(cell.intersected || cell.terminated);
