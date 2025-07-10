import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class GPGPUTrilinearResize implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;

    constructor(
        inputShape: [number, number, number, number], // [depth, height, width, channels]
        newDepth: number,
        newHeight: number,
        newWidth: number,
        alignCorners: boolean,
        halfPixelCenters: boolean
    ) {
        const [inDepth, inHeight, inWidth, channels] = inputShape;
        this.outputShape = [newDepth, newHeight, newWidth, channels];

        const effectiveInSize = [
            alignCorners && newDepth  > 1 ? inDepth  - 1 : inDepth,
            alignCorners && newHeight > 1 ? inHeight - 1 : inHeight,
            alignCorners && newWidth  > 1 ? inWidth  - 1 : inWidth
        ];
        const effectiveOutSize = [
            alignCorners && newDepth  > 1 ? newDepth  - 1 : newDepth,
            alignCorners && newHeight > 1 ? newHeight - 1 : newHeight,
            alignCorners && newWidth  > 1 ? newWidth  - 1 : newWidth
        ];

        const scaleFactors = effectiveInSize.map((inSize, i) => inSize / effectiveOutSize[i]);

        const sourceFracIndex = halfPixelCenters
        ? `(vec3(dhw) + vec3(0.5)) * scaleFactors - vec3(0.5)`
        : `vec3(dhw) * scaleFactors`;

        this.userCode = `
        const vec3 scaleFactors = vec3(${scaleFactors[0]}, ${scaleFactors[1]}, ${scaleFactors[2]});
        const vec3 inputShape = vec3(${inDepth}.0, ${inHeight}.0, ${inWidth}.0);

        void main() 
        {
            ivec4 coords = getOutputCoords();
            int d = coords[0];
            int h = coords[1];
            int w = coords[2];
            int c = coords[3];

            ivec3 dhw = ivec3(d, h, w);
            vec3 sourceFracIndex = ${sourceFracIndex};

            vec3 floorIndex = clamp(floor(sourceFracIndex), vec3(0.0), inputShape - 1.0);
            vec3 ceilIndex  = clamp(ceil(sourceFracIndex),  vec3(0.0), inputShape - 1.0);
            vec3 frac = sourceFracIndex - floorIndex;

            float c000 = getA(int(floorIndex.x), int(floorIndex.y), int(floorIndex.z), c);
            float c001 = getA(int(floorIndex.x), int(floorIndex.y), int(ceilIndex.z),  c);
            float c010 = getA(int(floorIndex.x), int(ceilIndex.y),  int(floorIndex.z), c);
            float c011 = getA(int(floorIndex.x), int(ceilIndex.y),  int(ceilIndex.z),  c);
            float c100 = getA(int(ceilIndex.x),  int(floorIndex.y), int(floorIndex.z), c);
            float c101 = getA(int(ceilIndex.x),  int(floorIndex.y), int(ceilIndex.z),  c);
            float c110 = getA(int(ceilIndex.x),  int(ceilIndex.y),  int(floorIndex.z), c);
            float c111 = getA(int(ceilIndex.x),  int(ceilIndex.y),  int(ceilIndex.z),  c);

            float c00 = mix(c000, c001, frac.z);
            float c01 = mix(c010, c011, frac.z);
            float c10 = mix(c100, c101, frac.z);
            float c11 = mix(c110, c111, frac.z);

            float c0 = mix(c00, c01, frac.y);
            float c1 = mix(c10, c11, frac.y);

            float value = mix(c0, c1, frac.x);

            setOutput(value);
        }
        `;
    }
}

class GPGPUTricubicVolumeMap implements GPGPUProgram 
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

