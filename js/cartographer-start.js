var Cartographer = window.Cartographer = (function() { 

/* functions/variables available throughout the namespace */

var cg = function( map, options ) { 
	return new cg.Map( map, options );
}

cg.mapCounter = 0;

cg.log = function( msg ) {
	if( window.console ) { 
		console.log( msg );
	}
};

cg.callable = function( v ) { 
	return typeof(v) == 'function';
};

cg.convert = function( min_in, max_in, min_out, max_out, val ) { 
	val = parseFloat( Math.min( max_in, Math.max( min_in, val ) ) )
	return parseFloat( val - min_in ) / parseFloat( max_in - min_in ) * ( max_out - min_out ) + min_out;
};

cg.parseOptions = function( defaults, inputs ) { 
	if(inputs) { 
		var rtn = {};
		for( validOption in defaults ) {  
			if( inputs.hasOwnProperty( validOption ) ) { 
				rtn[ validOption ] = inputs[ validOption ];
			} else {
				rtn[ validOption ] = defaults[ validOption ];
			}
		}
		return rtn;
	}
	return defaults;
};

/* Inheritance.
 * see http://javascript.crockford.com/prototypal.html
 *
 * To extend an existing object:
 *  // assume class cg.ObjectA is defined
 *  cg.ObjectB = function() { cg.ObjectA.call(this); }
 *  cg.ObjectB.prototype = cg.extend( cg.ObjectA );
 *
 */
cg.extend = function(f) {
	function g() {}
	g.prototype = f.prototype || f;
	return new g();
};

