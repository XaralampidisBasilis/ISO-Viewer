import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Legacy scalar resampler using the clamped floor of the mapped input index. */
export class GPGPUResizeNearestNeighbor implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number], 
        outputShape: [number, number, number],
        alignCorners: boolean,
        halfPixelCenters: boolean
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const [outDepth, outHeight, outWidth] = outputShape
        this.outputShape = outputShape

        // Use N - 1 for endpoint-based scales only where the output axis contains more than one sample.
        const effectiveInSize = [
            alignCorners && outDepth  > 1 ? inDepth  - 1 : inDepth,
            alignCorners && outHeight > 1 ? inHeight - 1 : inHeight,
            alignCorners && outWidth  > 1 ? inWidth  - 1 : inWidth
        ];
        const effectiveOutSize = [
            alignCorners && outDepth  > 1 ? outDepth  - 1 : outDepth,
            alignCorners && outHeight > 1 ? outHeight - 1 : outHeight,
            alignCorners && outWidth  > 1 ? outWidth  - 1 : outWidth
        ];

        const scaleFactors = effectiveInSize.map((inSize, i) => inSize / effectiveOutSize[i])
        const offsetFactor = halfPixelCenters ? 0.5 : 0.0;

        this.userCode = `
        const vec3 scaleFactors = vec3(${scaleFactors[0]}, ${scaleFactors[1]}, ${scaleFactors[2]});
        const ivec3 inputShape = ivec3(${inDepth}, ${inHeight}, ${inWidth});

        void main() 
        {
            ivec3 coords = getOutputCoords();
            // For each axis, map output index j to (j + offset) * scale - offset.
            vec3 sourceFracIndex = (vec3(coords) + ${offsetFactor}) * scaleFactors - ${offsetFactor};
            // Select the lower input sample and replicate the edge outside the grid.
            ivec3 nearestIndex = clamp(ivec3(floor(sourceFracIndex)), ivec3(0), inputShape - 1);

            float value = getInput(nearestIndex.x,  nearestIndex.y,  nearestIndex.z);

            setOutput(value);
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

function compareArrays(a: number[], b: number[]): boolean
{
    return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Resample a volume using lower-index sample selection.
 *
 * @param inputTensor - Input scalar grid in [z,y,x] order.
 * @param outputShape - Target [depth,height,width], with positive dimensions.
 * @param alignCorners - Use endpoint-based scaling for non-singleton output axes.
 * @param halfPixelCenters - Apply the independent half-pixel offset. Disable it for exact endpoint alignment.
 * @returns The original tensor when the shape matches, or a new tensor otherwise.
 */
export function resizeNearestNeighbor
(
    inputTensor: tf.Tensor3D, 
    outputShape: [number, number, number], 
    alignCorners = false, 
    halfPixelCenters = true
): tf.Tensor 
{
    if (compareArrays(inputTensor.shape, outputShape)) return inputTensor
    const program = new GPGPUResizeNearestNeighbor(inputTensor.shape, outputShape, alignCorners, halfPixelCenters);
    return runProgram(program, [inputTensor]) as tf.Tensor3D;
}