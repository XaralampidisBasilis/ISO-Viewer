export const occupancyMapView = 420

// The numeric codes select fragment shader diagnostics.
export const debugViews = {
    'Surface hit': {
        454: 'Distance', 455: 'Position', 456: 'Residue',
        457: 'Derivative', 458: 'Orientation', 459: 'Normal',
        460: 'Gradient', 461: 'Steepness', 462: 'Curvatures',
        463: 'Value', 464: 'Hessian diagonal', 465: 'Hessian cross derivatives',
        451: 'Discarded', 452: 'Escaped', 453: 'Undefined',
    },
    'Traversal counters': {
        901: 'Cells traversed', 902: 'Traces traversed', 903: 'Blocks traversed', 904: 'Groups traversed',
        905: 'Texture fetches', 906: 'Intersection tests',
        907: 'Volume fetches', 908: 'Occupancy fetches', 909: 'Distance-map fetches',
        910: 'Root solves', 911: 'Bernstein rejections',
    },
    Ray: {
        101: 'Discarded',
        102: 'Direction', 103: 'Signs', 104: 'Spacing',
        105: 'Start distance', 106: 'End distance', 107: 'Span distance',
        108: 'Start position', 109: 'End position',
        110: 'Inverse direction', 111: 'Octant',
    },
    Blocks: {
        401: 'Skip coordinates', 402: 'Occupied', 403: 'Terminated',
        404: 'Coordinates', 405: 'Exit normal', 406: 'Entry distance',
        407: 'Exit distance', 408: 'Span distance', 409: 'Min position', 410: 'Max position',
        411: 'Current coordinates', 412: 'Min coordinates', 413: 'Max coordinates',
        414: 'Entry position', 415: 'Exit position',
        [occupancyMapView]: 'Occupancy map',
    },
    Cells: {
        201: 'Intersected', 202: 'Terminated', 203: 'Coordinates',
        204: 'Exit normal', 205: 'Max position', 206: 'Min position',
        207: 'Entry distance', 208: 'Exit distance', 209: 'Span distance',
        210: 'Entry position', 211: 'Exit position',
    },
    Traces: {
        301: 'Intersected', 302: 'Terminated', 303: 'Distance',
        304: 'Position', 305: 'Residue', 306: 'Residue difference',
        307: 'Previous distance', 308: 'Previous residue', 309: 'Spacing',
    },
    Lighting: {
        511: 'Material color', 512: 'Ambient color', 513: 'Diffuse color',
        514: 'Specular color', 515: 'Directional color', 516: 'Color', 517: 'Luminance',
    },
    'Volume bounds': {
        601: 'Entry distance', 602: 'Exit distance', 603: 'Span distance',
        604: 'Entry position', 605: 'Exit position',
        606: 'Min position', 607: 'Max position', 608: 'Min entry distance',
        609: 'Max exit distance', 610: 'Max span distance',
    },
    Camera: { 701: 'Position', 702: 'Direction' },
    Cubic: {
        801: 'Root', 802: 'Number of roots', 803: 'Degree',
        804: 'Coefficient weights', 805: 'Bernstein weights', 806: 'Bernstein spread',
    },
    Quintic: {
        851: 'Root', 852: 'Number of roots', 853: 'Degree',
        854: 'Coefficient weights', 855: 'Bernstein weights', 856: 'Bernstein spread',
    },
    'Custom variables': Object.fromEntries(Array.from({ length: 10 }, (_, index) => [
        1000 + index, `Variable ${index}`,
    ])),
}

// Bind the menu labels to the actual shader fields without changing numeric IDs.
export const debugViewSources = {}
for (const [base, prefix, fields] of [
    [101, 'ray', ['discarded', 'direction', 'signs', 'spacing', 'start_distance', 'end_distance', 'span_distance', 'start_position', 'end_position', 'inv_direction', 'octant']],
    [201, 'cell', ['intersected', 'terminated', 'coords', 'exit_normal', 'max_position', 'min_position', 'entry_distance', 'exit_distance', 'span_distance', 'entry_position', 'exit_position']],
    [301, 'trace', ['intersected', 'terminated', 'distance', 'position', 'residue', 'residue - trace.prev_residue', 'prev_distance', 'prev_residue', 'spacing']],
    [401, 'block', ['skip_coords', 'occupied', 'terminated', 'coords', 'exit_normal', 'entry_distance', 'exit_distance', 'span_distance', 'min_position', 'max_position', 'current_coords', 'min_coords', 'max_coords', 'entry_position', 'exit_position']],
    [451, 'hit', ['discarded', 'escaped', 'undefined', 'distance', 'position', 'residue', 'derivative', 'orientation', 'normal', 'gradient', 'gradient length', 'curvatures', 'value', 'hessian diagonal', 'hessian cross derivatives']],
    [511, 'frag', ['color_material', 'color_ambient', 'color_diffuse', 'color_specular', 'color_directional', 'color', 'color luminance']],
    [601, 'box', ['entry_distance', 'exit_distance', 'span_distance', 'entry_position', 'exit_position', 'min_position', 'max_position', 'min_entry_distance', 'max_exit_distance', 'max_span_distance']],
    [701, 'camera', ['position', 'direction']],
    [901, 'stats', ['num_cells', 'num_traces', 'num_blocks', 'num_groups', 'total texture fetches', 'num_intersection_tests', 'num_volume_fetches', 'num_occupancy_fetches', 'num_distance_fetches', 'num_root_solves', 'num_bernstein_rejections']],
    [1000, 'debug', Array.from({ length: 10 }, (_, index) => `variable${index}`)],
])
    fields.forEach((field, index) => { debugViewSources[base + index] = `${prefix}.${field}` })

