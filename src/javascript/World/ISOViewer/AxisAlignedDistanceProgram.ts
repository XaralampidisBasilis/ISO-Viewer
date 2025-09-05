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

class AxisAlignedChessDistancePass implements GPGPUProgram 
{
    variableNames = ['Distance']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor
    (
        inputShape: [number, number, number, number], 
        inputDirection: '-x' | '+x' | '-y' | '+y' | '-z' | '+z',     
        inputDistance: number
    ) 
    {
        const [inSign, inAxis] = inputDirection
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]

        this.userCode = `
        const ivec3 maxCoords = ivec3(${inWidth-1}, ${inHeight-1}, ${inDepth-1});
        const int maxDistance = min(${inputDistance}, maxCoords.${inAxis}); 
        
        ${inSign == '-' ? `
        bool outBounds(int coord) { return coord < 0; }` : `
        bool outBounds(int coord) { return coord > maxCoords.${inAxis}; }`}
        
        int getDistance(ivec3 coords) { return int(getDistance(coords.z, coords.y, coords.x, 0)); }

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
            blockDistance = maxDistance;
            for (int stepDistance = 1; stepDistance <= maxDistance; stepDistance++) 
            {
                neighborCoords.${inAxis} = blockCoords.${inAxis} ${inSign} stepDistance;
                if (outBounds(neighborCoords.${inAxis})) 
                {
                    break;
                }

                neighborDistance = getDistance(neighborCoords);
                if (stepDistance >= neighborDistance)
                {
                    blockDistance = stepDistance;
                    break;
                }
            }

            setOutput(float(blockDistance));
        }
        `
    }
}
class AxisAlignedChessDistancesBitpack implements GPGPUProgram 
{
    variableNames = ['DistanceX', 'DistanceY', 'DistanceZ', 'Occupancy']
    outputShape: number[]
    userCode: string
    packedInputs = false
    packedOutput = false

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [inDepth, inHeight, inWidth, 1]
        this.userCode = `

        int getDistanceX(ivec3 coords) { return int(getDistanceX(coords.z, coords.y, coords.x, 0)); }
        int getDistanceY(ivec3 coords) { return int(getDistanceY(coords.z, coords.y, coords.x, 0)); }
        int getDistanceZ(ivec3 coords) { return int(getDistanceZ(coords.z, coords.y, coords.x, 0)); }
        int getOccupancy(ivec3 coords) { return int(getOccupancy(coords.z, coords.y, coords.x, 0)); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords();
            ivec3 blockCoords = outputCoords.zyx;
            ivec4 blockDistances;

            blockDistances.x = getDistanceX(blockCoords);
            blockDistances.y = getDistanceY(blockCoords);
            blockDistances.z = getDistanceZ(blockCoords);
            blockDistances.a = getOccupancy(blockCoords);

            int packedDistances = 
                clamp(blockDistances.r, 0, 31) * 2048 + 
                clamp(blockDistances.g, 0, 31) * 64 + 
                clamp(blockDistances.b, 0, 31) * 2 + 
                clamp(blockDistances.a, 0,  1) * 1;

            setOutput(float(packedDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor4D 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs)) as tf.Tensor4D
}

export function extendedIsotropicDistanceProgram(inputOccupancy: tf.Tensor4D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    // Programs
    const getChessDistanceX         = new IsotropicChessDistancePass(shape, 'occupancy', 'x', maxDistance)
    const getChessDistanceY         = new IsotropicChessDistancePass(shape, 'occupancy', 'y', maxDistance)
    const getChessDistanceYFromXorZ = new IsotropicChessDistancePass(shape, 'distance',  'y', maxDistance)
    const getChessDistanceZFromXorY = new IsotropicChessDistancePass(shape, 'distance',  'z', maxDistance)
    
    const getChessDistanceX0FromYZ = new AxisAlignedChessDistancePass(shape, '-x', maxDistance)
    const getChessDistanceX1FromYZ = new AxisAlignedChessDistancePass(shape, '+x', maxDistance)
    const getChessDistanceY0FromXZ = new AxisAlignedChessDistancePass(shape, '-y', maxDistance)
    const getChessDistanceY1FromXZ = new AxisAlignedChessDistancePass(shape, '+y', maxDistance)
    const getChessDistanceZ0FromXY = new AxisAlignedChessDistancePass(shape, '-z', maxDistance)
    const getChessDistanceZ1FromXY = new AxisAlignedChessDistancePass(shape, '+z', maxDistance)

    const getChessDistancesBitpacked = new AxisAlignedChessDistancesBitpack(shape)

    // 1D
    const chessDistanceOverX = runProgram(getChessDistanceX, [inputOccupancy])
    const chessDistanceOverY = runProgram(getChessDistanceY, [inputOccupancy])

    // 2D
    const chessDistanceOverXY = runProgram(getChessDistanceYFromXorZ, [chessDistanceOverX]);
    const chessDistanceOverXZ = runProgram(getChessDistanceZFromXorY, [chessDistanceOverX]); tf.dispose(chessDistanceOverX)
    const chessDistanceOverYZ = runProgram(getChessDistanceZFromXorY, [chessDistanceOverY]); tf.dispose(chessDistanceOverY)

    // 3D
    const chessDistanceX0OverXYZ = runProgram(getChessDistanceX0FromYZ, [chessDistanceOverYZ]);
    const chessDistanceX1OverXYZ = runProgram(getChessDistanceX1FromYZ, [chessDistanceOverYZ]); tf.dispose(chessDistanceOverYZ)
    const chessDistanceY0OverXYZ = runProgram(getChessDistanceY0FromXZ, [chessDistanceOverXZ]);
    const chessDistanceY1OverXYZ = runProgram(getChessDistanceY1FromXZ, [chessDistanceOverXZ]); tf.dispose(chessDistanceOverXZ)
    const chessDistanceZ0OverXYZ = runProgram(getChessDistanceZ0FromXY, [chessDistanceOverXY]);
    const chessDistanceZ1OverXYZ = runProgram(getChessDistanceZ1FromXY, [chessDistanceOverXY]); tf.dispose(chessDistanceOverXY)

            
    return chessDistanceZ1OverXYZ;
}
