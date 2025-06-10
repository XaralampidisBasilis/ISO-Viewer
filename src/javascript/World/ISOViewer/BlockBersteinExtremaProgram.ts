import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class BlockBersteinExtremaProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs?: boolean | undefined;
    packedOutput?: boolean | undefined;

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
                -1.0/6.0, 0.0,
                0.0, -1.0/6.0,
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

                    for (int kk = 0; kk < 2; ++kk) 
                    {
                        float wk = W[k][kk];
                        float mk = M[k][kk];
                        int zk = z + kk;

                        for (int jj = 0; jj < 2; ++jj)
                        {
                            float wj = W[j][jj];
                            float mj = M[j][jj];
                            int yj = y + jj;

                            for (int ii = 0; ii < 2; ++ii)
                            {
                                float wi = W[i][ii];
                                float mi = M[i][ii];
                                int xi = x + ii;
                                
                                vec4 f = vec4(
                                    getA(xi, yj, zk, 0),
                                    getA(xi, yj, zk, 1),
                                    getA(xi, yj, zk, 2),
                                    getA(xi, yj, zk, 3)
                                );

                                vec4 w = vec4(
                                    mi * wj * wk,
                                    wi * mj * wk,
                                    wi * wj * mk,
                                    wi * wj * wk
                                );
                        
                                b += w * f;
                            }
                        }
                    }

                    float val = dot(b, vec4(1.0));

                    minVal = min(minVal, val);
                    maxVal = max(maxVal, val);
                }
                    
                return vec2(minVal, maxVal);
            }

            // given the block indices compute the berstein extrema of every cell
            // inside the block and take their total min and max

            vec2 blockExtrema(int X, int Y, int Z)
            {
                // compute the min voxel indices from block indices
                int xm = clamp(X * ${inputStride} - 1, 0, ${inputShape[0] - 1});
                int ym = clamp(Y * ${inputStride} - 1, 0, ${inputShape[1] - 1});
                int zm = clamp(Z * ${inputStride} - 1, 0, ${inputShape[2] - 1});

                // compute the excluded max voxel indices
                int xM = clamp(xm + ${inputStride}, 0, ${inputShape[0] - 1});
                int yM = clamp(ym + ${inputStride}, 0, ${inputShape[1] - 1});
                int zM = clamp(zm + ${inputStride}, 0, ${inputShape[2] - 1});

                float minTotal = 1.0;
                float maxTotal = 0.0;

                for (int z = zm; z < zM; ++z) 
                for (int y = ym; y < yM; ++y)
                for (int x = xm; x < xM; ++x)
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
                int X = coords[0];
                int Y = coords[1];
                int Z = coords[2];

                // compute block berstein extrema
                vec2 minMaxTotal = blockExtrema(X, Y, Z);

                if (coords[3] == 0) 
                    setOutput(minMaxTotal.x);
                else 
                    setOutput(minMaxTotal.y);
            }
        `
    }
}

export async function computeBlockBersteinExtrema(inputTensor: tf.Tensor, inputStride: number) 
{
    const program = new BlockBersteinExtremaProgram(inputTensor.shape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result)
}