class GPGPUTrilinearExtremaMap implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string

    constructor(inputShape: number[], inputStride: number) 
    {
        this.outputShape = inputShape.map((inputDim) => Math.ceil((inputDim + 1) / inputStride))
        this.outputShape[3] = 2        
        this.userCode = `
        // Compute voxel-wise min/max values for trilinear approximation within the block
        vec2 blockExtrema(int xx, int yy, int zz)
        {
            // compute min voxel indices of block
            int xMin = max(xx * ${inputStride} - 1, 0);
            int yMin = max(yy * ${inputStride} - 1, 0);
            int zMin = max(zz * ${inputStride} - 1, 0);
            
            // compute max voxel indices of block
            int xMax = min(xMin + ${inputStride}, ${inputShape[0] - 1});
            int yMax = min(yMin + ${inputStride}, ${inputShape[1] - 1});
            int zMax = min(zMin + ${inputStride}, ${inputShape[2] - 1});

            // initialize total block min/max value
            float minVal = 1.0;
            float maxVal = 0.0;

            for (int z = zMin; z <= zMax; ++z) 
            for (int y = yMin; y <= yMax; ++y)
            for (int x = xMin; x <= xMax; ++x)
            {
                float val = getA(x, y, z, 3);
                minVal = min(minVal, val);
                maxVal = max(maxVal, val);
            }

            minVal = clamp(minVal, 0.0, 1.0);
            maxVal = clamp(maxVal, 0.0, 1.0);

            return vec2(minVal, maxVal);
        }

        void main() 
        {
            ivec4 coords = getOutputCoords();

            // get block indices
            int xx = coords[0];
            int yy = coords[1];
            int zz = coords[2];

            // compute block berstein extrema
            vec2 minMaxVal = blockExtrema(xx, yy, zz);

            if (coords[3] == 0) 
                setOutput(minMaxVal.x);
            else 
                setOutput(minMaxVal.y);
        }
        `
    }
}

class GPGPUTricubicExtremaMap implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string

    constructor(inputShape: number[], inputStride: number) 
    {
        this.outputShape = inputShape.map((inputDim) => Math.ceil((inputDim + 1) / inputStride))
        this.outputShape[3] = 2        
        this.userCode = `
        // Elevation matrix from berstein order 1 to order 3 in 1d
        const mat4x2 W = mat4x2(
            1.0, 0.0,         
            2.0/3.0, 1.0/3.0, 
            1.0/3.0, 2.0/3.0, 
            0.0, 1.0          
        );

        // Multiplication matrix for mixed order berstein
        const mat4x2 M = mat4x2(
            0.0, 0.0,     
            -1.0/4.0, 0.0,
            0.0, -1.0/4.0,
            0.0, 0.0      
        );

        // given voxel indices compute the berstein extrema of the 
        // tricubic interpolation function inside the cell [x, x+1][y, y+1][z, z+1]
        // The specific tricubic interpolation function is defined in the paper 
        // "Beyond Trilinear Interpolation: Higher Quality for Free"

        vec2 bersteinExtrema(int x, int y, int z)
        {
            float minVal = 1.0;
            float maxVal = 0.0;

            for (int k = 0; k < 4; ++k) 
            for (int j = 0; j < 4; ++j)
            for (int i = 0; i < 4; ++i)
            {
                vec4 b = vec4(0.0);

                for (int kk = 0; kk < 2; ++kk) {
                    float Wk = W[k][kk];
                    float Mk = M[k][kk];
                    int zk = z + kk;

                for (int jj = 0; jj < 2; ++jj) {
                    float Wjk = W[j][jj] * Wk;
                    float Mj = M[j][jj];
                    int yj = y + jj;

                for (int ii = 0; ii < 2; ++ii) {
                    float Wijk = W[i][ii] * Wjk;
                    float Mi = M[i][ii];
                    int xi = x + ii;
                            
                    vec4 f = vec4(
                        getA(xi, yj, zk, 0),
                        getA(xi, yj, zk, 1),
                        getA(xi, yj, zk, 2),
                        getA(xi, yj, zk, 3)
                    );

                    vec4 w = vec4(Mi, Mj, Mk, 1.0) *  Wijk;
                    b += w * f;
                }}}
            
                float val = dot(b, vec4(1.0));

                minVal = min(minVal, val);
                maxVal = max(maxVal, val);
            }
                
            return vec2(minVal, maxVal);
        }

        // given the block indices compute the berstein extrema of every cell
        // inside the block and take their total min and max

        vec2 blockExtrema(int xx, int yy, int zz)
        {
            // compute min voxel indices of block
            int xMin = max(xx * ${inputStride} - 1, 0);
            int yMin = max(yy * ${inputStride} - 1, 0);
            int zMin = max(zz * ${inputStride} - 1, 0);
            
            // compute max voxel indices of block
            int xMax = min(xMin + ${inputStride}, ${inputShape[0]});
            int yMax = min(yMin + ${inputStride}, ${inputShape[1]});
            int zMax = min(zMin + ${inputStride}, ${inputShape[2]});

            // initialize total block min/max value
            float minTotal = 1.0;
            float maxTotal = 0.0;

            for (int z = zMin; z < zMax; ++z) 
            for (int y = yMin; y < yMax; ++y)
            for (int x = xMin; x < xMax; ++x)
            {
                vec2 minMaxVal = bersteinExtrema(x, y, z);
        
                minTotal = min(minTotal, minMaxVal.x);
                maxTotal = max(maxTotal, minMaxVal.y);
            }

            minTotal = clamp(minTotal, 0.0, 1.0);
            maxTotal = clamp(maxTotal, 0.0, 1.0);

            return vec2(minTotal, maxTotal);
        }

        void main() 
        {
            ivec4 coords = getOutputCoords();

            // get block indices
            int xx = coords[0];
            int yy = coords[1];
            int zz = coords[2];

            // compute block berstein extrema
            vec2 minMaxTotal = blockExtrema(xx, yy, zz);

            if (coords[3] == 0) 
                setOutput(minMaxTotal.x);
            else 
                setOutput(minMaxTotal.y);
        }
        `
    }
}

