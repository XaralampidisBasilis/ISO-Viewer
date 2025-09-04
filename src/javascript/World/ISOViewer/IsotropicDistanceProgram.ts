import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class IsotropicDistancePass implements GPGPUProgram 
{
    variableNames = ['Input']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputVariable: 'occupancy' | 'distance',
        inputAxis: 'x' | 'y' | 'z',     
        inputDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inputAxis}); 

        ${inputVariable == 'occupancy' ? `
        int getDistance(ivec3 coords) { return bool(getInput(coords.z, coords.y, coords.x, 0)) ? 0 : ${inputDistance}; }` : `
        int getDistance(ivec3 coords) { return  int(getInput(coords.z, coords.y, coords.x, 0)); }` }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;

            int blockDistance = getDistance(blockCoords);
            if (blockDistance == 0) 
            {
                setOutput(float(blockDistance));
                return;
            }

            ivec3 neighborCoords = blockCoords;
            int neighborDistance;

            for (int distance = 1; distance <= maxDistance; distance++) 
            {
                neighborCoords.${inputAxis} = blockCoords.${inputAxis} - distance;
                if (neighborCoords.${inputAxis} >= 0) 
                {
                    neighborDistance = max(getDistance(neighborCoords), distance);
                    blockDistance = min(blockDistance, neighborDistance);
                    if (distance >= blockDistance) break;
                }

                neighborCoords.${inputAxis} = blockCoords.${inputAxis} + distance;
                if (neighborCoords.${inputAxis} <= maxCoords.${inputAxis}) 
                {
                    neighborDistance = max(getDistance(neighborCoords), distance);
                    blockDistance = min(blockDistance, neighborDistance);
                    if (distance >= blockDistance) break;
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}

function runGpgpuProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor4D
}

export function isotropicDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const passX = new IsotropicDistancePass(shape, 'occupancy', 'x', maxDistance)
    const passY = new IsotropicDistancePass(shape, 'distance',  'y', maxDistance)
    const passZ = new IsotropicDistancePass(shape, 'distance',  'z', maxDistance)
 
    const tensorX = runGpgpuProgram(passX, [inputOccupancy]);
    const tensorY = runGpgpuProgram(passY, [tensorX]); tf.dispose(tensorX)
    const tensorZ = runGpgpuProgram(passZ, [tensorY]); tf.dispose(tensorY)

    return tensorZ
    
}