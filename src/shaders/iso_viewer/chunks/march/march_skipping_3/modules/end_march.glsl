
if (cell.intersected) 
{
    #include "./compute_intersection"
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}

