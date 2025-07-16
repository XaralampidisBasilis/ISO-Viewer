
#if INTERPOLATION_METHOD == 0
#include "./update_cell_trilinear"
#endif

#if INTERPOLATION_METHOD == 1
#include "./update_cell_tricubic"
#endif



