import * as THREE from 'three'
import Experience from './Experience'
import EventEmitter from './Utils/EventEmitter'
import OrientationCube from './Utils/OrientationCube'

export default class Renderer extends EventEmitter
{
    constructor()
    {
        super()
        const experience = new Experience()
        this.sizes = experience.sizes
        this.scene = experience.scene
        this.camera = experience.camera
        this.experience = experience
        this.orientationCube = new OrientationCube(document.querySelector('#orientation-cube'), (normal, up, pointer) =>
        {
            if (!experience.ready || experience.loading || experience.applying || experience.pending.size) return
            this.camera.alignToFace(normal, up)
            if (pointer && this.camera.mode === 'fly') experience.canvas.focus({ preventScroll: true })
        }, experience.abort.signal)
        this.scale = 1
        this.instance = new THREE.WebGLRenderer({
            canvas: experience.canvas,
            context: experience.context,
        })
        this.instance.setClearColor('#211d20', 1)
        this.resize()
    }

    resize()
    {
        const { width, height, pixelRatio } = this.sizes
        this.instance.setDrawingBufferSize(width, height, pixelRatio * this.scale)
        this.trigger('resize')
    }

    setInteractionScale(scale)
    {
        if (scale === this.scale) return
        this.scale = scale
        this.resize()
    }

    update()
    {
        this.experience.world.viewer.rayOverlay.update()
        this.instance.render(this.scene, this.camera.instance)
        const { computes, configs } = this.experience
        const theme = document.documentElement.dataset.theme
        this.orientationCube.update(this.camera.instance, computes.volume, configs.orientationCubeVisible, theme)
    }

    captureViewport(legend)
    {
        const { canvas } = this.experience
        const bounds = canvas.getBoundingClientRect()
        const image = document.createElement('canvas')
        image.width = canvas.width
        image.height = canvas.height
        const context = image.getContext('2d')
        if (!context || !bounds.width || !bounds.height) throw new Error('The viewport is unavailable.')

        // Copy immediately after rendering, while the WebGL drawing buffer still holds the frame.
        this.update()
        context.drawImage(canvas, 0, 0)
        context.scale(image.width / bounds.width, image.height / bounds.height)
        const orientation = this.orientationCube.canvas
        if (!orientation.hidden)
        {
            const box = orientation.getBoundingClientRect()
            context.globalAlpha = Number(getComputedStyle(orientation).opacity)
            context.drawImage(orientation, box.left - bounds.left, box.top - bounds.top, box.width, box.height)
            context.globalAlpha = 1
        }
        legend.drawTo(context, bounds)

        return new Promise((resolve, reject) =>
        {
            image.toBlob(blob =>
            {
                if (blob) resolve(blob)
                else reject(new Error('Could not encode the viewport PNG.'))
            }, 'image/png')
        })
    }

    destroy()
    {
        this.instance.dispose()
    }
}
