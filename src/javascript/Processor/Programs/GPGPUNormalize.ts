import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUNormalize implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number], globalMin: number, globalMax: number) 
    {
        if (globalMin === globalMax) 
        {
            throw new Error(`Normalization failed: globalMin and globalMax are equal (${globalMin}).`)
        }
        this.outputShape = inputShape
        this.userCode = `
        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            float value = getA(outputCoords[0], outputCoords[1], outputCoords[2], outputCoords[3]);
            float normalizedValue = (value - ${globalMin}) / ${globalMax - globalMin};
            setOutput(normalizedValue);
        }
        `
    }
}

export function normalize(inputTensor: tf.Tensor3D): tf.Tensor3D 
{
    const inputShape = inputTensor.shape
    const globalMin = tf.min(inputTensor).arraySync() as number
    const globalMax = tf.max(inputTensor).arraySync() as number

    const program = new GPGPUNormalize(inputShape , globalMin , globalMax)
    const backend = tf.backend() as MathBackendWebGL
    const output = backend.compileAndRun(program, [inputTensor])
    
    return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor3D
}
