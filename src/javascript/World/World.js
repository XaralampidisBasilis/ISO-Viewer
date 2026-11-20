import Experience from '../Experience'
import ISOViewer from './ISOViewer/ISOViewer'

export default class World
{
    constructor()
    {
        this.scene = new Experience().scene
        this.viewer = new ISOViewer()
    }

    start()
    {
        this.viewer.sync()
        this.scene.add(this.viewer.mesh)
    }

    change()
    {
        this.viewer.sync()
    }

    destroy()
    {
        this.viewer.destroy()
    }
}
