import { GLSL3, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderTarget } from 'three'
import turboShader from '../../shaders/iso_viewer/chunks/utils/colors/colormap/turbo.glsl'
import { debugViews } from './DebugViews'

const overflowStart = 0.75
const countFormat = new Intl.NumberFormat()

function drawCounterRamp(renderer, canvas)
{
    const width = canvas.width
    const target = new WebGLRenderTarget(width, 1, { depthBuffer: false })
    const previousTarget = renderer.getRenderTarget()
    const scene = new Scene()
    const geometry = new PlaneGeometry(2, 2)
    const material = new ShaderMaterial({
        glslVersion: GLSL3,
        vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
            ${turboShader}
            out vec4 fragColor;
            void main()
            {
                float x = (gl_FragCoord.x - 0.5) / ${(width - 1).toFixed(1)};
                float t = x <= ${overflowStart}
                    ? x / ${overflowStart}
                    : 1.0 + (x - ${overflowStart}) / (1.0 - ${overflowStart});
                fragColor = vec4(t == 0.0 ? vec3(0.0) : turboBurn(t), 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.frustumCulled = false
    scene.add(mesh)
    const pixels = new Uint8Array(width * 4)
    try
    {
        renderer.setRenderTarget(target)
        renderer.render(scene, new OrthographicCamera())
        renderer.readRenderTargetPixels(target, 0, 0, width, 1, pixels)
    }
    finally
    {
        renderer.setRenderTarget(previousTarget)
        target.dispose()
        geometry.dispose()
        material.dispose()
    }

    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), width, 1), 0, 0)
    const index = Math.round((width - 1) * overflowStart) * 4
    return `rgb(${pixels[index]} ${pixels[index + 1]} ${pixels[index + 2]})`
}

export default class TraversalLegend
{
    constructor(elements, renderer)
    {
        this.elements = elements
        this.renderer = renderer
    }

    update(debug)
    {
        const legend = this.elements['counter-legend']
        const title = debugViews.Counters[debug?.option]
        const reference = debug?.counter_reference
        legend.hidden = !title || !reference
        if (legend.hidden || (this.title === title && this.reference === reference)) return

        if (!this.rampReady)
        {
            this.elements['counter-legend-one'].style.backgroundColor =
                drawCounterRamp(this.renderer, this.elements['counter-legend-ramp'])
            this.rampReady = true
        }

        this.title = title
        this.reference = reference
        legend.setAttribute('aria-label', `${title} per ray`)
        const discrete = reference === 1
        this.elements['counter-legend-scale'].hidden = discrete
        this.elements['counter-legend-swatches'].hidden = !discrete
        if (discrete) return

        const counts = new Set([0, 0.25, 0.5, 0.75, 1].map(fraction => Math.round(fraction * reference)))
        const overflow = reference * 2
        counts.add(overflow)
        this.elements['counter-legend-ticks'].replaceChildren(...Array.from(counts, count =>
        {
            const tick = document.createElement('span')
            tick.style.bottom = `${count === overflow ? 100 : count / reference * overflowStart * 100}%`
            tick.textContent = countFormat.format(count) + (count === overflow ? '+' : '')
            return tick
        }))
    }
}
