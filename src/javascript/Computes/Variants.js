const layouts = { packed: 'Packed', unpacked: 'Unpacked' }
const anisotropicLayouts = {
    packed: 'Fused packed',
    unpacked: 'Fused unpacked',
    unfusedPacked: 'Unfused packed',
    unfusedUnpacked: 'Unfused unpacked',
}

const distanceStages = {
    isotropicDistance: { label: 'Isotropic distance', choices: layouts },
    anisotropicDistance: { label: 'Anisotropic distance', choices: anisotropicLayouts },
    extendedIsotropicDistance: { label: 'Extended isotropic distance', choices: layouts },
    extendedAnisotropicDistance: { label: 'Extended anisotropic distance', choices: anisotropicLayouts },
}

export function variantStages(skippingMethod)
{
    const stages = {
        volumeMap: { label: 'Normalization', choices: layouts },
        interpolationMap: { label: 'Interpolation features', choices: layouts },
        extremaMap: { label: 'Extrema bounds', choices: layouts },
        occupancyMap: { label: 'Occupancy', choices: layouts },
    }

    if (Object.hasOwn(distanceStages, skippingMethod)) stages[skippingMethod] = distanceStages[skippingMethod]

    return stages
}

export function activeVariants(configs)
{
    const fallback = configs.unpackedPreprocessing ? 'unpacked' : 'packed'
    const stages = variantStages(configs.skippingMethod)

    return Object.fromEntries(Object.keys(stages).map(key => [key, configs.preprocessingVariants?.[key] ?? fallback]))
}
