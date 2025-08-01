import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUTrilinearExtrema implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string

    constructor(inputShape: number[], inputStride: number) 
    {
        this.outputShape = inputShape.map((inputDim) => Math.ceil((inputDim + 1) / inputStride))
        this.outputShape[3] = 2        
        this.userCode = `
        // Compute the min and max values of the trilinear interpolation inside a single cell
        vec2 computeCellExtrema(int cellX, int cellY, int cellZ)
        {
            float minValue = 1.0;
            float maxValue = 0.0;

            for (int localZ = 0; localZ < 2; ++localZ) {
            for (int localY = 0; localY < 2; ++localY) {
            for (int localX = 0; localX < 2; ++localX) {
            
                int voxelZ = clamp(cellZ - 1 + localZ, 0, ${inputShape[2] - 1});
                int voxelY = clamp(cellY - 1 + localY, 0, ${inputShape[1] - 1});
                int voxelX = clamp(cellX - 1 + localX, 0, ${inputShape[0] - 1});
                
                float voxelValue = getA(voxelX, voxelY, voxelZ, 3); // raw scalar value

                minValue = min(minValue, voxelValue);
                maxValue = max(maxValue, voxelValue);

            }}}
            
            return vec2(minValue, maxValue);
        }

        // Compute the extrema across all cells in a block
        vec2 computeBlockExtrema(int blockX, int blockY, int blockZ)
        {
            int startX = blockX * ${inputStride};
            int startY = blockY * ${inputStride};
            int startZ = blockZ * ${inputStride};

            int endX = startX + ${inputStride};
            int endY = startY + ${inputStride};
            int endZ = startZ + ${inputStride};

            float minValue = 1.0;
            float maxValue = 0.0;

            for (int cellZ = startZ; cellZ < endZ; ++cellZ) {
            for (int cellY = startY; cellY < endY; ++cellY) {
            for (int cellX = startX; cellX < endX; ++cellX) {
                
                vec2 cellExtrema = computeCellExtrema(cellX, cellY, cellZ);

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

            vec2 blockExtrema = computeBlockExtrema(blockX, blockY, blockZ);

            int outputChannel = outputCoords.w;
            if (outputChannel == 0) 
            {
                setOutput(blockExtrema.x); // min value
            } 
            else 
            {
                setOutput(blockExtrema.y); // max value
            }
        }
        `
    }
}

export function computeTrilinearExtrema(inputTensor: tf.Tensor, inputStride: number) : tf.Tensor4D
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const program = new GPGPUTrilinearExtrema(inputShape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}