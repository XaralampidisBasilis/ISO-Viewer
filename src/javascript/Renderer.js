import * as THREE from 'three'
import Experience from './Experience'

export default class Renderer
{
    constructor()
    {
        const experience = new Experience()
        this.sizes = experience.sizes
        this.scene = experience.scene
        this.camera = experience.camera
        this.scale = 1
        this.instance = new THREE.WebGLRenderer({
            canvas: experience.canvas,
            context: experience.context,
        })
        this.instance.setClearColor('#101923', 1)
        this.resize()
    }

    resize()
    {
        const { width, height, pixelRatio } = this.sizes
        this.instance.setDrawingBufferSize(width, height, pixelRatio * this.scale)
    }

    setInteractionScale(scale)
    {
        if (scale === this.scale) return
        this.scale = scale
        this.resize()
    }

    update()
    {
        this.instance.render(this.scene, this.camera.instance)
    }

    destroy()
    {
        this.instance.dispose()
    }
}
