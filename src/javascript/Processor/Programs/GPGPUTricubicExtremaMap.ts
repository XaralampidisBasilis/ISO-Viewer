import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

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

export function computeTricubicExtremaMap(inputTensor: tf.Tensor, inputStride: number) : tf.Tensor4D
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const program = new GPGPUTricubicExtremaMap(inputShape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}