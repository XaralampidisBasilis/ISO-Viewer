
if (trace.intersected)
{
    #include "./compute_derivatives_15c"
}
else
{
    #if DISCARDING_DISABLED == 0
    discard;  
    #endif
}