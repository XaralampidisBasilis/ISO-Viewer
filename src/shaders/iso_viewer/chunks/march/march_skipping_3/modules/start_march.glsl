// start cell 
cell.coords = ivec3(ray.start_position * u_intensity_map.inv_spacing + 0.5);
cell.exit_distance = ray.start_distance;

// start interpolation
poly.distances.w = ray.start_distance;
poly.intensities.w = texture(u_textures.intensity_map, camera.uvw + ray.direction_uvw * poly.distances.w).r;
poly.intensities.w -= u_rendering.intensity;