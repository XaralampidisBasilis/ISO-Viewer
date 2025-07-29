import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUOccupancy implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;

    constructor(inputExtremaMap: [number, number, number, number], inputThreshold: number) 
    {
        const [inDepth, inHeight, inWidth, channels] = inputExtremaMap;
        if (channels !== 2) 
        {
            throw new Error(`GPGPUOccupancy expects Extrema map input with 2 channels (min, max), but got ${channels}`);
        }

        this.outputShape = [inDepth, inHeight, inWidth, 1];
        this.userCode = `
        void main() 
        {
            ivec4 coords = getOutputCoords();
            int z = coords[0];
            int y = coords[1];
            int x = coords[2];
            int c = coords[3];

            float minVal = getA(z, y, x, 0);
            float maxVal = getA(z, y, x, 1);
            float occupied = (minVal <= ${inputThreshold} && ${inputThreshold} <= maxVal) ? 255.0 : 0.0;

            setOutput(occupied);
        }
        `;
    }
}

export function computeOccupancy(inputTensor: tf.Tensor4D, inputThreshold: number): tf.Tensor4D 
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const program = new GPGPUOccupancy(inputShape, inputThreshold);
    const backend = tf.backend() as MathBackendWebGL;
    const output = backend.compileAndRun(program, [inputTensor]);
    return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}