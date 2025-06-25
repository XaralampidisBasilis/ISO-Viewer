
// #if VARIATION_ENABLED == 0
// #include "./deprecated/march_cubic/compute_march"
// #else
// #include "./deprecated/march_cubic_2/compute_march"
// #endif

// #if VARIATION_ENABLED == 0
// #include "./deprecated/march_quintic/compute_march"
// #else
// #include "./deprecated/march_quintic_2/compute_march"
// #endif

#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif