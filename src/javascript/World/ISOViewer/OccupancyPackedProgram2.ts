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
            vec4 minMaxValue = getExtremaPacked(blockCoords.z, blockCoords.y + innerY, blockCoords.x + innerX, 0, 0);
            bool blockOccupied = ${inputValue} >= minMaxValue.x && ${inputValue} <= minMaxValue.y;
            return blockOccupied ? 1.0 : 0.0;
        }

        vec4 sanitizeOccupancies(vec4 occupancies, ivec3 coords)
        {
            bool insideHeight = coords.y < ${inHeight-1};
            bool insideWidth = coords.x < ${inWidth-1};

            occupancies.g = insideHeight ? occupancies.g : 0.0;
            occupancies.b = insideWidth ? occupancies.b : 0.0;
            occupancies.a = insideHeight && insideWidth ? occupancies.a : 0.0;
            return occupancies;
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            vec4 blockOccupancies = vec4(
                getOccupancy(blockCoords, 0, 0),
                getOccupancy(blockCoords, 0, 1),
                getOccupancy(blockCoords, 1, 0),
                getOccupancy(blockCoords, 1, 1)
            );

            setOutput(sanitizeOccupancies(blockOccupancies, blockCoords));
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
