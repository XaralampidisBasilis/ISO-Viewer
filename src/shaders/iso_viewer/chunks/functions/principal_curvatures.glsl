
#ifndef PRINCIPAL_CURVATURES
#define PRINCIPAL_CURVATURES

vec2 principal_curvatures(in vec3 gradient, in mat3 hessian)
{
    vec3 normal = normalize(gradient);

    // create a linearly independent vector from normal 
    vec3 independent = (abs(normal.x) < abs(normal.y)) 
        ? (abs(normal.x) < abs(normal.z) ? vec3(1, 0, 0) : vec3(0, 0, 1)) 
        : (abs(normal.y) < abs(normal.z) ? vec3(0, 1, 0) : vec3(0, 0, 1));

    // compute arbitrary orthogonal tangent space
    mat2x3 tangent;
    tangent[0] = normalize(independent - normal * dot(independent, normal)); 
    tangent[1] = cross(normal, tangent[0]);

    // compute shape operator projected into the tangent space
    mat2 shape = (transpose(tangent) * hessian) * tangent / length(gradient);
    float determinant = determinant(shape);
    float trace = (shape[0][0] + shape[1][1]) * 0.5;

    // compute principal curvatures as eigenvalues of shape operator
    float discriminant = sqrt(abs(trace * trace - determinant));
    vec2 curvatures = trace + discriminant * vec2(-1, 1);

    // return curvatures
    return curvatures;
}

#endif