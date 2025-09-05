import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class OccupancyProgram implements GPGPUProgram 
{
    variableNames = ['Extrema']
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
            int blockZ = coords[0];
            int blockY = coords[1];
            int blockX = coords[2];

            float blockMinVal = getExtrema(blockZ, blockY, blockX, 0);
            float blockMaxVal = getExtrema(blockZ, blockY, blockX, 1);
            bool blockOccupied = 
                ${inputThreshold} >= blockMinMaxValue.x && 
                ${inputThreshold} <= blockMinMaxValue.y;

            setOutput(blockOccupied ? 255.0 : 0.0);
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