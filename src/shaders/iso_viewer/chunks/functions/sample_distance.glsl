
#if SKIPPING_ENABLED == 1

    #if SKIPPING_METHOD == 2

        #include "./sample_distance/sample_distance_isotropic"
        
    #endif
    #if SKIPPING_METHOD == 3

        #include "./sample_distance/sample_distance_anisotropic"

    #endif
    #if SKIPPING_METHOD == 4

        #include "./sample_distance/sample_distances_extended"

    #endif    

#endif
