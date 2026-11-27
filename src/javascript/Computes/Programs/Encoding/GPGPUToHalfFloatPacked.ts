import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Extract four binary16 words per packed output tile, preserving RGBA lane order. */
class GPGPUToHalfFloat implements GPGPUProgram 
{
    variableNames = ['InterpolationMap']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true
    
    constructor(inputShape: number[]) 
    {
        this.outputShape = inputShape
        this.userCode = `   
        vec4 clampToHalfRange(vec4 values) 
        {
            return clamp(values, -65504.0, 65504.0);
        }

        // Each integer bit pattern is written as a numeric float32.
        vec4 toHalfFloat(vec4 v) 
        {
            v = clampToHalfRange(v);

            uint p0 = packHalf2x16(v.rg);
            uint p1 = packHalf2x16(v.ba);

            uint rBits = p0 & 0xFFFFu;
            uint gBits = p0 >> 16;
            uint bBits = p1 & 0xFFFFu;
            uint aBits = p1 >> 16;

            return vec4(rBits, gBits, bBits, aBits);
        }

        void main() 
        {
            vec4 samples = getInterpolationMapAtOutCoords();
            setOutput(toHalfFloat(samples));
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
