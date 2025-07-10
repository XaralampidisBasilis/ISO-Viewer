import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUNormalize implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;

    constructor(inputShape: [number, number, number, number], globalMin: number, globalMax: number) 
    {
        if (globalMin === globalMax) 
        {
            throw new Error(`Normalization failed: globalMin and globalMax are equal (${globalMin}).`);
        }

        const range = globalMax - globalMin;
        this.outputShape = [...inputShape];
        this.userCode = `
        void main() 
        {
            ivec4 coords = getOutputCoords();
            float value = getA(coords[0], coords[1], coords[2], coords[3]);

            float normalized = (value - ${globalMin}) / ${range};
            setOutput(normalized);
        }
        `;
    }
}

export function normalize(inputTensor: tf.Tensor4D): tf.Tensor4D 
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const globalMin = tf.min(inputTensor).dataSync()[0] as number;
    const globalMax = tf.max(inputTensor).dataSync()[0] as number;
    const program = new GPGPUNormalize(inputShape, globalMin, globalMax);
    const backend = tf.backend() as MathBackendWebGL;
    const output = backend.compileAndRun(program, [inputTensor]);
    return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}
