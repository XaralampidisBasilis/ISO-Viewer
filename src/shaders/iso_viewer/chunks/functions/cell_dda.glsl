#ifndef CELL_DDA
#define CELL_DDA

vec3 cellCoordsToFarDistances(ivec3 coords)
{
    vec3 farPlanes = vec3(coords) + 0.5 * vec3(ray.signs);
    vec3 distances = (farPlanes - camera.position) * ray.inv_direction;
    // A parallel axis cannot exit a cell, even if the ray lies on a face.
    return mix(distances, vec3(uintBitsToFloat(0x7f800000u)), isinf(ray.inv_direction));
}

float intersectCellFarDistances(ivec3 coords, inout vec3 farDistances, out ivec3 exitStep)
{
    float nextDistance = mmin(farDistances);
    // Each estimate is at most one increment past its exact face distance.
    // Recheck close candidates before deciding whether to cross multiple faces.
    float tolerance = 1e-6 * max(1.0, abs(nextDistance));
    bvec3 candidates = lessThanEqual(farDistances, vec3(nextDistance + tolerance));
    if (int(candidates.x) + int(candidates.y) + int(candidates.z) > 1)
    {
        farDistances = cellCoordsToFarDistances(coords);
        float exactDistance = mmin(farDistances);
        exitStep = ivec3(equal(farDistances, vec3(exactDistance)));
        return exactDistance;
    }

    exitStep = ivec3(candidates);
    int axis = candidates.x ? 0 : (candidates.y ? 1 : 2);
    float farPlane = float(coords[axis]) + 0.5 * float(ray.signs[axis]);
    // Keep the root solver's segment endpoints on the exact cell planes.
    return (farPlane - camera.position[axis]) * ray.inv_direction[axis];
}

vec3 advanceCellFarDistances(vec3 farDistances, vec3 stepDistances, float exitDistance, ivec3 exitStep)
{
    return mix(farDistances, vec3(exitDistance) + stepDistances, notEqual(exitStep, ivec3(0)));
}

#endif // CELL_DDA
