import EventEmitter from './EventEmitter'
import { debugViewIds, debugViewAvailable } from './DebugViews'

const choices = {
    colormap: [
        'parula', 'turbo', 'hsv', 'hot', 'cool', 'spring', 'summer', 'autumn',
        'winter', 'gray', 'bone', 'copper', 'pink', 'jet', 'pasteljet', 'viridis',
        'plasma', 'inferno', 'magma', 'cividis', 'ivory', 'silver', 'teal', 'amber', 'lavender',
    ],
    interpolationMethod: ['trilinear', 'tricubicCsébfalvi'],
    gradientsMethod: ['analytic', 'trilinearSobel', 'triquadraticBspline', 'tricubicBspline'],
    marchingMethod: ['digitalDifferentialAnalyzer', 'uniformStepping'],
    intersectionTest: ['uniformSamples', 'hierarchicalBrackets'],
    skippingStrategy: ['singleBlocks', 'multipleBlocks'],
    skippingMethod: ['occupancy', 'isotropicDistance', 'anisotropicDistance', 'extendedIsotropicDistance', 'extendedAnisotropicDistance'],
    diagnosticView: [0, ...debugViewIds],
    rootSolverMethod: [1, 2, 3, 4],
}

export default class Configs extends EventEmitter
{
    static Colormaps = choices.colormap
    static InterpolationMethods = choices.interpolationMethod
    static GradientsMethods = choices.gradientsMethod
    static MarchingMethods = choices.marchingMethod
    static IntersectionTests = choices.intersectionTest
    static SkippingStrategies = choices.skippingStrategy
    static SkippingMethods = choices.skippingMethod

    constructor()
    {
        super()
        Object.assign(this, {
            blockSize: 2,
            downscaleFactor: 1,
            unpackedPreprocessing: false,
            preprocessingVariants: null,
            isosurfaceValue: 0.35,
            interpolationMethod: 'tricubicCsébfalvi',
            gradientsMethod: 'triquadraticBspline',
            marchingMethod: 'digitalDifferentialAnalyzer',
            intersectionTest: 'uniformSamples',
            skippingStrategy: 'multipleBlocks',
            skippingMethod: 'anisotropicDistance',
            colormap: 'ivory',
            bernsteinEnabled: true,
            skippingEnabled: true,
            boundingBoxEnabled: true,
            boundingBoxVisible: false,
            volumeBoxVisible: false,
            orientationCubeVisible: true,
            occupancyWireframeVisible: false,
            rayInspectionVisible: false,
            gradientShading: true,
            curvatureShading: true,
            debugEnabled: false,
            diagnosticView: 0,
            rootSolverMethod: 1,
        })
    }

    set(key, value)
    {
        if (!this.valid(key, value) || this[key] === value) return false

        const oldValue = this[key]
        this[key] = value
        this.trigger('change', [{ key, oldValue, newValue: value }])
        return true
    }

    valid(key, value)
    {
        if (Object.hasOwn(choices, key)) return choices[key].includes(value)
        if (key === 'blockSize') return Number.isInteger(value) && value > 0
        if (key === 'downscaleFactor') return Number.isFinite(value) && value > 0 && value <= 1
        if (key === 'isosurfaceValue') return Number.isFinite(value) && value >= 0 && value <= 1
        return Object.hasOwn(this, key) && typeof this[key] === 'boolean' && typeof value === 'boolean'
    }

    get(key)
    {
        return Object.hasOwn(this, key) ? this[key] : null
    }

    get effectiveRootSolver()
    {
        if (!this.effectiveDebugView || (this.interpolationMethod === 'trilinear' && this.rootSolverMethod > 2)) return 1
        return this.rootSolverMethod
    }

    get effectiveDebugView()
    {
        return this.debugEnabled && debugViewAvailable(this.diagnosticView, this) ? this.diagnosticView : 0
    }
}
