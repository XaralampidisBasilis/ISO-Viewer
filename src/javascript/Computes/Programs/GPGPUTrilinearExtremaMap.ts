import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUTrilinearExtremaMap implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number], 
        inputStride: number
    ) 
    {
        this.outputShape = inputShape.map((inputDim) => Math.ceil((inputDim + 1) / inputStride))
        this.outputShape[3] = 2        
        this.userCode = `
        
        vec2 getCellExtrema(int cellX, int cellY, int cellZ)
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

            // Compute the extrema across all cells in a block
            for (int cellZ = startZ; cellZ < endZ; cellZ++) {
            for (int cellY = startY; cellY < endY; cellY++) {
            for (int cellX = startX; cellX < endX; cellX++) {
                
                vec2 minMaxValues = getCellExtrema(cellX, cellY, cellZ);

                minValue = min(minValue, minMaxValues.x);
                maxValue = max(maxValue, minMaxValues.y);

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
            if (outputCoords.w == 0) 
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

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]): tf.Tensor
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor
}

export function computeTrilinearExtremaMap(inputTensor: tf.Tensor3D, inputStride: number) : tf.Tensor
{
    const program = new GPGPUTrilinearExtremaMap(inputTensor.shape, inputStride)
    return runProgram(program, [inputTensor]) as tf.Tensor4D
}