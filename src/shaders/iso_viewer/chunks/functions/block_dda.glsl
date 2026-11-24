#ifndef BLOCK_DDA
#define BLOCK_DDA

vec3 blockCoordsToFarDistances(ivec3 coords)
{
    vec3 farPlanes = vec3((coords + max(ray.signs, ivec3(0))) * u_volume.block_size) - 0.5;
    vec3 distances = (farPlanes - camera.position) * ray.inv_direction;
    // Parallel axes cannot exit a block, including rays on a face.
    return mix(distances, vec3(uintBitsToFloat(0x7f800000u)), isinf(ray.inv_direction));
}

vec3 blockBoundsToFarPlanes(vec3 minPosition, vec3 maxPosition)
{
    return mix(minPosition, maxPosition, greaterThan(ray.signs, ivec3(0)));
}

vec3 blockPlanesToFarDistances(vec3 farPlanes)
{
    vec3 distances = (farPlanes - camera.position) * ray.inv_direction;
    return mix(distances, vec3(uintBitsToFloat(0x7f800000u)), isinf(ray.inv_direction));
}

vec3 distanceBlockCoordsToFarDistances(ivec3 coords)
{
    vec3 minPosition = vec3(coords * u_volume.block_size) - 0.5;
    vec3 maxPosition = vec3((coords + 1) * u_volume.block_size) - 0.5;
    return blockPlanesToFarDistances(blockBoundsToFarPlanes(minPosition - 0.001, maxPosition + 0.001));
}

float intersectBlockFarDistances(vec3 farPlanes, inout vec3 farDistances, out ivec3 exitStep)
{
    float nextDistance = mmin(farDistances);
    float tolerance = 1e-6 * max(1.0, abs(nextDistance));
    bvec3 candidates = lessThanEqual(farDistances, vec3(nextDistance + tolerance));
    // Recheck near ties against the block planes before crossing multiple axes.
    if (int(candidates.x) + int(candidates.y) + int(candidates.z) > 1)
    {
        farDistances = blockPlanesToFarDistances(farPlanes);
        float exactDistance = mmin(farDistances);
        exitStep = ivec3(equal(farDistances, vec3(exactDistance)));
        return exactDistance;
    }

    exitStep = ivec3(candidates);
    int axis = candidates.x ? 0 : (candidates.y ? 1 : 2);
    // Preserve exact block entry distances for interpolation and hit refinement.
    return (farPlanes[axis] - camera.position[axis]) * ray.inv_direction[axis];
}

float intersectBlockFarDistances(ivec3 coords, inout vec3 farDistances, out ivec3 exitStep)
{
    vec3 farPlanes = vec3((coords + max(ray.signs, ivec3(0))) * u_volume.block_size) - 0.5;
    return intersectBlockFarDistances(farPlanes, farDistances, exitStep);
}

vec3 advanceBlockFarDistances(vec3 farDistances, vec3 stepDistances, float exitDistance, ivec3 exitStep)
{
    return mix(farDistances, vec3(exitDistance) + stepDistances, notEqual(exitStep, ivec3(0)));
}

#endif // BLOCK_DDA
