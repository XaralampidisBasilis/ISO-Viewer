import { GLSL3, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderTarget } from 'three'
import turboShader from '../../shaders/iso_viewer/chunks/utils/colors/colormap/turbo.glsl'
import { debugViews } from './DebugViews'

const countFormat = new Intl.NumberFormat()

function drawCounterRamp(renderer, canvas, overflow)
{
    const width = canvas.width
    const target = new WebGLRenderTarget(width, 2, { depthBuffer: false })
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
                float t = (gl_FragCoord.x - 0.5) / ${(width - 1).toFixed(1)};
                if (gl_FragCoord.y > 1.0) t += 1.0;
                fragColor = vec4(t == 0.0 ? vec3(0.0) : turboBurn(t), 1.0);
            }
        `,
        depthTest: false,
        depthWrite: false,
    })
    const mesh = new Mesh(geometry, material)
    mesh.frustumCulled = false
    scene.add(mesh)
    const rowSize = width * 4
    const pixels = new Uint8Array(rowSize * 2)
    try
    {
        renderer.setRenderTarget(target)
        renderer.render(scene, new OrthographicCamera())
        renderer.readRenderTargetPixels(target, 0, 0, width, 2, pixels)
    }
    finally
    {
        renderer.setRenderTarget(previousTarget)
        target.dispose()
        geometry.dispose()
        material.dispose()
    }

    const colors = new Uint8ClampedArray(pixels.buffer)
    canvas.getContext('2d').putImageData(new ImageData(colors.subarray(0, rowSize), width, 1), 0, 0)
    overflow.getContext('2d').putImageData(new ImageData(colors.subarray(rowSize), width, 1), 0, 0)
    const index = (width - 1) * 4
    return `rgb(${pixels[index]} ${pixels[index + 1]} ${pixels[index + 2]})`
}

export default class TraversalLegend
{
    constructor(elements, renderer, signal, onChange)
    {
        this.elements = elements
        this.renderer = renderer
        this.overrides = new Map()
        const input = elements['counter-legend-maximum']
        input.addEventListener('change', () =>
        {
            if (!this.debug || this.debug.counter_reference <= 1) return
            const { option } = this.debug
            if (!input.validity.valid)
            {
                input.value = String(this.maximum)
                return
            }
            if (input.value === '') this.overrides.delete(option)
            else this.overrides.set(option, input.valueAsNumber)
            this.update(this.debug)
            input.value = String(this.maximum)
            onChange()
        }, { signal })
        input.addEventListener('keydown', event =>
        {
            if (event.key !== 'Enter' && event.key !== 'Escape') return
            event.preventDefault()
            event.stopPropagation()
            if (event.key === 'Escape') input.value = String(this.maximum)
            input.blur()
        }, { signal })
    }

    /** Paint the visible ruler or swatches into a viewport capture in CSS pixels. */
    drawTo(context, viewport)
    {
        const legend = this.elements['counter-legend']
        if (legend.hidden) return

        const box = element =>
        {
            const { left, top, width, height } = element.getBoundingClientRect()
            return [left - viewport.left, top - viewport.top, width, height]
        }
        const style = getComputedStyle(legend)
        context.save()
        context.fillStyle = style.backgroundColor
        context.fillRect(...box(legend))
        context.font = `${style.fontSize} ${style.fontFamily}`
        context.textBaseline = 'middle'

        const swatches = this.elements['counter-legend-swatches']
        if (swatches.hidden)
        {
            const ramp = this.elements['counter-legend-ramp']
            const [left, , width] = box(ramp)
            for (const bar of [ramp, this.elements['counter-legend-overflow']])
            {
                const [x, y, w, h] = box(bar)
                context.save()
                context.translate(x, y + h)
                context.rotate(-Math.PI / 2)
                context.drawImage(bar, 0, 0, h, w)
                context.restore()
            }
            context.fillStyle = style.color
            for (const tick of this.elements['counter-legend-ticks'].children)
            {
                const [x, y, , h] = box(tick)
                const center = y + h / 2
                context.fillRect(left + width, center, 7, 1)
                context.fillText(tick.textContent, x, center)
            }
            const [x, y, , h] = box(this.elements['counter-legend-maximum'])
            context.fillRect(left + width, y + h / 2, 7, 1)
            context.fillText(countFormat.format(this.maximum), x, y + h / 2)
        }
        else
        {
            for (const row of swatches.children)
            {
                const swatch = row.firstElementChild
                const [x, y, w, h] = box(swatch)
                const swatchStyle = getComputedStyle(swatch)
                context.fillStyle = swatchStyle.backgroundColor
                context.fillRect(x, y, w, h)
                context.strokeStyle = swatchStyle.borderColor
                context.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
                context.fillStyle = style.color
                context.fillText(row.textContent.trim(), x + w + 9, y + h / 2)
            }
        }
        context.restore()
    }

    update(debug)
    {
        const legend = this.elements['counter-legend']
        this.debug = debug
        const title = debugViews.Counters[debug?.option]
        const reference = debug?.counter_reference
        legend.hidden = !title || !reference
        if (debug) debug.counter_maximum = reference > 1 ? this.overrides.get(debug.option) ?? 0 : 0
        if (legend.hidden) return
        const discrete = reference === 1
        const maximum = debug.counter_maximum || reference
        if (this.title === title && this.reference === reference && this.maximum === maximum) return

        if (!this.rampReady)
        {
            this.elements['counter-legend-one'].style.backgroundColor =
                drawCounterRamp(this.renderer, this.elements['counter-legend-ramp'], this.elements['counter-legend-overflow'])
            this.rampReady = true
        }

        this.title = title
        this.reference = reference
        this.maximum = maximum
        legend.setAttribute('aria-label', `${title} per ray`)
        this.elements['counter-legend-scale'].hidden = discrete
        this.elements['counter-legend-swatches'].hidden = !discrete
        if (discrete) return

        this.elements['counter-legend-maximum'].value = String(maximum)
        const counts = new Set([0, 0.25, 0.5, 0.75].map(fraction => Math.round(fraction * maximum)))
        counts.delete(maximum)
        this.elements['counter-legend-ticks'].replaceChildren(...Array.from(counts, count =>
        {
            const tick = document.createElement('span')
            tick.style.bottom = `${count / maximum * 100}%`
            tick.textContent = countFormat.format(count)
            return tick
        }))
    }
}
