
if (cell.intersected) 
{
    #include "./compute_trace"
}

if (!trace.intersected)
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}
