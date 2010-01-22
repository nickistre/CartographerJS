cg.PieChart = function( parent, point, radius, data, options ) { 
	var options = options || {};
	cg.ThematicLayer.call( this, parent, data );

	this.opts = cg.parseOptions( this.defaults, options );
	this.point = point;
	this.radius = radius;
	this.scaledRadius = radius;
	this.bbox = new GLatLngBounds( point ),
	this.marker = null;
	this.init();
};

/*
 * Extend ThematicLayer base class
 */
cg.PieChart.prototype = cg.extend( cg.ThematicLayer );

cg.PieChart.prototype.defaults = { 
	"colors": cg.colorSchemes.Spectral[ cg.colorSchemes.Spectral.length - 1 ],
	"stroke": "#000",
	"labels": [],
	"opacity": .8 
};

cg.PieChart.prototype.init = function() { 
	this.render();
};

cg.PieChart.prototype.render = function() {
	this.scaledRadius = .01 * this.radius * Math.pow( 2, this.map.getZoom() ); 
	this.marker = new PieMarker( this.point, this.scaledRadius, this.data, this.opts.labels, this.opts.colors, this.opts );
	this.map.addOverlay( this.marker );
	return this.marker;
};

cg.PieChart.prototype.zoomend = function( oldLevel, newLevel ) { 
	this.map.removeOverlay(this.marker);
	this.render();
};

