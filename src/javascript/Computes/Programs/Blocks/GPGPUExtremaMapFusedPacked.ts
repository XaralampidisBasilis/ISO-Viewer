import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Earlier packed reference for fused bounds. Evaluates both interpolants in one pass and reloads corner features for each tricubic coefficient. */
class GPGPUExtremaMap implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number, number], 
        blockSize: number
    ) 
    {
        const ceilDiv = (x: number) => Math.ceil((x + 1) / blockSize)
        const [inDepth, inHeight, inWidth, , ] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map(ceilDiv)
        this.outputShape = [outDepth, outHeight, outWidth, 2, 2]         
        this.userCode = `
        const ivec3 voxelMinCoords = ivec3(0);
        const ivec3 voxelMaxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});

        const mat2x4 Elevations = mat2x4(
            1.0, 2.0/3.0, 1.0/3.0, 0.0,   
            0.0, 1.0/3.0, 2.0/3.0, 1.0
        );

        const mat2x4 Contributions = mat2x4(
            0.0, -0.25,  0.0,  0.0,  
            0.0,  0.0, -0.25,  0.0
        );

        vec4 getVoxelSample(ivec3 voxelCoords)
        {
            voxelCoords = clamp(voxelCoords, voxelMinCoords, voxelMaxCoords);
            return getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 0, 0);
        }

        float getBernsteinCoefficient(ivec3 coeffIndices, ivec3 cellCoords)
        {
            float bernsteinCoefficient = 0.0;

            int u = coeffIndices.x;
            int v = coeffIndices.y;
            int w = coeffIndices.z;

            for (int r = 0; r < 2; r++) {
            for (int q = 0; q < 2; q++) {
            for (int p = 0; p < 2; p++) {

                ivec3 voxelIndices = ivec3(p, q, r) - 1;
                ivec3 voxelCoords = cellCoords + voxelIndices;
                vec4 V = getVoxelSample(voxelCoords);

                float Mx = Contributions[p][u];
                float My = Contributions[q][v];
                float Mz = Contributions[r][w];
                vec4 M = vec4(Mx, My, Mz, 1.0);

                float Wx = Elevations[p][u];
                float Wy = Elevations[q][v];
                float Wz = Elevations[r][w];
                float W = Wx * Wy * Wz;

                bernsteinCoefficient += dot(V, M) * W;

            }}} 

            return bernsteinCoefficient;
        }

        vec2 getCellExtremaTricubic(ivec3 cellCoords)
        {
            vec2 cellMinMax = vec2(1.0, 0.0);
            
            for (int w = 0; w < 4; w++) {
            for (int v = 0; v < 4; v++) {
            for (int u = 0; u < 4; u++) {

                ivec3 coeffIndices = ivec3(u, v, w);
                float bernsteinCoefficient = getBernsteinCoefficient(coeffIndices, cellCoords);
                
                cellMinMax.x = min(cellMinMax.x, bernsteinCoefficient);
                cellMinMax.y = max(cellMinMax.y, bernsteinCoefficient);

            }}} 

            return cellMinMax;
        }

        vec2 getCellExtremaTrilinear(ivec3 cellCoords)
        {
            vec2 cellMinMax = vec2(1.0, 0.0);

            for (int r = 0; r < 2; ++r) {
            for (int q = 0; q < 2; ++q) {
            for (int p = 0; p < 2; ++p) {
                
                ivec3 voxelIndices = ivec3(p, q, r) - 1;
                ivec3 voxelCoords = cellCoords + voxelIndices;
                float voxelValue = getVoxelSample(voxelCoords).a;
                
                cellMinMax.x = min(cellMinMax.x, voxelValue);
                cellMinMax.y = max(cellMinMax.y, voxelValue);

            }}}
            
            return cellMinMax;
        }
        

        // Compute extrema over all cells in the block
        vec4 getBlockExtrema(ivec3 blockCoords)
        {
            vec4 blockMinMaxMinMax = vec4(1.0, 0.0, 1.0, 0.0);
            vec4 cellMinMaxMinMax;

            ivec3 cellMinCoords = blockCoords * ${blockSize};

            for (int k = 0; k < ${blockSize}; k++) {
            for (int j = 0; j < ${blockSize}; j++) {
            for (int i = 0; i < ${blockSize}; i++) {

                ivec3 cellIndices = ivec3(i, j, k);
                ivec3 cellCoords = cellMinCoords + cellIndices;

                cellMinMaxMinMax.rg = getCellExtremaTrilinear(cellCoords);
                cellMinMaxMinMax.ba = getCellExtremaTricubic(cellCoords);
        
                blockMinMaxMinMax.xz = min(blockMinMaxMinMax.xz, cellMinMaxMinMax.xz);
                blockMinMaxMinMax.yw = max(blockMinMaxMinMax.yw, cellMinMaxMinMax.yw);

            }}}

            blockMinMaxMinMax.xz -= 0.001;
            blockMinMaxMinMax.yw += 0.001;
            
            return blockMinMaxMinMax;
        }

        void main()
        {
            ivec5 outputCoords = getOutputCoords();
            ivec3 blockCoords = ivec3(outputCoords.z, outputCoords.y, outputCoords.x);

            vec4 blockMinMaxMinMax = getBlockExtrema(blockCoords);
            blockMinMaxMinMax = clamp(blockMinMaxMinMax, 0.0, 1.0);
            
            setOutput(blockMinMaxMinMax);
        }
        `
    }
}

