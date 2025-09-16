import * as tf from '@tensorflow/tfjs'
import { GPGPUProgram } from '@tensorflow/tfjs-backend-webgl'
import { MathBackendWebGL } from '@tensorflow/tfjs-backend-webgl'


class FirstExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};
        
        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideWidth(int xCoord) { return xCoord >= 0 && xCoord <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 xDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;
            
            int sign = (outputCoords.w == 0) ? -1 : 1;
            if (sign < 0)
            {
                xDistances.rb = vec2(0 - sign);
                xDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, xDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                xDistances.rb = vec2(0);
                xDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, xDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }
            
            for (int xDistance = 2; xDistance <= maxSteps; xDistance += 2) 
            {
                inputCoords.x = outputCoords.x + xDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {                    
                    inputDistances = getInputDistances(inputCoords);

                    xDistances.rb = vec2(xDistance - sign);
                    xDistances.ga = vec2(xDistance);

                    neighborDistances = max(inputDistances, xDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga); 

                    xDistances.rb = vec2(xDistance);
                    xDistances.ga = vec2(xDistance + sign);

                    neighborDistances = max(inputDistances, xDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(xDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FirstExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inDepth, inHeight, inWidth] = inputShape; 
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};
        
        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideHeight(int yCoord) { return yCoord >= 0 && yCoord <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 yDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;
            if (sign < 0)
            {
                yDistances.rg = vec2(0 - sign);
                yDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, yDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                yDistances.rg = vec2(0);
                yDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, yDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int yDistance = 2; yDistance <= maxSteps; yDistance += 2) 
            {
                inputCoords.y = outputCoords.y + yDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    yDistances.rg = vec2(yDistance - sign);
                    yDistances.ba = vec2(yDistance);

                    neighborDistances = max(inputDistances, yDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    yDistances.rg = vec2(yDistance);
                    yDistances.ba = vec2(yDistance + sign);

                    neighborDistances = max(inputDistances, yDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(yDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FirstExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputOccupancies']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inDepth, inHeight, inWidth] = inputShape
        this.outputShape = [2, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputOccupancies(ivec3 coords) { return getInputOccupancies(coords.z, coords.y, coords.x); }

        vec4 getInputDistances(ivec3 coords) { return step(getInputOccupancies(coords), vec4(0.5)) * vec4(${maxDistance}); }

        bool insideDepth(int zCoord) { return zCoord >= 0 && zCoord <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;

            for (int zDistance = 0; zDistance <= maxSteps; zDistance++) 
            {
                inputCoords.z = outputCoords.z + zDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);

                    candidateDistances = max(inputDistances, vec4(zDistance));
                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(zDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};
        
        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideWidth(int xCoord) { return xCoord >= 0 && xCoord <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 xDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                xDistances.rb = vec2(0 - sign);
                xDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, xDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                xDistances.rb = vec2(0);
                xDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, xDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int xDistance = 2; xDistance <= maxSteps; xDistance += 2) 
            {
                inputCoords.x = outputCoords.x + xDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    xDistances.rb = vec2(xDistance - sign);
                    xDistances.ga = vec2(xDistance);

                    neighborDistances = max(inputDistances, xDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    xDistances.rb = vec2(xDistance);
                    xDistances.ga = vec2(xDistance + sign);

                    neighborDistances = max(inputDistances, xDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(xDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};
        
        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideHeight(int yCoord) { return yCoord >= 0 && yCoord <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 yDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = outputCoords;    
            inputCoords.w = outputCoords.w % 2;    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                yDistances.rg = vec2(0 - sign);
                yDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, yDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                yDistances.rg = vec2(0);
                yDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, yDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int yDistance = 2; yDistance <= maxSteps; yDistance += 2) 
            {
                inputCoords.y = outputCoords.y + yDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    yDistances.rg = vec2(yDistance - sign);
                    yDistances.ba = vec2(yDistance);

                    neighborDistances = max(inputDistances, yDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    yDistances.rg = vec2(yDistance);
                    yDistances.ba = vec2(yDistance + sign);

                    neighborDistances = max(inputDistances, yDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(yDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class SecondExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatches, inDepth, inHeight, inWidth] = inputShape;  if (inBatches != 2) throw new Error('Batch dimension needs to be 2');
        this.outputShape = [4, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideDepth(int zCoord) { return zCoord >= 0 && zCoord <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = outputCoords;    
            inputCoords.w = outputCoords.w % 2;    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            for (int zDistance = 0; zDistance <= maxSteps; zDistance++) 
            {
                inputCoords.z = outputCoords.z + zDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);
                    candidateDistances = max(inputDistances, vec4(zDistance));

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(zDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassX implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inWidth-1))};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) { return ivec4(coords.xyz, coords.w / 2); }

        int getSignFromOutputCoords(ivec4 coords) { return ((coords.w % 2) == 0) ? -1 : 1; }

        bool insideWidth(int xCoord) { return xCoord >= 0 && xCoord <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 xDistances, neighborDistances, candidateDistances;
            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int xSign = getSignFromOutputCoords(outputCoords);

            for (int xDistance = 0; xDistance <= maxSteps; xDistance += 2) 
            {
                inputCoords.x = outputCoords.x + xDistance * xSign;
                if (insideWidth(inputCoords.x))
                {
                    inputDistances = getInputDistances(inputCoords);

                    xDistances.ga = vec2(xDistance);
                    xDistances.rb = vec2(xDistance - xSign);

                    neighborDistances = mix(vec4(${maxDistance}), xDistances, step(inputDistances, xDistances));
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    xDistances.ga = vec2(xDistance + xSign);
                    xDistances.rb = vec2(xDistance);

                    neighborDistances = mix(vec4(${maxDistance}), xDistances, step(inputDistances, xDistances));
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(xDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassY implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {        
        const ceilToEven = (x: number) => Math.ceil(x / 2) * 2

        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 4) throw new Error('Batch dimension needs to be 4');
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) { return ivec4(coords.xyz, (coords.w % 2) + 2 * (coords.w / 4)); }

        int getSignFromOutputCoords(ivec4 coords) { return ((coords.w % 4) / 2) == 0 ? -1 : 1; }

        bool insideHeight(int yCoord) { return yCoord >= 0 && yCoord <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int ySign = getSignFromOutputCoords(outputCoords);
            vec4 yDistances, neighborAcceptance, neighborDistances, candidateDistances;

            for (int yDistance = 0; yDistance <= maxSteps; yDistance += 2) 
            {
                inputCoords.y = outputCoords.y + yDistance * ySign;
                if (insideHeight(inputCoords.y))
                {
                    inputDistances = getInputDistances(inputCoords);

                    yDistances.ba = vec2(yDistance);
                    yDistances.rg = vec2(yDistance - ySign);

                    neighborDistances = mix(vec4(${maxDistance}), yDistances, step(inputDistances, yDistances));
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    yDistances.ba = vec2(yDistance + ySign);
                    yDistances.rg = vec2(yDistance);

                    neighborDistances = mix(vec4(${maxDistance}), yDistances, step(inputDistances, yDistances));
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(yDistance + 2)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class ThirdExtendedAnisotropicChebyshevDistancePassZ implements GPGPUProgram 
{
    variableNames = ['InputDistances']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor
    (
        inputShape: [number, number, number, number], 
        maxDistance: number,
    ) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape;  if (inBatch != 4) throw new Error('Batch dimension needs to be 4')
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `
        const int maxSteps = ${Math.min(maxDistance, inDepth-1)};

        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        ivec4 getInputCoordsFromOutputCoords(ivec4 coords) { return ivec4(coords.xyz, coords.w % 4); }

        int getSignFromOutputCoords(ivec4 coords) { return ((coords.w % 8) < 4) ? -1 : 1; }

        bool insideDepth(int zCoord) { return zCoord >= 0 && zCoord <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = getInputCoordsFromOutputCoords(outputCoords);

            vec4 outputDistances = vec4(${maxDistance});
            vec4 inputDistances = outputDistances;

            int zSign = getSignFromOutputCoords(outputCoords);

            for (int zDistance = 0; zDistance <= maxSteps; zDistance++) 
            {
                inputCoords.z = outputCoords.z + zDistance * zSign;
                if (insideDepth(inputCoords.z))
                {
                    vec4 inputDistances = getInputDistances(inputCoords);
                    vec4 zDistances = vec4(zDistance);

                    vec4 candidateDistances = mix(outputDistances, zDistances, step(inputDistances, zDistances));

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(zDistance + 1)) 
                    {
                        break;
                    }
                }
            }

            outputDistances = clamp(outputDistances, vec4(0), vec4(${maxDistance}));

            setOutput(outputDistances);
        }
        `
    }
}

class FourthExtendedAnisotropicChessDistancePassXYZ implements GPGPUProgram 
{
    variableNames = ['InputDistancesX', 'InputDistancesY', 'InputDistancesZ']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor(inputShape: [number, number, number, number]) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 8) throw new Error('Batch dimension needs to be 8')
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `

        vec4 getInputDistancesX(ivec4 coords) { return getInputDistancesX(coords.w, coords.z, coords.y, coords.x); }
        vec4 getInputDistancesY(ivec4 coords) { return getInputDistancesY(coords.w, coords.z, coords.y, coords.x); }
        vec4 getInputDistancesZ(ivec4 coords) { return getInputDistancesZ(coords.w, coords.z, coords.y, coords.x); }

        ivec4 mmin(ivec4 x, ivec4 y, ivec4 z) { return min(min(x, y), z); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = outputCoords;

            ivec4 inputDistancesX = ivec4(getInputDistancesX(inputCoords));
            ivec4 inputDistancesY = ivec4(getInputDistancesY(inputCoords));
            ivec4 inputDistancesZ = ivec4(getInputDistancesZ(inputCoords));

            ivec4 inputDistances = mmin(inputDistancesX, inputDistancesY, inputDistancesZ);
            ivec4 inputOccupancies = ivec4(lessThan(inputDistances, ivec4(1)));
    
            ivec4 outputDistances = 
                clamp(inputDistancesX,  0, 31) * 2048 + 
                clamp(inputDistancesY,  0, 31) * 64   + 
                clamp(inputDistancesZ,  0, 31) * 2    + 
                clamp(inputOccupancies, 0,  1);

            setOutput(vec4(outputDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs))
}

export function extendedAnisotropicChessDistanceProgramPacked(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    // 1D 
    const firstPassX = new FirstExtendedAnisotropicChebyshevDistancePassX(inputOccupancy.shape, maxDistance)
    const firstPassY = new FirstExtendedAnisotropicChebyshevDistancePassY(inputOccupancy.shape, maxDistance)
    const distance_X0_X1 = runProgram(firstPassX, [inputOccupancy]) as tf.Tensor4D
    const distance_Y0_Y1 = runProgram(firstPassY, [inputOccupancy]) as tf.Tensor4D

    // 2D
    const secondPassY = new SecondExtendedAnisotropicChebyshevDistancePassY(distance_X0_X1.shape, maxDistance)
    const distance_XY00_XY10_XY01_XY11 = runProgram(secondPassY, [distance_X0_X1]) as tf.Tensor4D; 
    
    const secondPassZ = new SecondExtendedAnisotropicChebyshevDistancePassZ(distance_Y0_Y1.shape, maxDistance)
    const distance_XZ00_XZ10_XZ01_XZ11 = runProgram(secondPassZ, [distance_X0_X1]) as tf.Tensor4D
    tf.dispose(distance_X0_X1)
    
    const distance_YZ00_YZ10_YZ01_YZ11 = runProgram(secondPassZ, [distance_Y0_Y1]) as tf.Tensor4D
    tf.dispose(distance_Y0_Y1)

    // 3D
    const thirdPassX = new ThirdExtendedAnisotropicChebyshevDistancePassX(distance_YZ00_YZ10_YZ01_YZ11.shape, maxDistance)
    const distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassX, [distance_YZ00_YZ10_YZ01_YZ11]) as tf.Tensor4D
    tf.dispose(distance_YZ00_YZ10_YZ01_YZ11)

    const thirdPassY = new ThirdExtendedAnisotropicChebyshevDistancePassY(distance_XZ00_XZ10_XZ01_XZ11.shape, maxDistance)
    const distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassY, [distance_XZ00_XZ10_XZ01_XZ11]) as tf.Tensor4D 
    tf.dispose(distance_XZ00_XZ10_XZ01_XZ11)
    
    const thirdPassZ = new ThirdExtendedAnisotropicChebyshevDistancePassZ(distance_XY00_XY10_XY01_XY11.shape, maxDistance)
    const distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(thirdPassZ, [distance_XY00_XY10_XY01_XY11]) as tf.Tensor4D
    tf.dispose(distance_XY00_XY10_XY01_XY11)

    // Pack
    const fourthPassXYZ = new FourthExtendedAnisotropicChessDistancePassXYZ(distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111.shape)
    const distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111 = runProgram(fourthPassXYZ, [
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
    ]) as tf.Tensor4D
    tf.dispose([
        distanceX_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceY_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
        distanceZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111,
    ])

    return distancesXYZ_XYZ000_XYZ100_XYZ010_XYZ110_XYZ001_XYZ101_XYZ011_XYZ111
}