class GPGPUOccupancyMap implements GPGPUProgram 
{
    variableNames = ['A'];
    outputShape: number[];
    userCode: string;

    constructor(inputShape: [number, number, number, number], inputThreshold: number) 
    {
        const [inDepth, inHeight, inWidth, channels] = inputShape;
        this.outputShape = [inDepth, inHeight, inWidth, 1];

        this.userCode = `
        void main() 
        {
            ivec4 coords = getOutputCoords();
            int z = coords[0];
            int y = coords[1];
            int x = coords[2];
            int c = coords[3];

            float minVal = getA(z, y, x, 0);
            float maxVal = getA(z, y, x, 1);
            float occupied = (minVal <= ${inputThreshold} && ${inputThreshold} <= maxVal) ? 255.0 : 0.0;

            setOutput(occupied);
        }
        `;
    }
}

function computeTrilinearResize(inputTensor: tf.Tensor4D, newDepth: number, newHeight: number, newWidth: number, alignCorners = false, halfPixelCenters = false): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL;
  const program = new GPGPUTrilinearResize(
    inputTensor.shape as [number, number, number, number],
    newDepth,
    newHeight,
    newWidth,
    alignCorners,
    halfPixelCenters
  );

  const output = backend.compileAndRun(program, [inputTensor]);
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}

function computeTricubicVolumeMap(input: tf.Tensor4D): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL;
  const program = new GPGPUTricubicVolumeMap(input.shape as [number, number, number, number]);
  const output = backend.compileAndRun(program, [input]);
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}

function computeTrilinearExtremaMap(inputVolume: tf.Tensor, inputStride: number) : tf.Tensor4D
{
    const program = new GPGPUTrilinearExtremaMap(inputVolume.shape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputVolume])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}

function computeTricubicExtremaMap(inputVolume: tf.Tensor, inputStride: number) : tf.Tensor4D
{
    const program = new GPGPUTricubicExtremaMap(inputVolume.shape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputVolume])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}

function computeOccupancyMap(inputExtremaMap: tf.Tensor4D, inputThreshold: number): tf.Tensor4D 
{
  const backend = tf.backend() as MathBackendWebGL;
  const program = new GPGPUOccupancyMap(inputExtremaMap.shape as [number, number, number, number], inputThreshold);
  const output = backend.compileAndRun(program, [inputExtremaMap]);
  return tf.engine().makeTensorFromTensorInfo(output) as tf.Tensor4D;
}

export { 
    computeTrilinearResize, 
    computeTricubicVolumeMap,
    computeTrilinearExtremaMap, 
    computeTricubicExtremaMap, 
    computeOccupancyMap,
}