
// #if SKIPPING_ENABLED == 1

//     #include "./modules/march_skipping"

// #else

//     #include "./modules/march_baseline"
    
// #endif


#if SKIPPING_ENABLED == 1

    #include "./modules/march_traces/march_traces_skipping"

#else

    #include "./modules/march_traces/march_traces_baseline"
    
#endif
