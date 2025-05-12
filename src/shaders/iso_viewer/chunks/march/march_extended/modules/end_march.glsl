
if (cell.intersected) 
{
    #include "./compute_trace"
}

if (trace.intersected)
{
    #include "./compute_derivatives_15"
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}