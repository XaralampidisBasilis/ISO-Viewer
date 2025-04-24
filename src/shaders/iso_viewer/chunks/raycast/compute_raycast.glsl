
// Compute intersection of ray with volume box
#include "./modules/compute_ray_box_intersection"

// Compute intersection of ray with bounding box
#if INTERSECT_BBOX_ENABLED == 1
#include "./modules/compute_ray_bbox_intersection"
#endif

// Compute intersection of ray with bounding volume
#if INTERSECT_BVOL_ENABLED == 1
#include "./modules/compute_ray_bvol_intersection/compute_ray_bvol_intersection"
#endif

// Compute ray spacing
#include "./modules/compute_ray_spacing"


