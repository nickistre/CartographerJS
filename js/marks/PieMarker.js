PieMarker = function( point, radius, values, labels, colors, options ) { 
	Shape.call( this, point, radius, options );
	this.values = values;
	this.labels = labels;
	this.colors = colors;
	// this.constructor( point, radius, options );
};

PieMarker.prototype = cg.extend( Shape );

PieMarker.prototype.makeNode = function() { 
	var div = document.createElement("div");
	div.style.position = "absolute";
	this.paper = Raphael( div, this.radius*2.2, this.radius*2.2 ); // compensate for expanding, animation 
	var c = this.paper.pieChart( this.radius*1.1, this.radius*1.1, this.radius-1, this.values, this.labels, this.colors, this.opts.stroke, this.opts.animate );
	this.div_ = div;
	return c;
};

Raphael.fn.pieChart = function( cx, cy, r, values, labels, colors, stroke, animate ) {
	var radius = r;
	if( animate ) { 
		 radius = r * .5;
	}
	var paper = this,
	rad = Math.PI / 180,
	chart = this.set(),
	angle = 0,
	total = 0,
	start = 0,
	sector = function( cx, cy, r, startAngle, endAngle, params ) {
		var x1 = cx + r * Math.cos( -startAngle * rad ),
		x2 = cx + r * Math.cos( -endAngle * rad ),
		y1 = cy + r * Math.sin( -startAngle * rad ),
		y2 = cy + r * Math.sin( -endAngle * rad );
		return paper.path( ["M", cx, cy, "L", x1, y1, "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, "z"] ).attr( params );
	},
	process = function( j ) {
		var value = values[ j ],
		label = labels[ j ],
		angleplus = 360 * value / total,
		popangle = angle + ( angleplus / 2 ),
		color = colors[ i ],
		bcolor = Raphael.rgb2hsb(color),
		ms = 500,
		delta = 30,
		tooltip = null,
		p = sector( cx, cy, radius, angle, angle + angleplus, { 
			gradient:"90-hsb(" + bcolor.h + "," + bcolor.s + "," + Math.max(0,bcolor.b-.20) + ")-" + color, stroke: stroke, "stroke-width": 1
		});
		p.mouseover(function (e ) {
			if( animate ) { 
				p.animate( { scale: [2.1,2.2,cx,cy]}, ms, "elastic" );
			} else { 
				p.animate({scale: [1.1, 1.1, cx, cy]}, ms, "elastic");
			}
			/*
			if( tooltip ) { tooltip.show(); } 
			else { tooltip = paper.text(10,10, ( label && label.length > 0 ) ? ( label + ": " ) : "" + value).attr({font: '12px Fontin-Sans, Arial', fill: "#000", }); }
			*/
		}).mouseout(function () {
			if( animate ) { 
				p.animate( { scale: [2,2,cx,cy]}, ms, "elastic" );
			} else { 
				p.animate({scale: [1, 1, cx, cy]}, ms, "elastic");
			}
			/*
			if( tooltip ) { tooltip.hide(); }
			*/
		});
		p.node.title = "Value: " + value;
		angle += angleplus;
		chart.push(p);
		start += .1;
	};
	for( var i = 0, ii = values.length; i < ii; i++ ) {
		total += values[ i ];
	}
	for( var i = 0; i < ii; i++ ) {
		process( i );
	}
	if( animate ) { 
		chart.animate( { scale:[2,2,cx,cy] }, 2000, ">" );
	}
	return chart;
};
