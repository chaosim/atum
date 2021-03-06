/**
 * @fileOverview Mapping of AST nodes to computations.
 * 
 * Mapping requires two passes, one for declarations and one for the actual
 * program. This is because Javascript initializes all values declared in a
 * scope to undefined even before they are declared. Function declarations are
 * also initialized during this pass.
 */
define(['atum/compute',
        'atum/semantics/declaration',
        'atum/semantics/expression',
        'atum/semantics/func',
        'atum/semantics/program',
        'atum/semantics/statement',
        'atum/semantics/value'],
function(compute,
        declaration_semantics,
        expression_semantics,
        function_semantics,
        program_semantics,
        statement_semantics,
        value_semantics){
"use strict";

var map = Function.prototype.call.bind(Array.prototype.map);
var reduce = Function.prototype.call.bind(Array.prototype.reduce);

/* Declaration
 ******************************************************************************/
/**
 * Maps AST nodes for declarations to semantics computations.
 */
var declarations = function(node) {
    switch (node.type) {
    case 'BlockStatement':
        return statement_semantics.statementList(map(node.body, declarations));
    
    case 'IfStatement':
        return (node.alternate ?
            compute.next(
                declarations(node.consequent),
                declarations(node.alternate)) :
            declarations(node.consequent));
    
    case 'WithStatement':
        return declarations(node.body);
    
    case 'SwitchStatement':
        return statement_semantics.emptyStatement();
    
    case 'TryStatement':
        return compute.next(
            declarations(node.block),
            (compute.next(
            (node.handler ?
                declarations(node.handler.body) :
                statement_semantics.emptyStatement()),
            (node.finalizer ?
                declarations(node.finalizer) :
                statement_semantics.emptyStatement()))));
    
    case 'WhileStatement':
    case 'DoWhileStatement':
        return declarations(node.body);
        
    case 'ForStatement':
        return (node.init ? 
            compute.next(
                declarations(node.init),
                declarations(node.body)) :
            declarations(node.body));
        
    case 'ForInStatement':
        return (node.left ? 
            compute.next(
                declarations(node.left),
                declarations(node.body)) :
            declarations(node.body));
    
    case 'FunctionDeclaration':
        return declaration_semantics.functionDeclaration(
            (node.id === null ? null : node.id.name),
            map(node.params, function(x) {
                return x.name;
            }),
            sourceElements(node.body.body));
        
    case 'VariableDeclaration':
        return declaration_semantics.variableDeclaration(
            map(node.declarations, declarations));
        
    case 'VariableDeclarator':
        return declaration_semantics.variableDeclarator(node.id.name);
    
    default:
        return statement_semantics.emptyStatement();
    }
};

/**
 * 
 */
var sourceElements = function(elems) {
    return program_semantics.sourceElements(
        map(elems, mapSemantics),
        map(elems, declarations));
};

/* Program Semantics
 ******************************************************************************/
var emptyStatement = function(loc) {
    return statement_semantics.emptyStatement();
};

var debuggerStatement = function(loc) {
    return debug_operations.debuggerStatement();
};

var blockStatement = function(loc, body) {
    return statement_semantics.blockStatement(map(body, mapSemantics));
};

var expressionStatement = function(loc, expression) {
    return statement_semantics.expressionStatement(mapSemantics(expression));
};

var ifStatement = function(loc, test, consequent, alternate) {
    return statement_semantics.ifStatement(
        mapSemantics(test),
        mapSemantics(consequent),
        (alternate ?
            mapSemantics(alternate) :
            statement_semantics.emptyStatement()));
};

var breakStatement = function(loc, label) {
    return statement_semantics.breakStatement(
        label ? label.name : null);
};

var continueStatement = function(loc, label) {
    return statement_semantics.continueStatement(
        label ? label.name : null);
};

var returnStatement = function(loc, argument) {
    return statement_semantics.returnStatement(
        (argument ?
            mapSemantics(argument) :
            statement_semantics.emptyStatement()));
};

var throwStatement = function(loc, argument) {
    return statement_semantics.throwStatement(mapSemantics(argument));
};

var withStatement = function(loc) {
    throw "With";
};

var switchStatement = function(loc, discriminant, cases) {
    var pre = [], def = null, post =[];
    for (var i = 0; i < cases.length; ++i) {
        var e = cases[i];
        if (!e.test) {
            def = e;
            pre = cases.slice(0, i);
            post = cases.slice(i + 1);
            break;
        }
        pre = cases.slice(0, i + 1);
    }
    
    var caseMap = function(x) {
        return {
            'test' : mapSemantics(x.test),
            'consequent': (x.consequent ?
                statement_semantics.statementList(map(x.consequent, mapSemantics)) :
                statement_semantics.emptyStatement())
        };
    };
    
    return statement_semantics.switchStatement(
        mapSemantics(discriminant),
        map(pre, caseMap), {
            'consequent': (def ?
                statement_semantics.statementList(map(def.consequent, mapSemantics)) :
                statement_semantics.emptyStatement())
        },
        map(post, caseMap));
};

var tryStatement = function(loc, block, handler, finalizer) {
    var body = mapSemantics(block),
        finalizer = (finalizer ? mapSemantics(finalizer) : statement_semantics.emptyStatement());
    return (handler ?
        statement_semantics.tryCatchFinallyStatement(body, handler.param.name, mapSemantics(handler), finalizer) :
        statement_semantics.tryFinallyStatement(body, finalizer));
};

var whileStatement = function(loc, test, body) {
    return statement_semantics.whileStatement(
        (test ?
            mapSemantics(test) :
            semantics.booleanLiteral(true)),
        mapSemantics(body));
};

var doWhileStatement = function(loc, body, test) {
    return statement_semantics.doWhileStatement(
        mapSemantics(body),
        mapSemantics(test));
};

var forStatement = function(loc, init, test, update, body) {
    return statement_semantics.forStatement(
        (init ? mapSemantics(init) : expression_semantics.emptyExpression()),
        (test ? mapSemantics(test) : value_semantics.booleanLiteral(true)),
        (update ? mapSemantics(update) : expression_semantics.emptyExpression()),
        mapSemantics(body));
};

var forInStatement = function(loc, left, right, body) {
    return statement_semantics.forInStatement(
        mapSemantics(left),
        mapSemantics(right),
        mapSemantics(body));
};

var thisExpression = function(loc) {
    return expression_semantics.thisExpression();
};

var sequenceExpression = function(loc, expressions) {
    return expression_semantics.sequenceExpression(map(expressions, mapSemantics));
};

var unaryExpression = function(loc, operator, argument) {
    var argument = mapSemantics(argument);
    switch (operator) {
    case '+': return expression_semantics.unaryPlusOperator(argument);
    case '-': return expression_semantics.unaryMinusOperator(argument);
    case '!': return expression_semantics.logicalNotOperator(argument);
    case '~': return expression_semantics.bitwiseNotOperator(argument);
    case 'void': return expression_semantics.voidOperator(argument);
    case 'typeof': return expression_semantics.typeofOperator(argument);
    }
    throw "Unknown Unary Operator:" + operator;
};

var updateExpression = function(loc, operator, prefix, argument) {
    var a = mapSemantics(argument);
    switch (operator) {
    case '++':  return (prefix ?
                    expression_semantics.prefixIncrement(a) :
                    expression_semantics.postfixIncrement(a));
    case '--':  return (prefix ?
                    expression_semantics.prefixDecrement(a) :
                    expression_semantics.postfixDecrement(a));
    }
    throw "Unknown Update Operator:" + operator;
};

var binaryExpression = function(loc, operator, left, right) {
    var l = mapSemantics(left), r = mapSemantics(right);
    switch (operator) {
    case '+': return expression_semantics.addOperator(l, r);
    case '-': return expression_semantics.subtractOperator(l, r);
    case '*': return expression_semantics.multiplyOperator(l, r);
    case '/': return expression_semantics.divideOperator(l, r);
    case '%': return expression_semantics.remainderOperator(l, r);
    
    case '<<':  return expression_semantics.leftShiftOperator(l, r);
    case '>>':  return expression_semantics.signedRightShiftOperator(l, r);
    case '>>>': return expression_semantics.unsignedRightShiftOperator(l, r);
    case '&':   return expression_semantics.bitwiseAndOperator(l, r);
    case '^':   return expression_semantics.bitwiseXorOperator(l, r);
    case '|':   return expression_semantics.bitwiseOrOperator(l, r);
    
    case '==':  return expression_semantics.equalOperator(l, r);
    case '===':  return expression_semantics.strictEqualOperator(l, r);
    case '!=':  return expression_semantics.notEqualOperator(l, r);
    case '!==':  return expression_semantics.strictNotEqualOperator(l, r);
    
    case '<':   return expression_semantics.ltOperator(l, r);
    case '<=':  return expression_semantics.lteOperator(l, r);
    case '>':   return expression_semantics.gtOperator(l, r);
    case '>=':  return expression_semantics.gteOperator(l, r);
    case 'instanceof':  return expression_semantics.instanceofOperator(l, r);
    case 'in':  return expression_semantics.inOperator(l, r);
    }
    throw "Unknown Binary Operator:" + operator;
};

var logicalExpression = function(loc, operator, left, right) {
    var l = mapSemantics(left), r = mapSemantics(right);
    switch (operator) {
    case '||':  return expression_semantics.logicalOr(l, r);
    case '&&':  return expression_semantics.logicalAnd(l, r)
    }
    throw "Unknown Logical Operator:" + operator;
};

var assignmentExpression = function(loc, operator, left, right) {
    var l = mapSemantics(left), r = mapSemantics(right);
    switch (operator) {
    case '=':   return expression_semantics.assignment(l, r);
    case '+=':  return expression_semantics.compoundAssignment(expression_semantics.addOperator, l, r);
    case '-=':  return expression_semantics.compoundAssignment(expression_semantics.subtractOperator, l, r);
    case '*=':  return expression_semantics.compoundAssignment(expression_semantics.multiplyOperator, l, r);
    case '/=':  return expression_semantics.compoundAssignment(expression_semantics.divideOperator, l, r);
    case '%=':  return expression_semantics.compoundAssignment(expression_semantics.remainderOperator, l, r);
    
    case '<<=':     return expression_semantics.compoundAssignment(expression_semantics.leftShiftOperator, l, r);
    case '>>=':     return expression_semantics.compoundAssignment(expression_semantics.signedRightShiftOperator, l, r);
    case '>>>=':    return expression_semantics.compoundAssignment(expression_semantics.unsignedRightShiftOperator, l, r);
    case '&=':      return expression_semantics.compoundAssignment(expression_semantics.bitwiseAndOperator, l, r);
    case '^=':      return expression_semantics.compoundAssignment(expression_semantics.bitwiseXorOperator, l, r);
    case '|=':      return expression_semantics.compoundAssignment(expression_semantics.bitwiseOrOperator, l, r);
    }
    throw "Unknown Assignment Operator:" + operator;
};

var conditionalExpression = function(loc, test, consequent, alternate) {
    return expression_semantics.conditionalOperator(
        mapSemantics(test),
        mapSemantics(consequent),
        mapSemantics(alternate));
};

var newExpression = function(loc, callee, args) {
    return expression_semantics.newExpression(
        mapSemantics(callee),
        map(args, mapSemantics));
};

var callExpression = function(loc, callee, args) {
    return expression_semantics.callExpression(
        mapSemantics(callee),
        map(args, mapSemantics));
};

var memberExpression = function(loc, computed, object, property) {
    return expression_semantics.memberExpression(
        mapSemantics(object),
        (computed ?
            mapSemantics(property) :
            value_semantics.stringLiteral(property.name)));
};

var arrayExpression = function(loc, elements) {
    return new value_semantics.arrayLiteral(map(elements, function(x) { return (x ? mapSemantics(x) : x); }));
};

var objectExpression = (function(){
    var getProperty = function(key, property, properties) {
        var value = mapSemantics(property.value);
        if (!properties[key]) {
            properties[key] = {
                'writable': true,
                'enumerable': true,
                'configurable': true
            };
        }
        switch (property.kind) {
        case 'get':
            properties[key]['get'] = value; 
            break;
        case 'set':
            properties[key]['set'] = value;
            break;
        case 'init':
            properties[key]['value'] = value;
            break;
        }
        return properties;
    };
    
    var getProperties = function(properties) {
        return reduce(properties, function(p, c) {
            var key = (c.key.name === undefined ? c.key.value : c.key.name);
            return getProperty(key, c, p);
        }, {});
    };
    
    return function(loc, properties) {
        return value_semantics.objectLiteral(getProperties(properties));
    };
}());

var functionExpression = function(loc, id, params, body) {
    return function_semantics.functionExpression(
        (id === null ? null : id.name),
        map(params, function(x) { return x.name; }),
        sourceElements(body.body));
};

var program = function(loc, body) {
    return program_semantics.program(sourceElements(body));
};

var variableDeclaration = function(loc, declarations) {
    return declaration_semantics.variableDeclaration(
        map(declarations, mapSemantics));
};

var variableDeclarator = function(loc, id, init) {
    return (init ?
        declaration_semantics.variableInitDeclarator(id.name, mapSemantics(init)) :
        expression_semantics.emptyExpression());
};

var identifier = function(loc, name) {
    return value_semantics.identifier(name);
};

var literal = function(loc, kind, value) {
    switch (kind) {
    case 'number':  return value_semantics.numberLiteral(value);
    case 'boolean': return value_semantics.booleanLiteral(value);
    case 'string':  return value_semantics.stringLiteral(value);
    case 'null':    return value_semantics.nullLiteral(value);
    case 'regexp':  return value_semantics.regularExpression(value);
    }
    throw "Unknown Literal of kind:" + kind;
};

/**
 * Maps AST nodes to semantics computations.
 */
var mapSemantics = function(node) {
    if (!node)
        throw "null";
    
    var loc = node.loc;
    
    switch (node.type) {
// Clauses
    case 'SwitchCase':
       break;
       
    case 'CatchClause':
        return mapSemantics(node.body);

// Statement
    case 'EmptyStatement':
        return emptyStatement(loc);
        
    case 'DebuggerStatement':
        return debuggerStatement(loc);
    
    case 'BlockStatement':
        return blockStatement(loc, node.body);
    
    case 'ExpressionStatement':
        return expressionStatement(loc, node.expression);
    
    case 'IfStatement':
        return ifStatement(loc, node.test, node.consequent, node.alternate);
        
    case 'LabeledStatement':
        break;
    
    case 'BreakStatement':
        return statement_semantics.breakStatement(
            (node.label ? node.label.name : null));
    
    case 'ContinueStatement':
        return statement_semantics.continueStatement(
            (node.label ? node.label.name : null));
    
    case 'ReturnStatement':
        return returnStatement(loc, node.argument);
    
    case 'ThrowStatement':
        return throwStatement(loc, node.argument);
    
    case 'WithStatement':
        return withStatement(loc);
    
    case 'SwitchStatement':
        return switchStatement(loc, node.discriminant, node.cases);

    case 'TryStatement':
        return tryStatement(loc, node.block, node.handler, node.finalizer);
        
    case 'WhileStatement':
        return whileStatement(loc, node.test, node.body);
    
    case 'DoWhileStatement':
        return doWhileStatement(loc, node.body, node.test);
    
    case 'ForStatement':
        return forStatement(loc, node.init, node.test, node.update, node.body);
    
    case 'ForInStatement':
        return forInStatement(loc, node.left, node.right, node.body);
    
// Expression
    case 'ThisExpression':
        return thisExpression(loc);
    
    case 'SequenceExpression':
        return sequenceExpression(loc, node.expressions);
    
    case 'UnaryExpression':
        return unaryExpression(loc, node.operator, node.argument);
    
    case 'UpdateExpression':
        return updateExpression(loc, node.operator, node.prefix, node.argument);
    
    case 'BinaryExpression':
        return binaryExpression(loc, node.operator, node.left, node.right);
    
    case 'LogicalExpression':
        return logicalExpression(loc, node.operator, node.left, node.right);
    
    case 'AssignmentExpression':
        return assignmentExpression(loc, node.operator, node.left, node.right);
    
    case 'ConditionalExpression':
        return conditionalExpression(loc, node.test, node.consequent, node.alternate);
    
    case 'NewExpression':
        return newExpression(loc, node.callee, node.args);
    
    case 'CallExpression':
        return callExpression(loc, node.callee, node.args);
        
    case 'MemberExpression':
        return memberExpression(loc, node.computed, node.object, node.property);
 
    case 'ArrayExpression':
        return arrayExpression(loc, node.elements);
    
    case 'ObjectExpression':
        return objectExpression(loc, node.properties);
    
// Function
    case 'FunctionExpression':
        return functionExpression(loc, node.id, node.params, node.body);
    
    case 'FunctionDeclaration':
        /*
         * Function declarations are handled when evaluating source elements
         * so this is a noop.
         */
        return statement_semantics.emptyStatement();
    
// Program
    case 'Program':
        return program(loc, node.body);
    
// Declarations
    case 'VariableDeclaration':
        return variableDeclaration(loc, node.declarations);
    
    case 'VariableDeclarator':
        return variableDeclarator(loc, node.id, node.init);
    
// Value
    case 'Identifier':
        return identifier(loc, node.name);
    
    case 'Literal':
        return literal(loc, node.kind, node.value);
    }
    
    throw "Unknown node: " + node;
};

/* Export
 ******************************************************************************/
return {
    'sourceElements': sourceElements,
    'mapSemantics': mapSemantics
};

});