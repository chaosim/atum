/**
 * @fileOverview Completion computations.
 */
define(['atum/compute',
        'atum/completion'],
function(compute,
        completion){
"use strict";

/* Creation
 ******************************************************************************/
/**
 * Create a normal completion.
 * 
 * @param argument Computation of value to store in completion.
 */
var completeNormal = function(argument) {
    return compute.bind(argument, function(x) {
        return compute.just(new completion.NormalCompletion(x));
    })
};

/**
 * Create a throw completion.
 * 
 * @param argument Computation of value to store in completion.
 */
var completeThrow = function(argument) {
    return compute.bind(argument, function(x) {
        return compute.just(new completion.ThrowCompletion(x));
    })
};

/**
 * Create a return completion.
 * 
 * @param argument Computation of value to store in completion.
 */
var completeReturn = function(argument) {
    return compute.bind(argument, function(x) {
        return compute.just(new completion.ReturnCompletion(x));
    });
};

/**
 * Create a break completion.
 * 
 * @param [string] Target of break. May be null.
 * @param [argument] Computation of value to store in completion.
 */
var completeBreak = function(target, argument) {
    return (!argument ?
        completeBreak(target, compute.empty) :
        compute.bind(argument, function(x) {
            return compute.just(new completion.BreakCompletion(target, x));
        }));
};

/**
 * Create a break completion.
 * 
 * @param [string] Target of break. May be null.
 * @param [argument] Computation of value to store in completion.
 */
var completeContinue = function(target, argument) {
    return (!argument ?
        completeContinue(target, compute.empty) :
        compute.bind(argument, function(x) {
            return compute.just(new completion.ContinueCompletion(target, x));
        }));
};


/* Export
 ******************************************************************************/
return {
// Creation
    'completeNormal': completeNormal,
    'completeThrow': completeThrow,
    'completeReturn': completeReturn,
    'completeBreak': completeBreak,
    'completeContinue': completeContinue
};

});