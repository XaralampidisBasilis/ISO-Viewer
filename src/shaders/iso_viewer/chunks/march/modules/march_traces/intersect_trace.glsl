
#if INTERPOLATION_METHOD == 1

    #include "./intersect_trace/intersect_trace_trilinear"

#endif
#if INTERPOLATION_METHOD == 2

    #include "./intersect_trace/intersect_trace_tricubic"

#endif
