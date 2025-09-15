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

        bool insideWidth(int x) { return x >= 0 && x <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;
            
            int sign = (outputCoords.w < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }
            
            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {                    
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga); 

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
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

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
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

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec3 inputCoords = outputCoords.xyz;

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 1) ? -1 : 1;

            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);

                    candidateDistances = max(inputDistances, vec4(stepDistance));
                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 1)) 
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
        const int maxSteps = ${ceilToEven(Math.min(maxDistance, inHeight-1))};
        
        vec4 getInputDistances(ivec4 coords) { return getInputDistances(coords.w, coords.z, coords.y, coords.x); }

        bool insideWidth(int x) { return x >= 0 && x <= ${inWidth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
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

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborDistances = max(inputDistances, stepDistances);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y)) 
                {   
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborDistances = max(inputDistances, stepDistances);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 2)) 
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

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 2);    

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = inputDistances;

            int sign = (outputCoords.w < 2) ? -1 : 1;

            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);
                    stepDistances = vec4(stepDistance);

                    candidateDistances = max(inputDistances, stepDistances);
                    
                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 1)) 
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

        bool insideWidth(int x) { return x >= 0 && x <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborOccupancies, neighborDistances, candidateDistances;
            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int sign = ((outputCoords.w % 2) < 1) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rb = vec2(0 - sign);
                stepDistances.ga = vec2(0);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);
                candidateDistances.rb = neighborDistances.rb;
            }
            else
            {
                stepDistances.rb = vec2(0);
                stepDistances.ga = vec2(0 + sign);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                candidateDistances.ga = neighborDistances.ga;
                candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.x = outputCoords.x + stepDistance * sign;
                if (insideWidth(inputCoords.x))
                {
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rb = vec2(stepDistance - sign);
                    stepDistances.ga = vec2(stepDistance);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.rb = min(neighborDistances.rb, neighborDistances.ga);

                    stepDistances.rb = vec2(stepDistance);
                    stepDistances.ga = vec2(stepDistance + sign);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.ga = min(neighborDistances.rb, neighborDistances.ga);

                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 1)) 
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

        bool insideHeight(int y) { return y >= 0 && y <= ${inHeight-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, neighborOccupancies, neighborDistances, candidateDistances;
            
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);

            vec4 inputDistances = getInputDistances(inputCoords);
            vec4 outputDistances = vec4(${maxDistance});
            
            int sign = ((outputCoords.w % 4) < 2) ? -1 : 1;
            if (sign < 0)
            {
                stepDistances.rg = vec2(0 - sign);
                stepDistances.ba = vec2(0);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);
                candidateDistances.rg = neighborDistances.rg;
            }
            else
            {
                stepDistances.rg = vec2(0);
                stepDistances.ba = vec2(0 + sign);

                neighborOccupancies = step(inputDistances, stepDistances);
                neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                candidateDistances.ba = neighborDistances.ba;
                candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);
            }

            outputDistances = min(outputDistances, candidateDistances);
            if (mmax(outputDistances) < 2.0) 
            {
                setOutput(outputDistances);
                return;
            }

            for (int stepDistance = 2; stepDistance <= maxSteps; stepDistance += 2) 
            {
                inputCoords.y = outputCoords.y + stepDistance * sign;
                if (insideHeight(inputCoords.y))
                {
                    inputDistances = getInputDistances(inputCoords);

                    stepDistances.rg = vec2(stepDistance - sign);
                    stepDistances.ba = vec2(stepDistance);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.rg = min(neighborDistances.rg, neighborDistances.ba);

                    stepDistances.rg = vec2(stepDistance);
                    stepDistances.ba = vec2(stepDistance + sign);

                    neighborOccupancies = step(inputDistances, stepDistances);
                    neighborDistances = mix(outputDistances, stepDistances, neighborOccupancies);
                    candidateDistances.ba = min(neighborDistances.rg, neighborDistances.ba);

                    outputDistances = min(outputDistances, candidateDistances);

                    if (mmax(outputDistances) < float(stepDistance + 1)) 
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

        bool insideDepth(int z) { return z >= 0 && z <= ${inDepth-1}; }

        float mmax(vec4 v) { return max(max(v.x, v.y), max(v.z, v.w)); }

        void main() 
        {
            vec4 stepDistances, candidateOccupancies, candidateDistances;

            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = ivec4(outputCoords.xyz, outputCoords.w % 4);    

            vec4 outputDistances = vec4(${maxDistance});
            vec4 inputDistances;

            int sign = (outputCoords.w < 4) ? -1 : 1;
            
            for (int stepDistance = 0; stepDistance <= maxSteps; stepDistance++) 
            {
                inputCoords.z = outputCoords.z + stepDistance * sign;
                if (insideDepth(inputCoords.z))
                {
                    inputDistances = getInputDistances(inputCoords);
                    stepDistances = vec4(stepDistance);

                    candidateOccupancies = step(inputDistances, stepDistances);
                    candidateDistances = mix(outputDistances, stepDistances, candidateOccupancies);

                    outputDistances = min(outputDistances, candidateDistances);
                    if (mmax(outputDistances) < float(stepDistance + 1)) 
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

class FourthExtendedAnisotropicChessDistancePass implements GPGPUProgram 
{
    variableNames = ['InputDistanceX', 'InputDistanceY', 'InputDistanceZ']
    outputShape: number[]
    userCode: string
    packedInputs = true
    packedOutput = true

    constructor(inputShape: [8, number, number, number]) 
    {
        const [inBatch, inDepth, inHeight, inWidth] = inputShape; if (inBatch != 8) throw new Error('Batch dimension needs to be 8')
        this.outputShape = [8, inDepth, inHeight, inWidth]
        this.userCode = `

        vec4 getInputDistancesX(ivec4 coords) { return floor(getInputDistancesX(coords.w, coords.z, coords.y, coords.x) + 0.5); }
        vec4 getInputDistancesY(ivec4 coords) { return floor(getInputDistancesY(coords.w, coords.z, coords.y, coords.x) + 0.5); }
        vec4 getInputDistancesZ(ivec4 coords) { return floor(getInputDistancesZ(coords.w, coords.z, coords.y, coords.x) + 0.5); }

        void main() 
        {
            ivec4 outputCoords = getOutputCoords().wzyx;
            ivec4 inputCoords = outputCoords;

            vec4 outputDistances;

            vec4 inputDistancesX = ivec4(getInputDistanceX(inputCoords));
            vec4 inputDistancesY = ivec4(getInputDistanceY(inputCoords));
            vec4 inputDistancesZ = ivec4(getInputDistanceZ(inputCoords));
            
            ivec4 inputDistances = min(min(inputDistancesX, inputDistancesY), inputDistancesZ);
            ivec4 inputOccupancies = ivec4(equal(inputDistances, ivec4(0)));
    
            ivec4 outputDistances = 
                clamp(inputDistancesX,  ivec4(0), ivec4(31)) * 2048 + 
                clamp(inputDistancesY,  ivec4(0), ivec4(31)) * 64   + 
                clamp(inputDistancesZ,  ivec4(0), ivec4(31)) * 2    + 
                clamp(inputOccupancies, ivec4(0), ivec4( 1)) * 1;

            setOutput(vec4(outputDistances));
        }
        `
    }
}

function runProgram(prog: GPGPUProgram, inputs: tf.Tensor[]) : tf.Tensor3D 
{
    const backend = tf.backend() as MathBackendWebGL
    return tf.engine().makeTensorFromTensorInfo(backend.compileAndRun(prog, inputs)) as tf.Tensor3D
}

export function extendedAnisotropicChessDistanceProgram(inputOccupancy: tf.Tensor3D, maxDistance: number): tf.Tensor4D 
{
    const shape = inputOccupancy.shape

    // Programs
    const getChessDistanceAlongX0 = new AnisotropicChessDistancePass(shape, 'occupancy', '-x', maxDistance)
    const getChessDistanceAlongX1 = new AnisotropicChessDistancePass(shape, 'occupancy', '+x', maxDistance)
    const getChessDistanceAlongY0 = new AnisotropicChessDistancePass(shape, 'occupancy', '-y', maxDistance)
    const getChessDistanceAlongY1 = new AnisotropicChessDistancePass(shape, 'occupancy', '+y', maxDistance)
    
    const getChessDistanceAlongY0FromXorZ  = new AnisotropicChessDistancePass(shape, 'distance',  '-y', maxDistance)
    const getChessDistanceAlongY1FromXorZ  = new AnisotropicChessDistancePass(shape, 'distance',  '+y', maxDistance)
    const getChessDistanceAlongZ0FromXorY  = new AnisotropicChessDistancePass(shape, 'distance',  '-z', maxDistance)
    const getChessDistanceAlongZ1FromXorY  = new AnisotropicChessDistancePass(shape, 'distance',  '+z', maxDistance)
    
    const getChessDistanceXAlongX0FromYZ = new ExtendedAnisotropicChessDistancePass(shape, '-x', maxDistance)
    const getChessDistanceXAlongX1FromYZ = new ExtendedAnisotropicChessDistancePass(shape, '+x', maxDistance)
    const getChessDistanceYAlongY0FromXZ = new ExtendedAnisotropicChessDistancePass(shape, '-y', maxDistance)
    const getChessDistanceYAlongY1FromXZ = new ExtendedAnisotropicChessDistancePass(shape, '+y', maxDistance)
    const getChessDistanceZAlongZ0FromXY = new ExtendedAnisotropicChessDistancePass(shape, '-z', maxDistance)
    const getChessDistanceZAlongZ1FromXY = new ExtendedAnisotropicChessDistancePass(shape, '+z', maxDistance)

    const getChessDistancesBitpacked = new ExtendedAnisotropicChessDistancesBitpack(shape)

    // 1D
    const chessDistanceOverX0 = runProgram(getChessDistanceAlongX0, [inputOccupancy])
    const chessDistanceOverX1 = runProgram(getChessDistanceAlongX1, [inputOccupancy])
    const chessDistanceOverY0 = runProgram(getChessDistanceAlongY0, [inputOccupancy])
    const chessDistanceOverY1 = runProgram(getChessDistanceAlongY1, [inputOccupancy])

    // 2D
    const chessDistanceOverXY00 = runProgram(getChessDistanceAlongY0FromXorZ, [chessDistanceOverX0]);
    const chessDistanceOverXY01 = runProgram(getChessDistanceAlongY1FromXorZ, [chessDistanceOverX0]); 
    const chessDistanceOverXZ00 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverX0]);
    const chessDistanceOverXZ01 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverX0]); tf.dispose(chessDistanceOverX0)
    const chessDistanceOverXY10 = runProgram(getChessDistanceAlongY0FromXorZ, [chessDistanceOverX1]);
    const chessDistanceOverXY11 = runProgram(getChessDistanceAlongY1FromXorZ, [chessDistanceOverX1]); 
    const chessDistanceOverXZ10 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverX1]);
    const chessDistanceOverXZ11 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverX1]); tf.dispose(chessDistanceOverX1)
    const chessDistanceOverYZ00 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverY0]);
    const chessDistanceOverYZ01 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverY0]); tf.dispose(chessDistanceOverY0)
    const chessDistanceOverYZ10 = runProgram(getChessDistanceAlongZ0FromXorY, [chessDistanceOverY1]);
    const chessDistanceOverYZ11 = runProgram(getChessDistanceAlongZ1FromXorY, [chessDistanceOverY1]); tf.dispose(chessDistanceOverY1)

    // 3D
    const chessDistanceXOverXYZ000 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ00]);
    const chessDistanceXOverXYZ100 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ00]); tf.dispose(chessDistanceOverYZ00)
    const chessDistanceXOverXYZ001 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ01]);
    const chessDistanceXOverXYZ101 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ01]); tf.dispose(chessDistanceOverYZ01)
    const chessDistanceXOverXYZ010 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ10]);
    const chessDistanceXOverXYZ110 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ10]); tf.dispose(chessDistanceOverYZ10)
    const chessDistanceXOverXYZ011 = runProgram(getChessDistanceXAlongX0FromYZ, [chessDistanceOverYZ11]);
    const chessDistanceXOverXYZ111 = runProgram(getChessDistanceXAlongX1FromYZ, [chessDistanceOverYZ11]); tf.dispose(chessDistanceOverYZ11)
    const chessDistanceYOverXYZ000 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ00]);
    const chessDistanceYOverXYZ010 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ00]); tf.dispose(chessDistanceOverXZ00)
    const chessDistanceYOverXYZ001 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ01]);
    const chessDistanceYOverXYZ011 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ01]); tf.dispose(chessDistanceOverXZ01)
    const chessDistanceYOverXYZ100 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ10]);
    const chessDistanceYOverXYZ110 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ10]); tf.dispose(chessDistanceOverXZ10)
    const chessDistanceYOverXYZ101 = runProgram(getChessDistanceYAlongY0FromXZ, [chessDistanceOverXZ11]);
    const chessDistanceYOverXYZ111 = runProgram(getChessDistanceYAlongY1FromXZ, [chessDistanceOverXZ11]); tf.dispose(chessDistanceOverXZ11)
    const chessDistanceZOverXYZ000 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY00]);
    const chessDistanceZOverXYZ001 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY00]); tf.dispose(chessDistanceOverXY00)
    const chessDistanceZOverXYZ010 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY01]);
    const chessDistanceZOverXYZ011 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY01]); tf.dispose(chessDistanceOverXY01)
    const chessDistanceZOverXYZ100 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY10]);
    const chessDistanceZOverXYZ101 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY10]); tf.dispose(chessDistanceOverXY10)
    const chessDistanceZOverXYZ110 = runProgram(getChessDistanceZAlongZ0FromXY, [chessDistanceOverXY11]);
    const chessDistanceZOverXYZ111 = runProgram(getChessDistanceZAlongZ1FromXY, [chessDistanceOverXY11]); tf.dispose(chessDistanceOverXY11)

    // Packing
    const chessDistancesXYZOverXYZ000 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ000, chessDistanceYOverXYZ000, chessDistanceZOverXYZ000, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ000, chessDistanceYOverXYZ000, chessDistanceZOverXYZ000])
    const chessDistancesXYZOverXYZ001 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ001, chessDistanceYOverXYZ001, chessDistanceZOverXYZ001, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ001, chessDistanceYOverXYZ001, chessDistanceZOverXYZ001])
    const chessDistancesXYZOverXYZ010 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ010, chessDistanceYOverXYZ010, chessDistanceZOverXYZ010, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ010, chessDistanceYOverXYZ010, chessDistanceZOverXYZ010])
    const chessDistancesXYZOverXYZ011 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ011, chessDistanceYOverXYZ011, chessDistanceZOverXYZ011, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ011, chessDistanceYOverXYZ011, chessDistanceZOverXYZ011])
    const chessDistancesXYZOverXYZ100 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ100, chessDistanceYOverXYZ100, chessDistanceZOverXYZ100, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ100, chessDistanceYOverXYZ100, chessDistanceZOverXYZ100])
    const chessDistancesXYZOverXYZ101 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ101, chessDistanceYOverXYZ101, chessDistanceZOverXYZ101, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ101, chessDistanceYOverXYZ101, chessDistanceZOverXYZ101])
    const chessDistancesXYZOverXYZ110 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ110, chessDistanceYOverXYZ110, chessDistanceZOverXYZ110, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ110, chessDistanceYOverXYZ110, chessDistanceZOverXYZ110])
    const chessDistancesXYZOverXYZ111 = runProgram(getChessDistancesBitpacked, [chessDistanceXOverXYZ111, chessDistanceYOverXYZ111, chessDistanceZOverXYZ111, inputOccupancy]);  tf.dispose([chessDistanceXOverXYZ111, chessDistanceYOverXYZ111, chessDistanceZOverXYZ111])

    // Concatenate 
    const chessDistancesXYZOverXYZ = tf.stack([
        chessDistancesXYZOverXYZ000,
        chessDistancesXYZOverXYZ100,
        chessDistancesXYZOverXYZ010,
        chessDistancesXYZOverXYZ110,
        chessDistancesXYZOverXYZ001,
        chessDistancesXYZOverXYZ101,
        chessDistancesXYZOverXYZ011,
        chessDistancesXYZOverXYZ111,
    ], 0)

    tf.dispose([
        chessDistancesXYZOverXYZ000,
        chessDistancesXYZOverXYZ100,
        chessDistancesXYZOverXYZ010,
        chessDistancesXYZOverXYZ110,
        chessDistancesXYZOverXYZ001,
        chessDistancesXYZOverXYZ101,
        chessDistancesXYZOverXYZ011,
        chessDistancesXYZOverXYZ111,
    ])
            
    return chessDistancesXYZOverXYZ as tf.Tensor4D
}
