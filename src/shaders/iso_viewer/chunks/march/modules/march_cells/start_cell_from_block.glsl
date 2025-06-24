
// start cell
cell.exit_distance = block.entry_distance;
cell.exit_position = block.entry_position;
cell.coords = ivec3(round(cell.exit_position));

#if INTERPOLATION_METHOD == 0
#include "./start_cubic"

#elif INTERPOLATION_METHOD == 1
#include "./start_quintic"

#elif INTERPOLATION_METHOD == 2
#include "./start_poly"
#endif