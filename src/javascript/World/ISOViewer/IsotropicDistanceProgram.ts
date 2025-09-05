import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'

class IsotropicChessDistancePass implements GPGPUProgram 
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
            ivec3 neighborCoords = blockCoords;

            int blockDistance = getDistance(blockCoords);
            if (blockDistance == 0) 
            {
                setOutput(0.0);
                return;
            }

            int neighborDistance;
            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                neighborCoords.${inputAxis} = blockCoords.${inputAxis} - stepDistance;
                if (neighborCoords.${inputAxis} >= 0) 
                {
                    neighborDistance = max(getDistance(neighborCoords), stepDistance);
                    blockDistance = min(blockDistance, neighborDistance);

                    if (stepDistance >= blockDistance) 
                    {
                        break;
                    }
                }

                neighborCoords.${inputAxis} = blockCoords.${inputAxis} + stepDistance;
                if (neighborCoords.${inputAxis} <= maxCoords.${inputAxis}) 
                {
                    neighborDistance = max(getDistance(neighborCoords), stepDistance);
                    blockDistance = min(blockDistance, neighborDistance);
                    
                    if (stepDistance >= blockDistance) 
                    {
                        break;
                    }
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    const info = backend.compileAndRun(prog, inputs)
    return tf.engine().makeTensorFromTensorInfo(info) as tf.Tensor4D
}

export function isotropicChessDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    const getChessDistanceAlongX = new IsotropicChessDistancePass(shape, 'occupancy', 'x', maxDistance)
    const getChessDistanceAlongYFromX = new IsotropicChessDistancePass(shape, 'distance',  'y', maxDistance)
    const getChessDistanceAlongZFromXY = new IsotropicChessDistancePass(shape, 'distance',  'z', maxDistance)
 
    const chessDistanceOverX = runProgram(getChessDistanceAlongX, [inputOccupancy]);
    const chessDistanceOverXY = runProgram(getChessDistanceAlongYFromX, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    const chessDistanceOverXYZ = runProgram(getChessDistanceAlongZFromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

    return chessDistanceOverXYZ
    
}