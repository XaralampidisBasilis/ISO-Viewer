
#if INTERPOLATION_METHOD == 1

    #include "./compute_hit/compute_hit_trilinear"

#endif
#if INTERPOLATION_METHOD == 2

    #include "./compute_hit/compute_hit_tricubic"

#endif

