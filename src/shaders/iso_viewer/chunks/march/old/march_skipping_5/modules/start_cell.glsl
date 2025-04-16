
// start cell 
cell.coords = ivec3(block.entry_position * u_intensity_map.inv_spacing + 0.5);
cell.exit_distance = block.entry_distance;

// start poly
poly.distances.w = block.entry_distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;
poly.intensities.w -= u_rendering.intensity;