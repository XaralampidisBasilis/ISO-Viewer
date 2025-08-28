import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUPackedTricubicExtrema implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = true;
    packedOutput = true;

    constructor(inputShape: [number, number, number, number, number], inputStride: number) 
    {
        const getOutputDimensions = (inDimension) => Math.ceil((inDimension + 1) / inputStride)
        
        const [inDepth, inHeight, inWidth] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map(getOutputDimensions)
        this.outputShape = [outDepth, outHeight, outWidth, 2, 2] // Expand to 2x2 shape to get linearly packed output channels
        this.outputShape[3] = 2        
        this.userCode = `

        // Compute the extrema of the tricubic interpolation in a single cell
        vec2 getCellExtrema(int cellZ, int cellY, int cellX)
        {
            // Bernstein elevation coefficients (order 1 → order 3)
            const vec2 BernsteinElevations[4] = vec2[4](
                vec2(1.0, 0.0),
                vec2(2.0 / 3.0, 1.0 / 3.0),
                vec2(1.0 / 3.0, 2.0 / 3.0),
                vec2(0.0, 1.0)
            );

            // Bernstein correction coefficients for mixed-order derivatives
            const vec2 BernsteinCorrections[4] = vec2[4](
                vec2(0.0, 0.0),
                vec2(-1.0 / 4.0, 0.0),
                vec2(0.0, -1.0 / 4.0),
                vec2(0.0, 0.0)
            );

            float minValue = 1.0;
            float maxValue = 0.0;

            for (int coeffZ = 0; coeffZ < 4; ++coeffZ) {
            for (int coeffX = 0; coeffX < 4; ++coeffX) {
            for (int coeffY = 0; coeffY < 4; ++coeffY) {

                float bernsteinCoeff = 0.0;

                for (int localZ = 0; localZ < 2; ++localZ) {
                for (int localX = 0; localX < 2; ++localX) {
                for (int localY = 0; localY < 2; ++localY) {

                    int voxelZ = clamp(cellZ - 1 + localZ, 0, ${inDepth  - 1});
                    int voxelY = clamp(cellY - 1 + localY, 0, ${inHeight - 1});
                    int voxelX = clamp(cellX - 1 + localX, 0, ${inWidth  - 1});

                    float elevateZ = BernsteinElevations[coeffZ][localZ];
                    float elevateX = BernsteinElevations[coeffX][localX];
                    float elevateY = BernsteinElevations[coeffY][localY];

                    float correctZ = BernsteinCorrections[coeffZ][localZ];
                    float correctX = BernsteinCorrections[coeffX][localX];
                    float correctY = BernsteinCorrections[coeffY][localY];

                    vec4 voxelFeatures = getA(voxelZ, voxelY, voxelX, 0, 0); // Fxx Fyy Fzz F
            
                    vec4 corrections = vec4(correctX, correctY, correctZ, 1.0);
                    float elevation = elevateX * elevateY * elevateZ;

                    float voxelContribution = dot(voxelFeatures, corrections) * elevation;
                    bernsteinCoeff += voxelContribution;

                }}} 

                minValue = min(minValue, bernsteinCoeff);
                maxValue = max(maxValue, bernsteinCoeff);

            }}} 

            return vec2(minValue, maxValue);
        }

        // Compute extrema over all cells in the block
        vec2 getBlockExtrema(int blockZ, int blockY, int blockX)
        {
            int startZ = blockZ * ${inputStride};
            int startY = blockY * ${inputStride};
            int startX = blockX * ${inputStride};

            int endZ = startZ + ${inputStride};
            int endY = startY + ${inputStride};
            int endX = startX + ${inputStride};

            float minValue = 1.0;
            float maxValue = 0.0;

            for (int cellZ = startZ; cellZ < endZ; ++cellZ) {
            for (int cellY = startY; cellY < endY; ++cellY) {
            for (int cellX = startX; cellX < endX; ++cellX) {

                vec2 cellExtrema = getCellExtrema(cellZ, cellY, cellX);

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

            int blockZ = outputCoords.x;
            int blockY = outputCoords.y;
            int blockX = outputCoords.z;
            
            vec2 blockExtrema = getBlockExtrema(blockZ, blockY, blockX);
            setOutput(vec4(blockExtrema, 0.0, 0.0));
        }
        `
    }
}

export function getPackedTricubicExtrema(inputTensor: tf.Tensor5D, inputStride: number) : tf.Tensor5D
{
    const inputShape = inputTensor.shape
    const program = new GPGPUPackedTricubicExtrema(inputShape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor5D
}