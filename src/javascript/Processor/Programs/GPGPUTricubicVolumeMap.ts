import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

export class GPGPUTricubicVolumeMap implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth, _] = inputShape;
        this.outputShape = [inDepth, inHeight, inWidth, 4];

        this.userCode = `
        void main() 
        {
            ivec4 coords = getOutputCoords();
            int z = coords[0];
            int y = coords[1];
            int x = coords[2];
            int c = coords[3];

            float f = getA(z, y, x, 0);

            if (c == 0)
            {
                int x0 = clamp(x - 1, 0, ${inWidth - 1});
                int x1 = clamp(x + 1, 0, ${inWidth - 1});
                float Lx = getA(z, y, x0, 0) + getA(z, y, x1, 0) - 2.0 * f;
                setOutput(Lx);
            }
            else if (c == 1)
            {
                int y0 = clamp(y - 1, 0, ${inHeight - 1});
                int y1 = clamp(y + 1, 0, ${inHeight - 1});
                float Ly = getA(z, y0, x, 0) + getA(z, y1, x, 0) - 2.0 * f;
                setOutput(Ly);
            }
            else if (c == 2)
            {
                int z0 = clamp(z - 1, 0, ${inDepth - 1});
                int z1 = clamp(z + 1, 0, ${inDepth - 1});
                float Lz = getA(z0, y, x, 0) + getA(z1, y, x, 0) - 2.0 * f;
                setOutput(Lz);
            }
            else
            {
                setOutput(f);
            }
        }
        `;
    }
}

export function computeTricubicVolumeMap(inputTensor: tf.Tensor4D): tf.Tensor4D 
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const program = new GPGPUTricubicVolumeMap(inputShape);
    const backend = tf.backend() as MathBackendWebGL;
    const output = backend.compileAndRun(program, [inputTensor]);
    return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}