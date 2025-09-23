import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUTrilinearExtremaMap implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number, number], 
        inputStride: number
    ) 
    {
        const [inDepth, inHeight, inWidth, , ] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map((inDimension) => Math.ceil((inDimension + 1) / inputStride))
        this.outputShape = [outDepth, outHeight, outWidth, 2, 2]     
        this.userCode = `
        vec2 getCellExtrema(int cellX, int cellY, int cellZ)
        {
            float minValue = 1.0;
            float maxValue = 0.0;

            // Compute the min and max values of the trilinear interpolation inside a single cell
            for (int localX = 0; localX < 2; ++localX) {
            for (int localY = 0; localY < 2; ++localY) {
            for (int localZ = 0; localZ < 2; ++localZ) {
                
                int voxelX = clamp(cellX - 1 + localX, 0, ${inputShape[0] - 1});
                int voxelY = clamp(cellY - 1 + localY, 0, ${inputShape[1] - 1});
                int voxelZ = clamp(cellZ - 1 + localZ, 0, ${inputShape[2] - 1});
                
                float voxelValue = getA(voxelX, voxelY, voxelZ, 0, 0).a; // F

                minValue = min(minValue, voxelValue);
                maxValue = max(maxValue, voxelValue);

            }}}
            
            return vec2(minValue, maxValue);
        }

        // Compute the extrema across all cells in a block
        vec2 getBlockExtrema(int blockX, int blockY, int blockZ)
        {
            int startX = blockX * ${inputStride};
            int startY = blockY * ${inputStride};
            int startZ = blockZ * ${inputStride};

            int endX = startX + ${inputStride};
            int endY = startY + ${inputStride};
            int endZ = startZ + ${inputStride};

            float minValue = 1.0;
            float maxValue = 0.0;

            for (int cellX = startX; cellX < endX; ++cellX) {
            for (int cellY = startY; cellY < endY; ++cellY) {
            for (int cellZ = startZ; cellZ < endZ; ++cellZ) {
                
                vec2 cellExtrema = getCellExtrema(cellX, cellY, cellZ);

                minValue = min(minValue, cellExtrema.x);
                maxValue = max(maxValue, cellExtrema.y);

            }}}

            minValue = clamp(minValue, 0.0, 1.0);
            maxValue = clamp(maxValue, 0.0, 1.0);

            return vec2(minValue, maxValue);
        }

        void main()
        {
            ivec4 outputCoords = getOutputCoords();

            int blockX = outputCoords.x;
            int blockY = outputCoords.y;
            int blockZ = outputCoords.z;

            vec2 blockExtrema = getBlockExtrema(blockX, blockY, blockZ);
            setOutput(vec4(blockExtrema, 0.0, 0.0));
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

export function computeTrilinearExtremaMap(inputTensor: tf.Tensor5D, inputStride: number) : tf.Tensor
{
    const program = new GPGPUTrilinearExtremaMap(inputTensor.shape, inputStride)
    return runProgram(program, [inputTensor]) as tf.Tensor4D
}