/**
 * Active fused bounds kernel for both interpolation modes and all feature layouts.
 *
 * Caches the eight corners per cell and reuses the intermediate Bernstein transforms. Trilinear bounds use corner intensities and tricubic bounds use the extrema of the 64 Bernstein coefficients.
 */
class GPGPUExtremaMap2 implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs: boolean
    packedOutput: boolean

    constructor
    (
        inputShape: number[],
        blockSize: number,
        packed: boolean,
        split: boolean
    ) 
    {
        this.packedInputs = inputShape.length === 5
        this.packedOutput = packed
        if (split) this.variableNames = ['X', 'Y', 'Z', 'F']
        // N voxel centers define N + 1 cell indices with replicated edge samples.
        const ceilDiv = (x: number) => Math.ceil((x + 1) / blockSize)
        const [inDepth, inHeight, inWidth] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map(ceilDiv)
        this.outputShape = packed ? [outDepth, outHeight, outWidth, 2, 2] : [outDepth, outHeight, outWidth, 4]
        this.userCode = `
        const ivec3 voxelMinCoords = ivec3(0);
        const ivec3 voxelMaxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});

        // Corner order is x + 2*y + 4*z. Each entry is [Δxx F, Δyy F, Δzz F, F].
        vec4 cellSamples[8];
  
        vec4 getVoxelSample(ivec3 voxelCoords)
        {
            voxelCoords = clamp(voxelCoords, voxelMinCoords, voxelMaxCoords);
            ${this.packedInputs ? 'return getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 0, 0);' : split ? `
            return vec4(
                getX(voxelCoords.z, voxelCoords.y, voxelCoords.x),
                getY(voxelCoords.z, voxelCoords.y, voxelCoords.x),
                getZ(voxelCoords.z, voxelCoords.y, voxelCoords.x),
                getF(voxelCoords.z, voxelCoords.y, voxelCoords.x)
            );` : `
            return vec4(
                getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 0),
                getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 1),
                getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 2),
                getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 3)
            );`}
        }
        
        void loadCellSamples(ivec3 cellCoords)
        {
            for (int r = 0; r < 2; r++) {
            for (int q = 0; q < 2; q++) {
            for (int p = 0; p < 2; p++) {

                int voxelIndex = p + q * 2 + r * 4;
                ivec3 voxelIndices = ivec3(p-1, q-1, r-1);
                ivec3 voxelCoords = cellCoords + voxelIndices;
                cellSamples[voxelIndex] = getVoxelSample(voxelCoords);

            }}} 
        }
   
        // Convert one axis at a time. Alpha accumulates its correction while the
        // remaining derivative channels are still linear along the processed axes.
        vec4 elevate(vec4 a, vec4 b, int index, int axis)
        {
            if (index == 0) return a;
            if (index == 3) return b;
            vec4 coefficient = mix(a, b, float(index) / 3.0);
            coefficient.a -= (index == 1 ? a[axis] : b[axis]) / 6.0;
            return coefficient;
        }

        vec2 getCellExtremaTricubic()
        {
            vec2 cellMinMax = vec2(1.0, 0.0);
            
            for (int u = 0; u < 4; u++)
            {
                vec4 x00 = elevate(cellSamples[0], cellSamples[1], u, 0);
                vec4 x10 = elevate(cellSamples[2], cellSamples[3], u, 0);
                vec4 x01 = elevate(cellSamples[4], cellSamples[5], u, 0);
                vec4 x11 = elevate(cellSamples[6], cellSamples[7], u, 0);

                for (int v = 0; v < 4; v++)
                {
                    vec4 a = elevate(x00, x10, v, 1);
                    vec4 b = elevate(x01, x11, v, 1);
                    // Finish the Z transform. The endpoints are the alpha values of a and b.
                    float c1 = mix(a.a, b.a, 1.0/3.0) - a.b / 6.0;
                    float c2 = mix(a.a, b.a, 2.0/3.0) - b.b / 6.0;
                    cellMinMax.x = min(cellMinMax.x, min(min(a.a, b.a), min(c1, c2)));
                    cellMinMax.y = max(cellMinMax.y, max(max(a.a, b.a), max(c1, c2)));
                }
            }

            return cellMinMax;
        }

        vec2 getCellExtremaTrilinear()
        {
            vec2 cellMinMax = vec2(1.0, 0.0);

            for (int r = 0; r < 2; ++r) {
            for (int q = 0; q < 2; ++q) {
            for (int p = 0; p < 2; ++p) {
                
                int voxelIndex = p + q * 2 + r * 4;
                float voxelValue = cellSamples[voxelIndex].a;
                
                cellMinMax.x = min(cellMinMax.x, voxelValue);
                cellMinMax.y = max(cellMinMax.y, voxelValue);

            }}}
            
            return cellMinMax;
        }

        // Compute extrema over all cells in the block
        vec4 getBlockExtrema(ivec3 blockCoords)
        {
            vec4 blockMinMaxMinMax = vec4(1.0, 0.0, 1.0, 0.0);
            vec4 cellMinMaxMinMax;

            ivec3 cellMinCoords = blockCoords * ${blockSize};

            for (int k = 0; k < ${blockSize}; k++) {
            for (int j = 0; j < ${blockSize}; j++) {
            for (int i = 0; i < ${blockSize}; i++) {

                ivec3 cellIndices = ivec3(i, j, k);
                ivec3 cellCoords = cellMinCoords + cellIndices;
                loadCellSamples(cellCoords);

                cellMinMaxMinMax.rg = getCellExtremaTrilinear();
                cellMinMaxMinMax.ba = getCellExtremaTricubic();
        
                blockMinMaxMinMax.xz = min(blockMinMaxMinMax.xz, cellMinMaxMinMax.xz);
                blockMinMaxMinMax.yw = max(blockMinMaxMinMax.yw, cellMinMaxMinMax.yw);

            }}}

            // Apply the fixed numerical margin before clipping the range to the supported isovalue domain.
            blockMinMaxMinMax.xz -= 0.001;
            blockMinMaxMinMax.yw += 0.001;

            return blockMinMaxMinMax;
        }

        void main()
        {
            ${packed ? 'ivec5' : 'ivec4'} outputCoords = getOutputCoords();
            ivec3 blockCoords = ivec3(outputCoords.z, outputCoords.y, outputCoords.x);

            vec4 blockMinMaxMinMax = getBlockExtrema(blockCoords);
            blockMinMaxMinMax = clamp(blockMinMaxMinMax, 0.0, 1.0);
            
            setOutput(${packed ? 'blockMinMaxMinMax' : 'blockMinMaxMinMax[outputCoords.w]'});
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

/**
 * Compute both interpolants’ conservative intensity ranges for later rethresholding.
 *
 * @param interpolationMap - Packed [z,y,x,2,2], scalar [z,y,x,4], or four [z,y,x] channel tensors in feature order.
 * @param blockSize - Cells per axis in each block.
 * @param packed - Write four bounds per texel. The input shape independently determines how voxel features are read.
 * @returns New bounds with channels [trilinear min, trilinear max, tricubic min, tricubic max]. The trailing shape is [2,2] in packed mode and [4] in scalar mode.
 */
export function computeExtremaMap(interpolationMap: tf.Tensor4D | tf.Tensor5D | tf.Tensor[], blockSize: number, packed = true): tf.Tensor
{
    const split = Array.isArray(interpolationMap)
    const inputs = split ? interpolationMap : [interpolationMap]
    const program = new GPGPUExtremaMap2(inputs[0].shape, blockSize, packed, split)
    return runProgram(program, inputs)
}

