import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

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

export function computeTrilinearExtremaMap(inputTensor: tf.Tensor, inputStride: number) : tf.Tensor4D
{
    const inputShape = inputTensor.shape as [number, number, number, number]
    const program = new GPGPUTrilinearExtremaMap(inputShape, inputStride)
    const backend = tf.backend() as MathBackendWebGL
    const result = backend.compileAndRun(program, [inputTensor])
    return tf.engine().makeTensorFromTensorInfo(result) as tf.Tensor4D
}