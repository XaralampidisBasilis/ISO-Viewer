
// given the entry and exit compute the sampling distances inside the cell
poly.distances.x = poly.distances.w;
poly.distances.yzw = mmix(cell.entry_distance, cell.exit_distance, poly.weights.yzw);

// compute the sample positions from the distances
poly.intensities[0] = poly.intensities[3];
for(int n = 1; n < 4; n++) 
{
    vec3 uvw = camera.uvw + ray.direction_uvw * poly.distances[n];
    poly.intensities[n] = texture(u_textures.intensity_map, uvw).r;
}

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.yzw -= u_rendering.intensity;

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;

// compute polynomial start and ending points
poly.entry.y = poly.intensities.x;
poly.exit.y = poly.intensities.w;

// given the polynomial we can compute if we intersect the isosurface inside the cell
cell.intersected = is_cubic_solvable_2(poly.coefficients, poly.entry, poly.exit);
