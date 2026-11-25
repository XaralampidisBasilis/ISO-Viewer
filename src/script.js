import './style.css'
import Experience from './javascript/Experience'
import GUI from './javascript/GUI'

const gui = new GUI()
const canvas = document.querySelector('canvas.webgl')
try
{
    const context = canvas.getContext('webgl2', {
        antialias: false,
        depth: true,
        powerPreference: 'high-performance',
    })
    if (!context) throw new Error('This viewer needs a browser with GPU-accelerated WebGL2.')
    new Experience(canvas, context, gui).loadQuality()
}
catch (error)
{
    console.error(error)
    gui.fail(error, true)
}
