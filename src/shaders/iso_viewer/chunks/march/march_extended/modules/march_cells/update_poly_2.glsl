
// given the start and exit compute the sampling distances inside the cell
poly.distances = mmix(cell.entry_distance, cell.exit_distance, poly.weights);

// compute the intensity samples inside the cell from the intensity map texture
poly.intensities.x = poly.intensities.w;
poly.intensities.y = sample_intensity_map(camera.position + ray.direction * poly.distances.y);
poly.intensities.z = sample_intensity_map(camera.position + ray.direction * poly.distances.z);
poly.intensities.w = sample_intensity_map(camera.position + ray.direction * poly.distances.w);

// from the sampled intensities we can compute the trilinear interpolation cubic polynomial coefficients
poly.coefficients = poly.inv_vander * poly.intensities;


vec4 k0, x0, x1, f0, f1, g0, g1;

// gradient decent
k0 = vec4(u_debugging.variable1);
x0 = poly.distances;
poly_horner(poly.coefficients, x0, f0, g0);

for (int i = 0; i < 10; i++)
{   
    x1 = clamp(x0 - g0 * k0, 0.0, 1.0);
    poly_horner(poly.coefficients, x1, f0, g1);
    k0 = abs((x1 - x0) / (g1 - g0));
    k0 *= vec4(greaterThan(abs(x1 - x0), vec4(0.001)));
    g0 = g1;
    x0 = x1;

}

// gradient accent
k0 = vec4(u_debugging.variable1);
x0 = poly.distances;
poly_horner(poly.coefficients, x0, f1, g0);

for (int i = 0; i < 10; i++)
{   
    x1 = clamp(x0 + g0 * k0, 0.0, 1.0);
    poly_horner(poly.coefficients, x1, f1, g1);
    k0 = abs((x1 - x0) / (g1 - g0));
    k0 *= vec4(lessThanEqual(abs(x1 - x0), vec4(0.001)));
    g0 = g1;
    x0 = x1;
}

f0 -= u_rendering.intensity;
f1 -= u_rendering.intensity;

// check if there are sign crossings between minima and maxima
cell.intersected = any(lessThanEqual(f0 * f1, vec4(0.0)));

