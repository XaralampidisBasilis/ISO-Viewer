import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Normalize four lanes of a packed XY tile with a shared scalar range. */
class GPGPUNormalize implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        globalMin: number, 
        globalMax: number
    ) 
    {
        this.outputShape = inputShape
        this.userCode = `
        void main() 
        {
            setOutput((getInputAtOutCoords() - vec4(${globalMin})) / vec4(${globalMax - globalMin}));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]): tf.Tensor
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

/**
 * Map stored intensities with (value - min) / (max - min). Constant ranges produce zeros.
 *
 * @param inputTensor - Scalar float volume in [z,y,x] order.
 * @param range - Optional finite [min,max] in stored intensity units. Without it, GPU reductions synchronously read the input extrema.
 * @returns A new tensor with the input shape. Values beyond a supplied range extrapolate.
 */
export function normalize(inputTensor: tf.Tensor3D, range?: [number, number]): tf.Tensor3D
{
    const [globalMin, globalMax] = range ?? [
        tf.min(inputTensor).arraySync() as number,
        tf.max(inputTensor).arraySync() as number,
    ]
    if (globalMin === globalMax) return tf.zerosLike(inputTensor)
    const program = new GPGPUNormalize(inputTensor.shape , globalMin , globalMax)
    return runProgram(program, [inputTensor]) as tf.Tensor3D
}
