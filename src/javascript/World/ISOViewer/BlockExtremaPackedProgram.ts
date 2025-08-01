import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


const trilinearCode = (inputShape: [number, number, number, number, number], inputStride: number) => `

    // Compute the min and max values of the trilinear interpolation inside a single cell
    vec2 computeCellExtrema(int cellX, int cellY, int cellZ)
    {
        float minValue = 1.0;
        float maxValue = 0.0;

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

        for (int cellX = startX; cellX < endX; ++cellX) {
        for (int cellY = startY; cellY < endY; ++cellY) {
        for (int cellZ = startZ; cellZ < endZ; ++cellZ) {
            
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
        setOutput(vec4(blockExtrema, 0.0, 0.0));
    }
`
const tricubicCode = (inputShape: [number, number, number, number, number], inputStride: number) => `
    
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

        for (int coeffX = 0; coeffX < 4; ++coeffX) {
        for (int coeffY = 0; coeffY < 4; ++coeffY) {
        for (int coeffZ = 0; coeffZ < 4; ++coeffZ) {

            float bernsteinCoeff = 0.0;

            for (int localX = 0; localX < 2; ++localX) {
            for (int localY = 0; localY < 2; ++localY) {
            for (int localZ = 0; localZ < 2; ++localZ) {

                int voxelX = clamp(cellX - 1 + localX, 0, ${inputShape[0] - 1});
                int voxelY = clamp(cellY - 1 + localY, 0, ${inputShape[1] - 1});
                int voxelZ = clamp(cellZ - 1 + localZ, 0, ${inputShape[2] - 1});

                float elevateX = BernsteinElevations[coeffX][localX];
                float elevateY = BernsteinElevations[coeffY][localY];
                float elevateZ = BernsteinElevations[coeffZ][localZ];

                float contributeX = BernsteinContributions[coeffX][localX];
                float contributeY = BernsteinContributions[coeffY][localY];
                float contributeZ = BernsteinContributions[coeffZ][localZ];

                vec4 voxelFeatures = getA(voxelX, voxelY, voxelZ, 0, 0); // Fxx Fyy Fzz F
         
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

        for (int cellX = startX; cellX < endX; ++cellX) {
        for (int cellY = startY; cellY < endY; ++cellY) {
        for (int cellZ = startZ; cellZ < endZ; ++cellZ) {

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
        ivec5 outputCoords = getOutputCoords();

        int blockX = outputCoords.x;
        int blockY = outputCoords.y;
        int blockZ = outputCoords.z;
        
        vec2 blockExtrema = computeBlockExtrema(blockX, blockY, blockZ);
        setOutput(vec4(blockExtrema, 0.0, 0.0));
    }
`

class BlockExtremaPackedProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor(inputShape: [number, number, number, number, number], inputStride: number, inputMethod: number) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map((inDimension) => Math.ceil((inDimension + 1) / inputStride))
        this.outputShape = [outDepth, outHeight, outWidth, 2, 2]
        this.userCode = (inputMethod == 0) ? trilinearCode(inputShape, inputStride) : tricubicCode(inputShape, inputStride) 
    }
}

export function blockExtremaPackedProgram(inputPackedTensor: tf.Tensor5D, inputStride: number, inputMethod = 1) : tf.Tensor5D
{
    const inputShape = inputPackedTensor.shape
    const program = new BlockExtremaPackedProgram(inputShape, inputStride, inputMethod)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputPackedTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor5D
}