/* Sources
Numerical Recipes in C: The Art of Scientific Computing, 2nd Edition Section: Chapter 5.6 – Quadratic and Cubic Equations
(https://www.cec.uchile.cl/cinetica/pcordero/MC_libros/NumericalRecipesinC.pdf),
*/

#ifndef QUADRATIC_ROOTS
#define QUADRATIC_ROOTS

// Computes the roots of the quadratic polynomial.
// \param out_roots The location of the found roots.
// \param quad Coefficients of the quadratic for which a root should be found.
//        Coefficient poly[i] is multiplied by x^i.
// \param begin The beginning of an interval where the polynomial is monotonic.
// \param end The end of said interval.
// \return true if a root was found in [begin, end].
bool quadratic_roots(
    out vec2 out_roots,
    in vec3 poly, 
    in float begin, 
    in float end
){
    if (begin == end) return false;

    // If quadratic discriminant is negative there are no roots
    float discriminant = poly.y * poly.y - 4.0 * poly.x * poly.z;
    if (discriminant < 0.0) return false;
 
    // Compute the quadratic roots using numerically stable solutions
    float sqrt_disc = sqrt(max(discriminant, 0.0));
    float scaled_root = poly.y + (poly.y > 0.0 ? sqrt_disc : -sqrt_disc);
    float root0 = -2.0 * poly.x / scaled_root;
    float root1 = -0.5 * scaled_root / poly.z;
    root0 = clamp(root0, begin, end);
    root1 = clamp(root1, begin, end); 

    out_roots.x = min(root0, root1);
    out_roots.y = max(root0, root1);
    return true;
}

#endif






