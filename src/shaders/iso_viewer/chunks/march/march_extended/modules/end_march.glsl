
if (cell.intersected) 
{
    #include "./compute_trace"
}

if (trace.intersected)
{
    if (u_debugging.variable1 < 0.5)
    {
        #include "./compute_derivatives_15"
    }
    else
    {
        #include "./compute_derivatives_15q"
    }
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}