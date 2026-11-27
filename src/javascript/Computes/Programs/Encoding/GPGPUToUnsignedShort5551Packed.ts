import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Encode one unsigned 5-5-5-1 word per lane on a packed output tile. */
class GPGPUPackUnsignedShort5551 implements GPGPUProgram 
{
    variableNames = ['R', 'G', 'B', 'A']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor(inputShape: number[]) 
    {
        this.outputShape = inputShape
        this.userCode = `
        uvec4 packUnsignedShort5551(uvec4 r, uvec4 g, uvec4 b, uvec4 a) 
        {
            uvec4 u = 
            (clamp(r, 0u, 31u) * 2048u) |
            (clamp(g, 0u, 31u) *   64u) |
            (clamp(b, 0u, 31u) *    2u) |
            (clamp(a, 0u,  1u) *    1u);

            return u;
        }
            
        // Interpret a word as a binary16 value. The active encoder instead emits its numeric integer value.
        vec4 uintHalfBitsToHalfFloat(uvec4 packed)
        {
            return vec4(
                unpackHalf2x16(packed.x).r,
                unpackHalf2x16(packed.y).r,
                unpackHalf2x16(packed.z).r,
                unpackHalf2x16(packed.w).r
            );
        }

        void main() 
        {
            uvec4 r = uvec4(getRAtOutCoords());
            uvec4 g = uvec4(getGAtOutCoords());
            uvec4 b = uvec4(getBAtOutCoords());
            uvec4 a = uvec4(getAAtOutCoords());
    
            uvec4 p = packUnsignedShort5551(r, g, b, a);
            setOutput(vec4(p));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

/**
 * Encode three block extents in bits 15–11, 10–6, and 5–1, followed by occupancy in bit 0.
 *
 * @param inputR - Nonnegative integer X extents. Also determines the output shape.
 * @param inputG - Nonnegative integer Y extents with a compatible shape.
 * @param inputB - Nonnegative integer Z extents with a compatible shape.
 * @param inputA - Binary occupancy. The spatial grid can broadcast across octants.
 * @returns Numeric 16-bit words, with extents saturated to 31. Exact storage of all words requires a float32 render target.
 */
export function packUnsignedShort5551(inputR: tf.Tensor, inputG: tf.Tensor, inputB: tf.Tensor, inputA: tf.Tensor): tf.Tensor
{
    const shape = inputR.shape
    const program = new GPGPUPackUnsignedShort5551(shape)
    return runProgram(program, [inputR, inputG, inputB, inputA])
}
