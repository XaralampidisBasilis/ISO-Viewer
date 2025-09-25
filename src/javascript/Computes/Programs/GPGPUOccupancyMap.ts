import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUOccupancyMap implements GPGPUProgram 
{
    variableNames = ['InputExtrema']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputValue: number
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth]
        this.userCode = `
        const float inputValue = float(${inputValue});

        vec2 getInputMinima(ivec3 coords) { return getInputExtrema(coords.z, coords.y, coords.x, 0); }
        vec2 getInputMaxima(ivec3 coords) { return getInputExtrema(coords.z, coords.y, coords.x, 1); }

        void main() 
        {
            ivec3 inputCoords = getOutputCoords().zyx;

            float minValue = getInputMinima(inputCoords);
            float maxValue = getInputMaxima(inputCoords);

            bool occupied = (inputValue >= minValue) && (inputValue <= maxValue);

            setOutput(occupied ? 1.0 : 0.0);
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

export function computeOccupancyMap(extremaMap: tf.Tensor4D, inputValue: number): tf.Tensor
{
  const program = new GPGPUOccupancyMap(extremaMap.shape as any, inputValue)
  return runProgram(program, [extremaMap]) as tf.Tensor3D
}
