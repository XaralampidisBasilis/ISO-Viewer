import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class OccupancyProgram implements GPGPUProgram 
{
    variableNames = ['Extrema']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number], inputValue: number) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        void main() 
        {
            ivec4 coords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            float minValue = getExtrema(blockCoords.z, blockCoords.y, blockCoords.x, 0);
            float maxValue = getExtrema(blockCoords.z, blockCoords.y, blockCoords.x, 1);
            bool blockOccupied = ${inputValue} >= minValue && ${inputValue} <= maxValue;

            setOutput(blockOccupied ? 1.0 : 0.0);
        }
        `;
    }
}

class OccupancyProgramPackInputs implements GPGPUProgram 
{
    variableNames = ['Extrema']
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
            ivec3 blockCoords = outputCoords.zyx;

            vec4 minMaxValue = getExtrema(blockCoords.z, blockCoords.y, blockCoords.x, 0, 0);
            bool blockOccupied = ${inputValue} >= minMaxValue.x && ${inputValue} <= minMaxValue.y;

            setOutput(blockOccupied ? 1.0 : 0.0);
        }
        `
    }
}

class OccupancyProgramPackInputsOutputs implements GPGPUProgram 
{
    variableNames = ['Extrema']
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
            vec4 minMaxValue = getExtrema(blockCoords.z, blockCoords.y + innerY, blockCoords.x + innerX, 0, 0);
            bool blockOccupied = ${inputValue} >= minMaxValue.x && ${inputValue} <= minMaxValue.y;
            return blockOccupied ? 1.0 : 0.0;
        }

        vec4 sanitizeOccupancies(vec4 occupancies, ivec3 coords)
        {
            float insideHeight = float(coords.y < ${inHeight-1});
            float insideWidth = float(coords.x < ${inWidth-1});

            occupancies.g *= insideHeight;
            occupancies.b *= insideWidth;
            occupancies.a *= insideHeight * insideWidth;

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

export function occupancyProgram(input: tf.Tensor4D, inputThreshold: number): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL;
  const program = new OccupancyProgram(input.shape as [number, number, number, number], inputThreshold);
  const output = backend.compileAndRun(program, [input]);
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}