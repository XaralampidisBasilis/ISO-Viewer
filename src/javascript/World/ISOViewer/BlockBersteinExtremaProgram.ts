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

            const mat4x2 W = mat4x2(
                1.0, 0.0,         
                2.0/3.0, 1.0/3.0, 
                1.0/3.0, 2.0/3.0, 
                0.0, 1.0          
            );

            const mat4x2 M = mat4x2(
                0.0, 0.0,     
                -1.0/6.0, 0.0,
                0.0, -1.0/6.0,
                0.0, 0.0      
            );

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

            void main() 
            {
                ivec4 coords = getOutputCoords();
                int x = coords[0] * ${inputStride} - 1;
                int y = coords[1] * ${inputStride} - 1;
                int z = coords[2] * ${inputStride} - 1;

                float minVal = 1.0;
                float maxVal = 0.0;

                for (int k = 0; k < ${inputStride}; ++k) 
                {
                    int zk = z + k;

                    for (int j = 0; j < ${inputStride}; ++j)
                    {
                        int yj = y + j;

                        for (int i = 0; i < ${inputStride}; ++i)
                        {
                            int xi = x + i;

                            vec2 minMaxVal = bersteinExtrema(xi, yj, zk);
                    
                            minVal = min(minVal, minMaxVal.x);
                            maxVal = max(maxVal, minMaxVal.y);
                        }
                    }
                }

                minVal = clamp(minVal, 0.0, 1.0);
                maxVal = clamp(maxVal, 0.0, 1.0);

                if (coords[3] == 0) 
                    setOutput(minVal);
                else 
                    setOutput(maxVal);
            }
        `
    }
}

export async function computeBlockBersteinExtrema(inputTensor: tf.Tensor, inputStride: number) 
{
    const program = new BlockBersteinExtremaProgram(inputTensor.shape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = await backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result)
}