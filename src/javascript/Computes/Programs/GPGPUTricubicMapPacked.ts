import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUTricubicMap implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = true

    constructor(inputShape: [number, number, number]) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 2, 2]
        this.userCode = `   
        void main()
        {
            ivec5 outputCoords = getOutputCoords();

            int voxelX = outputCoords.z;
            int voxelY = outputCoords.y;
            int voxelZ = outputCoords.x;

            ivec2 leftRight = clamp(voxelX + ivec2(-1, 1), 0, ${inWidth - 1});
            ivec2 topBottom = clamp(voxelY + ivec2(-1, 1), 0, ${inHeight - 1});
            ivec2 frontBack = clamp(voxelZ + ivec2(-1, 1), 0, ${inDepth - 1});

            float F = getInput(voxelZ, voxelY, voxelX) * 2.0;

            float Fxx = getInput(voxelZ, voxelY, leftRight.x) + 
                        getInput(voxelZ, voxelY, leftRight.y) - 
                        F;

            float Fyy = getInput(voxelZ, topBottom.x, voxelX) + 
                        getInput(voxelZ, topBottom.y, voxelX) - 
                        F;

            float Fzz = getInput(frontBack.x, voxelY, voxelX) + 
                        getInput(frontBack.y, voxelY, voxelX) - 
                        F;
         
            setOutput(vec4(Fxx, Fyy, Fzz, F));        
        }
        `;
    }
}


function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]): tf.Tensor
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

export function computeTricubicMap(inputTensor: tf.Tensor3D) : tf.Tensor
{
    const program = new GPGPUTricubicMap(inputTensor.shape)
    return runProgram(program, [inputTensor]) as tf.Tensor5D
}