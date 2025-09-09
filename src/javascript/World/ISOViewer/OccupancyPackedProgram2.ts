import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class OccupancyPackedProgram implements GPGPUProgram 
{
    variableNames = ['ExtremaPacked']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true  

    constructor
    (
        inputShape: [number, number, number, number, number], 
        inputValue: number
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1] // Logical output shape stays the same; packing is a storage optimization.
        this.userCode = `

        float getOccupancy(ivec3 blockCoords, int innerX, int innerY) 
        {
            int blockCoordsZ = blockCoords.z;
            int blockCoordsY = blockCoords.y + innerY;
            int blockCoordsX = blockCoords.x + innerX;

            vec4 minMaxValue = getExtremaPacked(blockCoordsZ, blockCoordsY, blockCoordsX, 0, 0);
            bool blockOccupied = ${inputValue} >= minMaxValue.x && ${inputValue} <= minMaxValue.y;

            return blockOccupied ? 255.0 : 0.0;
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
    
            bool insideWidth  = blockCoords.x + 1 < ${inWidth};
            bool insideHeight = blockCoords.y + 1 < ${inHeight};

            float occupancy00 = getOccupancy(blockCoords, 0, 0);
            float occupancy01 = insideHeight ? getOccupancy(blockCoords, 0, 1) : 0.0;
            float occupancy10 = insideWidth  ? getOccupancy(blockCoords, 1, 0) : 0.0;  
            float occupancy11 = insideHeight && insideWidth ? getOccupancy(blockCoords, 1, 1) : 0.0;

            setOutput(vec4(occupancy00, occupancy01, occupancy10, occupancy11));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]): tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor4D
}

export function occupancyPackedProgram2(inputTensor: tf.Tensor5D, inputValue: number): tf.Tensor4D 
{
  const program = new OccupancyPackedProgram(inputTensor.shape as any, inputValue)
  return runProgram(program, [inputTensor]) as tf.Tensor4D
}
