/*
754-2008 - IEEE Standard for Floating-Point Arithmetic
(http://www.dsc.ufcg.edu.br/~cnum/modulos/Modulo2/IEEE754_2008.pdf)
*/

#ifndef SPECIAL_CONSTANTS
#define SPECIAL_CONSTANTS

struct SpecialConstants 
{
    float POS_ZERO;  // +0.0
    float NEG_ZERO;  // -0.0
    float POS_INF;   // +Infinity
    float NEG_INF;   // -Infinity
    float QNAN;      // Canonical quiet NaN (e.g. 0x7fc00000)
    float POS_QNAN;  // Quiet NaN (positive)
    float NEG_QNAN;  // Quiet NaN (negative)
    float POS_SNAN;  // Signaling NaN (positive)
    float NEG_SNAN;  // Signaling NaN (negative)
    float TRAP;      // Trap pattern (e.g. max exponent, max fraction)
};

const SpecialConstants SPECIAL = SpecialNumbers(
    uintBitsToFloat(0x00000000u), // POS_ZERO
    uintBitsToFloat(0x80000000u), // NEG_ZERO
    uintBitsToFloat(0x7f800000u), // POS_INF 
    uintBitsToFloat(0xff800000u), // NEG_INF 
    uintBitsToFloat(0x7f800001u), // QNAN    
    uintBitsToFloat(0xff800001u), // POS_QNAN
    uintBitsToFloat(0x7f000001u), // NEG_QNAN
    uintBitsToFloat(0xff000001u), // POS_SNAN
    uintBitsToFloat(0xffffffffu), // NEG_SNAN
    uintBitsToFloat(0x7fc00000u)  // TRAP    
);

#endif