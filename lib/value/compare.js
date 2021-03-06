/**
 * @fileOverview Comparison operations for primitive values.
 * 
 * Does not handle object values.
 */
define(['atum/value/value',
        'atum/value/type_conversion',
        'atum/value/type',
        'atum/value/boolean', 'atum/value/number', 'atum/value/string'],
function(value,
        type_conversion,
        type,
        boolean, number, string) {
"use strict";

/* Compare Operations
 ******************************************************************************/
/**
 * Perform a strict equality comparison of primitive values 'x' and 'y'.
 * 
 * Does not perform type conversion.
 */
var strictEqual = function(x, y) {
    var xType = value.type(x),
        yType = value.type(y);
    
    if (xType !== yType) {
        return boolean.FALSE;
    }
    
    switch (xType) {
    case type.UNDEFINED_TYPE:
    case type.NULL_TYPE:
        return boolean.TRUE;
    case type.OBJECT_TYPE:
        return new boolean.Boolean(x === y);
    default:
        return new boolean.Boolean(x.value === y.value);
    }
};

/**
 * Perform a equality comparison on primitive values 'x' and 'y'.
 * 
 * Attempts type conversion.
 */
var equal = function(x, y) {
    var strict = strictEqual(x, y);
    if (strict.value) {
        return strict;
    }
    
    var xType = value.type(x),
        yType = value.type(y);
    
    if ((xType === type.NULL_TYPE && yType === type.UNDEFINED_TYPE) ||
      (xType === type.UNDEFINED_TYPE && yType === type.NULL_TYPE)) {
        return boolean.TRUE;
    } else if (xType === type.NUMBER_TYPE && yType === type.STRING_TYPE) {
        return equal(x, type_conversion.toNumber(y));
    } else if (xType === type.STRING_TYPE && yType === type.NUMBER_TYPE) {
        return equal(type_conversion.toNumber(x), y);
    } else if (xType === type.BOOLEAN_TYPE) {
        return equal(type_conversion.toNumber(x), y);
    } else if (yType === type.BOOLEAN_TYPE) {
        return equal(x, type_conversion.toNumber(y));
    }
    
    return boolean.FALSE;
};

/* Export
 ******************************************************************************/
return {
    'equal': equal,
    'strictEqual': strictEqual
};

});