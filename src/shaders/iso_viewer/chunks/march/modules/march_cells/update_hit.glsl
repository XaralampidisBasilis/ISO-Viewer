

#if INTERPOLATION_METHOD == 1

    #include "./update_hit/update_hit_trilinear"

#endif

#if INTERPOLATION_METHOD == 2

    #include "./update_hit/update_hit_tricubic"

#endif