debugViewSources[461] = 'length(hit.gradient)'
debugViewSources[occupancyMapView] = 'Occupied candidate blocks at the current isovalue.'
debugViewSources[464] = 'hit.hessian[0][0], [1][1], [2][2]'
debugViewSources[465] = 'hit.hessian[0][1], [0][2], [1][2]'
debugViewSources[517] = 'dot(frag.color, luminance weights)'
debugViewSources[905] = 'volume + occupancy + distance fetches'

for (const [group, base, prefix, degree] of [
    ['Cubic', 800, 'cubic', 3],
    ['Quintic', 850, 'quintic', 5],
])
{
    const entries = debugViews[group]
    for (const [offset, field] of [[1, 'root'], [2, 'roots'], [3, 'coeffs'], [4, 'coeffs'], [5, 'bernstein_coeffs'], [6, 'bernstein_coeffs']])
        debugViewSources[base + offset] = `${prefix}.${field}`
    let id = base + 7
    for (const [field, label, count] of [
        ['residuals', 'Residual', 4],
        ['coeffs', 'Coefficient', degree + 1],
        ['bernstein_coeffs', 'Bernstein coefficient', degree + 1],
        ['roots', 'Root', degree],
    ])
        for (let index = 0; index < count; index++)
        {
            entries[id] = `${label} ${index}`
            debugViewSources[id++] = `${prefix}.${field}[${index}]`
        }
    if (degree === 5)
        for (const [field, component, label, count] of [
            ['features', 'xyz', 'Features XYZ', 4],
            ['features', 'w', 'Features W', 4],
            ['biases', 'xyz', 'Biases XYZ', 3],
        ])
            for (let index = 0; index < count; index++)
            {
                entries[id] = `${label} ${index}`
                debugViewSources[id++] = `quintic.${field}[${index}].${component}`
            }
}

export const debugViewIds = Object.values(debugViews).flatMap(group => Object.keys(group).map(Number))

export function debugCounterReference(view, defines)
{
    const fineSteps = defines.MARCHING_METHOD === 0 ? defines.MAX_CELLS : defines.MAX_TRACES
    switch (view)
    {
        case 901: return defines.MAX_CELLS
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

export function debugViewUnavailableReason(view, configs)
{
    if (view === occupancyMapView) return ''

    const dda = configs.marchingMethod === 'digitalDifferentialAnalyzer'
    const trilinear = configs.interpolationMethod === 'trilinear'
    if ((view >= 200 && view < 300) || view === 901)
        return dda ? '' : 'Select Discrete Differential Analyzer in Render.'
    if ((view >= 300 && view < 400) || view === 902)
        return dda ? 'Select uniform stepping in Render.' : ''
    if ((view >= 400 && view < 450) || view === 903 || view === 904)
    {
        if (!configs.skippingEnabled) return 'Enable Skip empty space in Render.'
        if (view === 904 && configs.skippingStrategy !== 'multipleBlocks')
            return 'Select grouped block traversal.'
    }
    if (view >= 800 && view < 900)
    {
        if (!dda) return 'Select Discrete Differential Analyzer in Render.'
        if (trilinear !== (view < 850))
            return view < 850 ? 'Select trilinear interpolation in Render.' : 'Select Csébfalvi tricubic interpolation in Render.'
        if (debugViewSources[view]?.includes('bernstein') && !configs.bernsteinEnabled)
            return 'Enable Bernstein rejection in Render.'
    }
    if (view === 911 && (!dda || !configs.bernsteinEnabled))
        return 'Enable Discrete Differential Analyzer and Bernstein rejection in Render.'
    if (view >= 1003 && view <= 1009)
        return 'This custom shader variable has no assignment yet.'
    return ''
}

export function debugViewAvailable(view, configs)
{
    return !debugViewUnavailableReason(view, configs)
}
