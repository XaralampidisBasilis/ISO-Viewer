import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class OccupancyProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], inputThreshold: number) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
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


export function occupancyProgram(input: tf.Tensor4D, inputThreshold: number): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL;
  const program = new OccupancyProgram(input.shape as [number, number, number, number], inputThreshold);
  const output = backend.compileAndRun(program, [input]);
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}