import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class TrilaplacianPackedProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = true

    constructor(inputShape: [number, number, number, number]) 
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

            float F = getA(voxelZ, voxelY, voxelX, 0);

            float Fxx = getA(voxelZ, voxelY, leftRight.x, 0) + 
                        getA(voxelZ, voxelY, leftRight.y, 0) - F * 2.0;

            float Fyy = getA(voxelZ, topBottom.x, voxelX, 0) + 
                        getA(voxelZ, topBottom.y, voxelX, 0) - F * 2.0;

            float Fzz = getA(frontBack.x, voxelY, voxelX, 0) + 
                        getA(frontBack.y, voxelY, voxelX, 0) - F * 2.0;
         
            setOutput(vec4(Fxx, Fyy, Fzz, F)); // setOutput(vec4(0.0, 1.0, 2.0, 3.0));           
        }
        `;
    }
}


export function trilaplacianPackedProgram(inputTensor: tf.Tensor4D): tf.Tensor4D 
{
    const inputShape = inputTensor.shape
    const backend = tf.backend() as MathBackendWebGL
    const program = new TrilaplacianPackedProgram(inputShape)
    const output = backend.compileAndRun(program, [inputTensor])

    return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D
}