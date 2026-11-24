// The numeric codes match the switches in the fragment shader's debug modules.
export const debugViews = {
    'Surface hit': {
        454: 'Hit distance', 455: 'Hit position', 456: 'Intensity residual',
        457: 'Ray derivative', 458: 'Surface orientation', 459: 'Surface normals',
        460: 'Field gradient', 461: 'Gradient magnitude', 462: 'Principal curvatures',
        451: 'Discarded hits', 452: 'Escaped hits', 453: 'Undefined hits',
    },
    'Traversal counters': {
        901: 'Traversal steps', 903: 'Blocks visited', 904: 'Block groups visited',
        905: 'Texture fetches', 906: 'Intersection tests',
        907: 'Volume reads', 908: 'Occupancy reads', 909: 'Distance-map reads',
        910: 'Root solves', 911: 'Bernstein rejections',
    },
    Ray: {
        102: 'Direction', 103: 'Direction signs', 104: 'Sample spacing',
        105: 'Start distance', 106: 'End distance', 107: 'Span distance',
        108: 'Start position', 109: 'End position',
    },
    Blocks: {
        401: 'Skip distances', 402: 'Occupied block', 403: 'Terminated block',
        404: 'Block coordinates', 405: 'Exit face normal', 406: 'Entry distance',
        407: 'Exit distance', 408: 'Span distance', 409: 'Minimum position', 410: 'Maximum position',
    },
    Cells: {
        201: 'Intersected cell', 202: 'Terminated cell', 203: 'Cell coordinates',
        204: 'Exit face normal', 205: 'Maximum position', 206: 'Minimum position',
        207: 'Entry distance', 208: 'Exit distance', 209: 'Span distance',
    },
    Traces: {
        301: 'Intersected trace', 302: 'Terminated trace', 303: 'Trace distance',
        304: 'Trace position', 305: 'Intensity residual', 306: 'Residual span',
    },
    Lighting: {
        511: 'Material color', 512: 'Ambient light', 513: 'Diffuse light',
        514: 'Specular light', 515: 'Directional light', 517: 'Luminance',
    },
    'Volume bounds': {
        601: 'Entry distance', 602: 'Exit distance', 603: 'Span distance',
        604: 'Entry position', 605: 'Exit position',
    },
    Camera: { 701: 'Camera position', 702: 'Camera direction' },
    Cubic: {
        801: 'Nearest root', 802: 'Root count', 803: 'Polynomial degree',
        804: 'Polynomial weights', 805: 'Bernstein weights', 806: 'Bernstein spread',
    },
    Quintic: {
        851: 'Nearest root', 852: 'Root count', 853: 'Polynomial degree',
        854: 'Polynomial weights', 855: 'Bernstein weights', 856: 'Bernstein spread',
    },
}

export const debugViewIds = Object.values(debugViews).flatMap(group => Object.keys(group).map(Number))

export function debugCounterReference(view, defines)
{
    const fineSteps = defines.MARCHING_METHOD === 0 ? defines.MAX_CELLS : defines.MAX_TRACES
    switch (view)
    {
        case 901:
        case 906: return fineSteps
        case 902: return defines.MAX_TRACES
        case 903: return defines.MAX_BLOCKS
        case 904: return defines.MAX_GROUPS
        case 905:
        case 907:
        case 908:
        case 909: return fineSteps + (defines.SKIPPING_ENABLED ? defines.MAX_BLOCKS : 0)
        case 910: return 1
        case 911: return defines.MAX_CELLS
        default: return 0
    }
}

export function debugViewAvailable(view, configs)
{
    const dda = configs.marchingMethod === 'digitalDifferentialAnalyzer'
    const trilinear = configs.interpolationMethod === 'trilinear'
    if (view >= 200 && view < 300) return dda
    if (view >= 300 && view < 400) return !dda
    if (view >= 400 && view < 450) return configs.skippingEnabled
    if (view >= 800 && view < 900)
        return dda && (trilinear === (view < 850)) && (view % 50 < 5 || configs.bernsteinEnabled)
    if (view === 911) return dda && configs.bernsteinEnabled
    return true
}
