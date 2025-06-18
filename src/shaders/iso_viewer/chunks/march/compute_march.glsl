
// #if INTERPOLATION_METHOD == 0
// #include "./deprecated/march_extended/compute_march"
// #else
// #include "./deprecated/march_extended_2/compute_march"
// #endif


#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif