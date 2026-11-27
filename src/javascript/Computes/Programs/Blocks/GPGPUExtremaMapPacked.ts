import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

/** Compute one interpolant’s block range in RG, reserving BA. The tricubic path evaluates each Bernstein coefficient directly from the corners. */
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
        interpolationMethod: 'trilinear' | 'tricubic',
        blockSize: number
    ) 
    {
        const ceilDiv = (x: number) => Math.ceil((x + 1) / blockSize)
        const [inDepth, inHeight, inWidth, , ] = inputShape
        const [outDepth, outHeight, outWidth] = [inDepth, inHeight, inWidth].map(ceilDiv)
        this.outputShape = [outDepth, outHeight, outWidth, 2, 2]     

        const getCellExtremaTrilinear = `
        vec2 getCellExtrema(ivec3 cellCoords)
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
        `
        const getCellExtremaTricubic = `
        const mat2x4 Elevations = mat2x4(
            1.0, 2.0/3.0, 1.0/3.0, 0.0,   
            0.0, 1.0/3.0, 2.0/3.0, 1.0
        );

        const mat2x4 Contributions = mat2x4(
            0.0, -0.25,  0.0,  0.0,  
            0.0,  0.0, -0.25,  0.0
        );

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

        vec2 getCellExtrema(ivec3 cellCoords)
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
        `
        this.userCode = `

        const ivec3 voxelMinCoords = ivec3(0);
        const ivec3 voxelMaxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});

        vec4 getVoxelSample(ivec3 voxelCoords)
        {
            voxelCoords = clamp(voxelCoords, voxelMinCoords, voxelMaxCoords);
            return getA(voxelCoords.z, voxelCoords.y, voxelCoords.x, 0, 0);
        }

        ${interpolationMethod === 'trilinear' 
        ? getCellExtremaTrilinear 
        : getCellExtremaTricubic}

        // Compute extrema over all cells in the block
        vec2 getBlockExtrema(ivec3 blockCoords)
        {
            vec2 blockMinMax = vec2(1.0, 0.0);
            ivec3 cellMinCoords = blockCoords * ${blockSize};

            for (int k = 0; k < ${blockSize}; k++) {
            for (int j = 0; j < ${blockSize}; j++) {
            for (int i = 0; i < ${blockSize}; i++) {

                ivec3 cellIndices = ivec3(i, j, k);
                ivec3 cellCoords = cellMinCoords + cellIndices;
                vec2 cellMinMax = getCellExtrema(cellCoords);

                blockMinMax.x = min(blockMinMax.x, cellMinMax.x);
                blockMinMax.y = max(blockMinMax.y, cellMinMax.y);

            }}}

            blockMinMax.x -= 0.001;
            blockMinMax.y += 0.001;

            return blockMinMax;
        }

        void main()
        {
            ivec5 outputCoords = getOutputCoords();
            ivec3 blockCoords = ivec3(outputCoords.z, outputCoords.y, outputCoords.x);

            vec2 blockMinMax = getBlockExtrema(blockCoords);
            blockMinMax = clamp(blockMinMax, 0.0, 1.0);
            
            setOutput(vec4(blockMinMax, 0.0, 0.0));
        }
        `
    }
}


/** Read the packed RG interval into two scalar half-float words per block. */
class GPGPUToHalfFloat implements GPGPUProgram 
{
    variableNames = ['ExtremaMap']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = false

    constructor(inputShape: [number, number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth, , ] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 2]
        this.userCode = `   
        // Returns the IEEE-754 half-float bit pattern (lower 16 bits of the uint).
        float toHalfFloat(float x) 
        {
            uint packed = packHalf2x16(vec2(x, 0.0));
            return float(packed & 0xFFFFu); 
        }

        vec4 clampToHalfRange(vec4 values) 
        {
            return clamp(values, -65504.0, 65504.0);
        }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            vec4 blockMinMax = getExtremaMap(blockCoords.z, blockCoords.y, blockCoords.x, 0, 0);
            blockMinMax = clampToHalfRange(blockMinMax);

            setOutput(outputCoords.w == 0 
                ? toHalfFloat(blockMinMax.r) 
                : toHalfFloat(blockMinMax.g)
            );
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
 * Build bounds for a single interpolant with the legacy packed layout.
 *
 * @param interpolationMap - [z,y,x,2,2] feature tensor in second-difference XYZ and intensity order.
 * @param interpolationMethod - Select the bound calculation.
 * @param blockSize - Cells per axis of an occupancy block.
 * @returns Logical [blockZ,blockY,blockX,2,2], with [min,max,0,0] in RGBA.
 */
export function computeExtremaMap(interpolationMap: tf.Tensor5D, interpolationMethod: 'trilinear' | 'tricubic', blockSize: number) : tf.Tensor
{
    const program = new GPGPUExtremaMap(interpolationMap.shape, interpolationMethod, blockSize)
    return runProgram(program, [interpolationMap]) as tf.Tensor4D
}

/**
 * Extract the RG interval into numeric binary16 words for readback.
 *
 * @param extremaMap - Packed block bounds with the active range in RG.
 * @returns [blockZ,blockY,blockX,2] with minimum and maximum words.
 * @throws If float32 render targets cannot preserve the integer words.
 */
export function toHalfFloat(extremaMap: tf.Tensor5D): tf.Tensor 
{
  if (!tf.env().getBool('WEBGL_RENDER_FLOAT32_ENABLED'))
    throw new Error('Half-float bit encoding requires float32 render textures.')

  const program = new GPGPUToHalfFloat(extremaMap.shape)
  return runProgram(program, [extremaMap]) as tf.Tensor4D
}
