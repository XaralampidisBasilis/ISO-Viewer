import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUInterpolationMap implements GPGPUProgram 
{
    variableNames = ['InputVolume']
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
            ivec3 voxelCoords = ivec3(outputCoords.z, outputCoords.y, outputCoords.x);

            ivec2 leftRight = clamp(voxelCoords.x + ivec2(-1, 1), 0, ${inWidth  - 1});
            ivec2 topBottom = clamp(voxelCoords.y + ivec2(-1, 1), 0, ${inHeight - 1});
            ivec2 frontBack = clamp(voxelCoords.z + ivec2(-1, 1), 0, ${inDepth  - 1});

            float F = getInputVolume(voxelCoords.z, voxelCoords.y, voxelCoords.x);

            float Fxx = getInputVolume(voxelCoords.z, voxelCoords.y, leftRight.x) + 
                        getInputVolume(voxelCoords.z, voxelCoords.y, leftRight.y) - 
                        F * 2.0;

            float Fyy = getInputVolume(voxelCoords.z, topBottom.x, voxelCoords.x) + 
                        getInputVolume(voxelCoords.z, topBottom.y, voxelCoords.x) - 
                        F * 2.0;

            float Fzz = getInputVolume(frontBack.x, voxelCoords.y, voxelCoords.x) + 
                        getInputVolume(frontBack.y, voxelCoords.y, voxelCoords.x) - 
                        F * 2.0;
         
            setOutput(vec4(Fxx, Fyy, Fzz, F));        
        }
        `;
    }
}

class GPGPUToHalfFloat implements GPGPUProgram 
{
    variableNames = ['InterpolationMap']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = false

    constructor(inputShape: [number, number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth, , ] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 2]
        this.userCode = `   
        vec4 getInterpolationMap(ivec3 voxelCoords)
        {
            return getInterpolationMap(voxelCoords.z, voxelCoords.y, voxelCoords.x, 0, 0);
        }

        vec4 clampToHalfRange(vec4 values) 
        {
            return clamp(values, -65504.0, 65504.0);
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 voxelCoords = outputCoords.zyx;
            int lane = outputCoords.w;

            vec4 voxelSamples = getInterpolationMap(voxelCoords);
            voxelSamples = clampToHalfRange(voxelSamples);

            uint packed = (lane == 0)
            ? packHalf2x16(vec2(voxelSamples.r, voxelSamples.g))  
            : packHalf2x16(vec2(voxelSamples.b, voxelSamples.a)); 

            setOutput(uintBitsToFloat(packed));
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

export function computeInterpolationMap(inputTensor: tf.Tensor3D) : tf.Tensor
{
    const program = new GPGPUInterpolationMap(inputTensor.shape)
    return runProgram(program, [inputTensor]) as tf.Tensor5D
}

export function toHalfFloat(InterpolationMap: tf.Tensor5D): tf.Tensor 
{
  const program = new GPGPUToHalfFloat(InterpolationMap.shape)
  return runProgram(program, [InterpolationMap]) as tf.Tensor4D
}
