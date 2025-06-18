
// #if INTERPOLATION_METHOD == 0
// #include "./march_extended_quintic/compute_march"
// #else
// #include "./march_extended_quintic_2/compute_march"
// #endif


#if SKIPPING_METHOD == 0
#include "./modules/compute_march_no_skipping"
#else
#include "./modules/compute_march_skipping"
#endif