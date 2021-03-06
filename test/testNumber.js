define(['$',
        'atum/interpret'],
function($,
        interpret){
   
    return {
        'module': "Number",
        'tests': [
            ["Number Literal",
            function(){
                ([10, -10, 1e6, -1e6, 1.5, -1.5]).forEach(function(x) {
                    var result = interpret.evaluate($.Number(x));
                    assert.equal(result.type, 'number');
                    assert.equal(result.value, x);
                });
            }],
            ["Binary Plus Number",
            function(){
                 ([10, -10, 1e6, -1e6, 1.5, -1.5]).forEach(function(x) {
                    var root = $.Add($.Number(x), $.Number(10));
                    var result = interpret.evaluate(root);
                    assert.equal(result.type, 'number');
                    assert.equal(result.value, x + 10);
                });
            }],
            ["String->Number",
            function(){
                ([["3.3e10", 3.3e10], ["  10  ", 10]]).forEach(function(x) {
                    var root = $.Plus($.String(x[0]));
                    var result = interpret.evaluate(root);
                    assert.equal(result.type, 'number');
                    assert.equal(result.value, x[1]);
                });
            }],
      
        ],
    };
});
