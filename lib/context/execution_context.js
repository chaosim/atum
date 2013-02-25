define(function() {
"use strict";

/* 
 ******************************************************************************/
var GLOBAL = 1,
    EVAL = 2,
    FUNCTION = 3;

var ExecutionContext = function(type, strict, lexicalEnvironment, variableEnvironment, thisBinding) {
    this.type = type;
    this.strict = !!strict;
    this.lexicalEnvironment = lexicalEnvironment;
    this.variableEnvironment = variableEnvironment;
    this.thisBinding = thisBinding;
};

/* Export
 ******************************************************************************/
return {
    'GLOBAL': GLOBAL,
    'EVAL': EVAL,
    'FUNCTION': FUNCTION,
    
    'ExecutionContext': ExecutionContext
};

});