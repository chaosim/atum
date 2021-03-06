/**
 * @fileOverview Value Semantics.
 */
define(['atum/compute',
        'atum/builtin/array',
        'atum/builtin/object',
        'atum/operations/boolean',
        'atum/operations/environment',
        'atum/operations/internal_reference',
        'atum/operations/nil',
        'atum/operations/number',
        'atum/operations/object',
        'atum/operations/string',
        'atum/semantics/expression'],
function(compute,
        builtin_array,
        object_builtin,
        boolean,
        environment,
        internal_reference,
        nil,
        number,
        object,
        string,
        expression){
"use strict";

var reduce = Function.prototype.call.bind(Array.prototype.reduce);

/* Literals
 ******************************************************************************/
var numberLiteral = number.create;

var booleanLiteral = boolean.create;

var stringLiteral = string.create;

var nullLiteral = function() { return nil.NULL; }

var regularExpressionLiteral /* @TODO */;

/* Complex Type Literals
 ******************************************************************************/
/**
 * Object literal semantics.
 * 
 * @param properties Object mapping string key values to property descriptors.
 */
var objectLiteral = function(properties) {
    return object.defineProperties(
        expression.newExpression(compute.just(object_builtin.Object), []),
        reduce(Object.keys(properties), function(p, key) {
            var prop = properties[key];
            p[key] = {
                'value': prop.value ? internal_reference.getValue(prop.value) : null,
                'get': prop.get ? internal_reference.getValue(prop.get) : null,
                'set': prop.set ? internal_reference.getValue(prop.set) : null,
                'enumerable': true,
                'writable': true,
                'configurable': true
            };
            return p;
        }, {}));
};

/**
 * Array literal semantics.
 */
var arrayLiteral = function(elements) {
    return reduce(elements, function(p, c, i) {
        return (c ? object.defineProperty(
            p,
            i + "", {
                'value': internal_reference.getValue(c),
                'writable': true,
                'enumerable': true,
                'configurable': true
            }) : p);
    }, object.construct(
        compute.just(builtin_array.Array),
        compute.enumeration(number.create(elements.length))));

};

/* Symbols
 ******************************************************************************/
var identifier = environment.getBinding;

/* Export
 ******************************************************************************/
return {
    'numberLiteral': numberLiteral,
    'booleanLiteral': booleanLiteral,
    'stringLiteral': stringLiteral,
    'nullLiteral': nullLiteral,
    'regularExpressionLiteral': regularExpressionLiteral,
    
    'objectLiteral': objectLiteral,
    'arrayLiteral': arrayLiteral,
    
    'identifier': identifier
};

});