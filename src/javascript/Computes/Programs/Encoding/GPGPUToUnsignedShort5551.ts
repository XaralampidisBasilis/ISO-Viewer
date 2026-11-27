import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Encode one unsigned 5-5-5-1 word per scalar output. */
class GPGPUPackUnsignedShort5551 implements GPGPUProgram 
{
    variableNames = ['R', 'G', 'B', 'A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: number[]) 
    {
        this.outputShape = inputShape
        this.userCode = `
        uint packUnsignedShort5551(uint x, uint y, uint z, uint o)
        {
            uint u = 
            (clamp(x, 0u, 31u) << 11) |
            (clamp(y, 0u, 31u) <<  6) |
            (clamp(z, 0u, 31u) <<  1) |
            (clamp(o, 0u,  1u) <<  0);

            return u;
        }

        // Interpret a word as a binary16 value. The active encoder instead emits its numeric integer value.
        float uintHalfBitsToHalfFloat(uint p)
        {
            return unpackHalf2x16(p).r;
        }

        void main() 
        {
            uint r = uint(getRAtOutCoords());
            uint g = uint(getGAtOutCoords());
            uint b = uint(getBAtOutCoords());
            uint a = uint(getAAtOutCoords());

            uint p = packUnsignedShort5551(r, g, b, a);
            setOutput(float(p));
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
