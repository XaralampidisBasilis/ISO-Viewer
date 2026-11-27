import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Extract the low word of packHalf2x16 for one scalar output. */
class GPGPUToHalfFloat implements GPGPUProgram 
{
    variableNames = ['InterpolationMap']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false
    
    constructor(inputShape: number[]) 
    {
        this.outputShape = inputShape
        this.userCode = `   
        float clampToHalfRange(float values) 
        {
            return clamp(values, -65504.0, 65504.0);
        }

        // Returns the IEEE-754 half-float bit pattern, lower 16 bits of the uint.
        float toHalfFloat(float x) 
        {
            x = clampToHalfRange(x);
            uint bits = packHalf2x16(vec2(x, 0.0));
            return float(bits & 0xFFFFu);
        }

        void main() 
        {
            float value = getInterpolationMapAtOutCoords();
            setOutput(toHalfFloat(value));
        }
    `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

/**
 * Encode finite values as binary16 bit patterns after clamping to ±65504.
 *
 * @param inputTensor - Float samples in the layout accepted by this WebGL program.
 * @returns A shape-preserving tensor of numeric 16-bit words for Uint16Array readback.
 * @throws If float32 render textures are unavailable. Float16 targets can round the integer words.
 */
export function toHalfFloat(inputTensor: tf.Tensor): tf.Tensor
{
    if (!tf.env().getBool('WEBGL_RENDER_FLOAT32_ENABLED'))
        throw new Error('Half-float bit encoding requires float32 render textures.')

    const shape = inputTensor.shape
    const program = new GPGPUToHalfFloat(shape)
    return runProgram(program, [inputTensor])
}
