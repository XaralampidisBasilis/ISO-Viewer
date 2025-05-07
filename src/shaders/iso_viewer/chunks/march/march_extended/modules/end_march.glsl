
if (cell.intersected) 
{
    #include "./compute_trace"
}

if (trace.intersected)
{
    #include "./compute_derivatives_8"
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}