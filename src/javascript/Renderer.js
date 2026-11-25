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
        this.orientationCube = new OrientationCube(document.querySelector('#orientation-cube'))
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
        const { computes, configs } = this.experience
        this.orientationCube.update(this.camera.instance, computes.volume, configs.orientationCubeVisible)
    }

    destroy()
    {
        this.instance.dispose()
    }
}
