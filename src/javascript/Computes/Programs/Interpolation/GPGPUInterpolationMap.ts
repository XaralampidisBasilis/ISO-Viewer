import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Compute one feature per scalar output, using the trailing channel index or a fixed channel for split textures. */
class GPGPUInterpolationMap implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;
    packedInputs = false;
    packedOutput = false;

    constructor(inputShape: [number, number, number], channel?: number)
    {
        const [inDepth, inHeight, inWidth] = inputShape;
        this.outputShape = channel === undefined ? [...inputShape, 4] : inputShape;
        this.userCode = `
        void main() 
        {
            ${channel === undefined ? 'ivec4' : 'ivec3'} outputCoords = getOutputCoords();
            ivec3 voxelCoords = outputCoords.zyx;
            int channel = ${channel ?? 'outputCoords.w'};

            // Clamp voxel neighbors to replicate the boundary sample. Second differences use voxel-index spacing.
            ivec2 leftRight = clamp(voxelCoords.x + ivec2(-1, 1), 0, ${inWidth  - 1});
            ivec2 topBottom = clamp(voxelCoords.y + ivec2(-1, 1), 0, ${inHeight - 1});
            ivec2 frontBack = clamp(voxelCoords.z + ivec2(-1, 1), 0, ${inDepth  - 1});

            float F = getA(voxelCoords.z, voxelCoords.y, voxelCoords.x);
            if (channel == 3)
            {
                setOutput(F);
            }

            if (channel == 2)
            {
                float Fzz = getA(frontBack.x, voxelCoords.y, voxelCoords.x) + 
                            getA(frontBack.y, voxelCoords.y, voxelCoords.x) - 
                            F * 2.0;
                            
                setOutput(Fzz);
            }

            if (channel == 1)
            {
                float Fyy = getA(voxelCoords.z, topBottom.x, voxelCoords.x) + 
                            getA(voxelCoords.z, topBottom.y, voxelCoords.x) - 
                            F * 2.0;

                setOutput(Fyy);
            }

            if (channel == 0)
            {
                float Fxx = getA(voxelCoords.z, voxelCoords.y, leftRight.x  ) + 
                            getA(voxelCoords.z, voxelCoords.y, leftRight.y  ) - 
                            F * 2.0;

                setOutput(Fxx);
            }
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

/**
 * Build the same feature field for scalar WebGL storage.
 *
 * @param inputTensor - Normalized scalar field in [z,y,x] order.
 * @param channel - Optional fixed component (0–3), used when a four-channel scalar tensor exceeds the 2D texture limit.
 * @returns [z,y,x,4] in [Δxx F, Δyy F, Δzz F, F] order, or [z,y,x] for a fixed component.
 */
export function interpolationMap(inputTensor: tf.Tensor3D, channel?: number): tf.Tensor
{
  const program = new GPGPUInterpolationMap(inputTensor.shape, channel)
  return runProgram(program, [inputTensor])
}
