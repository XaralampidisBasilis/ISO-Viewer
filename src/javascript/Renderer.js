import * as THREE from 'three'
import Experience from './Experience'
import EventEmitter from './Utils/EventEmitter'

export default class Renderer extends EventEmitter
{
    constructor()
    {
        super()
        const experience = new Experience()
        this.sizes = experience.sizes
        this.scene = experience.scene
        this.camera = experience.camera
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
        this.instance.render(this.scene, this.camera.instance)
    }

    destroy()
    {
        this.instance.dispose()
    }
}
