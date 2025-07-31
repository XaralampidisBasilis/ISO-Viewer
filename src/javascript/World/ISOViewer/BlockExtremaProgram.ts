import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


const trilinearCode = (inputShape: number[], inputStride: number) => `

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
const tricubicCode = (inputShape: number[], inputStride: number) => `

    // Compute the extrema of the tricubic interpolation in a single cell
    vec2 computeCellExtrema(int cellX, int cellY, int cellZ)
    {
        // Bernstein elevation coefficients (order 1 → order 3)
        const vec2 BernsteinElevations[4] = vec2[4](
            vec2(1.0, 0.0),
            vec2(2.0 / 3.0, 1.0 / 3.0),
            vec2(1.0 / 3.0, 2.0 / 3.0),
            vec2(0.0, 1.0)
        );

        // Bernstein contribution coefficients for mixed-order derivatives
        const vec2 BernsteinContributions[4] = vec2[4](
            vec2(0.0, 0.0),
            vec2(-1.0 / 4.0, 0.0),
            vec2(0.0, -1.0 / 4.0),
            vec2(0.0, 0.0)
        );

        float minValue = 1.0;
        float maxValue = 0.0;

        for (int coeffZ = 0; coeffZ < 4; ++coeffZ) {
        for (int coeffY = 0; coeffY < 4; ++coeffY) {
        for (int coeffX = 0; coeffX < 4; ++coeffX) {

            float bernsteinCoeff = 0.0;

            for (int localZ = 0; localZ < 2; ++localZ) {
            for (int localY = 0; localY < 2; ++localY) {
            for (int localX = 0; localX < 2; ++localX) {

                int voxelZ = clamp(cellZ - 1 + localZ, 0, ${inputShape[2] - 1});
                int voxelY = clamp(cellY - 1 + localY, 0, ${inputShape[1] - 1});
                int voxelX = clamp(cellX - 1 + localX, 0, ${inputShape[0] - 1});

                float elevateZ = BernsteinElevations[coeffZ][localZ];
                float elevateY = BernsteinElevations[coeffY][localY];
                float elevateX = BernsteinElevations[coeffX][localX];

                float contributeZ = BernsteinContributions[coeffZ][localZ];
                float contributeY = BernsteinContributions[coeffY][localY];
                float contributeX = BernsteinContributions[coeffX][localX];

                vec4 voxelFeatures = vec4(
                    getA(voxelX, voxelY, voxelZ, 0), // fxx
                    getA(voxelX, voxelY, voxelZ, 1), // fyy
                    getA(voxelX, voxelY, voxelZ, 2), // fzz
                    getA(voxelX, voxelY, voxelZ, 3)  // f
                );

                vec4 contributions = vec4(contributeX, contributeY, contributeZ, 1.0);
                float elevation = elevateX * elevateY * elevateZ;

                float voxelCoeff = dot(voxelFeatures, contributions) * elevation;
                bernsteinCoeff += voxelCoeff;

            }}} 

            minValue = min(minValue, bernsteinCoeff);
            maxValue = max(maxValue, bernsteinCoeff);

        }}} 

        return vec2(minValue, maxValue);
    }

    // Compute extrema over all cells in the block
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
            setOutput(blockExtrema.x);
        } 
        else 
        {
            setOutput(blockExtrema.y);
        }
    }
`

class BlockExtremaProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string

    constructor(inputShape: number[], inputStride: number, inputMethod: number) 
    {
        this.outputShape = inputShape.map((inputDim) => Math.ceil((inputDim + 1) / inputStride))
        this.outputShape[3] = 2        
        this.userCode = (inputMethod == 0) 
        ? trilinearCode(inputShape, inputStride) 
        : tricubicCode(inputShape, inputStride) 
    }
}

export function blockExtremaProgram(inputTensor: tf.Tensor, inputStride: number, inputMethod = 1) : tf.Tensor4D
{
    const program = new BlockExtremaProgram(inputTensor.shape, inputStride, inputMethod)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}