
import Experience from './javascript/Experience'

const canvas = document.querySelector('canvas.webgl')
const context = canvas.getContext('webgl2')
if (!context) 
{
  throw new Error('WebGL2 not supported by your browser or device.')
}

const experience = new Experience(canvas, context) 