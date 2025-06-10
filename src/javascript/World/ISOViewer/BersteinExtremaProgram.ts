import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class BersteinExtremaProgram implements GPGPUProgram 
{
    variableNames = ['A']
    outputShape: number[]
    userCode: string
    packedInputs?: boolean | undefined;
    packedOutput?: boolean | undefined;

    constructor(inputShape: number[]) 
    {
        const [Z, Y, X, C] = inputShape
        this.outputShape = [Z - 1, Y - 1, X - 1, 2]
        this.packedInputs = false
        this.packedOutput = false
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

            void main() 
            {
                ivec4 coords = getOutputCoords();
                int x = coords[0];
                int y = coords[1];
                int z = coords[2];

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

export async function computeBersteinExtrema(inputTensor: tf.Tensor) 
{
    const program = new BersteinExtremaProgram(inputTensor.shape)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result)
}