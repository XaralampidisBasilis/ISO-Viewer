import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class OccupancyPackedProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = false

    constructor(inputShape: [number, number, number, number, number], inputValue: number) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            int blockZ = outputCoords.x;
            int blockY = outputCoords.y;
            int blockX = outputCoords.z;

            vec4 blockMinMaxValue = getA(blockZ, blockY, blockX, 0, 0);
            bool inRange = blockMinMaxValue.x <= ${inputValue} && ${inputValue} <= blockMinMaxValue.y;
            float blockOccupied = inRange ? 255.0 : 0.0;

            setOutput(blockOccupied);
        }
        `
    }
}


export function occupancyPackedProgram(input: tf.Tensor5D, inputValue: number): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL
  const program = new OccupancyPackedProgram(input.shape, inputValue)
  const output = backend.compileAndRun(program, [input])
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D
}