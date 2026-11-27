import Experience from '../Experience'
import ISOViewer from './ISOViewer/ISOViewer'

export default class World
{
    constructor()
    {
        const { scene, camera } = new Experience()
        this.scene = scene
        this.camera = camera
        this.viewer = new ISOViewer()
    }

    start()
    {
        this.viewer.sync()
        this.scene.add(this.viewer.mesh)
    }

    change(reframe = false)
    {
        const previousSize = this.viewer.size
        this.viewer.sync()
        const { size, unitsPerMeter } = this.viewer
        if (!reframe && !size.equals(previousSize)) this.camera.rescale(size, unitsPerMeter)
    }

    destroy()
    {
        this.viewer.destroy()
    }
}
