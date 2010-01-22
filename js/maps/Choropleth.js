/*
 * Constructor
 * @param data List of objects: [{"region":<region-code>, "val:<value>}]
 */
cg.Choropleth = function( parent, data, options ) {
	var options = options || {};

	// inherit from ThematicLayer
	cg.ThematicLayer.call( this, parent, data );

	this.opts = cg.parseOptions( this.defaults, options );
	this.dataMin = 0;
	this.dataMax = 0;

	this.init();
};

/*
 * Extend ThematicLayer base class
 */
cg.Choropleth.prototype = cg.extend( cg.ThematicLayer );

cg.Choropleth.prototype.defaults = { 
	"colorScheme": "Spectral",
	"colors": [],
	"reverseColors": false
};

/*
 * Initialize
 */
cg.Choropleth.prototype.init = function() { 
	// TODO: better error handling
	if( this.data.length < 1 ) { return; }

	var d = this.data;

	if( this.opts.colors.length == 0 ) { 
		var schemeSet = cg.colorSchemes[ this.opts.colorScheme ];
		this.opts.colors = schemeSet[ Math.min( d.length-1, schemeSet.length-1 ) ];
		if( this.opts.reverseColors ) { 
			var c = [];
			for( var i = this.opts.colors.length - 1; i > 0; i-- ) { 
				c.push( this.opts.colors[i] );
			}
			this.opts.colors = c;
		}
	}
	this.dataMin = this.dataMax = d[0].val;

	for( var i = 0; i < d.length; i++ ) { 
		this.dataMax = Math.max(d[i].val, this.dataMax);
		this.dataMin = Math.min(d[i].val, this.dataMin);
	}

	this.render();
};

cg.Choropleth.prototype.createPolygon = function( item ) {
	// TODO: error handling
	var regions = cg.regions;
	if( !regions[ item.region] ) { return null; }

	var shape, center, polylines, item, polygon, color;

	shape = regions[ item.region ];
	center = shape.center;
	polylines = shape.polylines;
	color = this.opts.colors[ parseInt( Math.floor( cg.convert( this.dataMin, this.dataMax, 0, this.opts.colors.length - 1, item.val ) ) ) ];
	
	for( var j = 0; j < polylines.length; j++ ) { 
		polylines[j].color = color;
		polylines[j].opacity = .7;
		polylines[j].weight = 2;
	}
	polygon = new GPolygon.fromEncoded({
		"polylines": polylines,
		"fill": true,
		"color": color,
		"opacity": .7,
		"outline": color
	});
	GEvent.addListener( polygon, "mouseover", function() {}); // we do this to ensure a "pointer" cursor
	GEvent.addListener( polygon, "click", function() { 
		var html = "<div class='cartographer-balloon' style='height:60px;margin:0 14px 0 0;max-height:100px;overflow:auto;'>";
		html += "<strong>" + (( item.label ) ? item.label : shape.name) + "</strong><br/>Value: " + item.val + "</div>"; 
		this.map.openInfoWindowHtml( new GLatLng(center.lat, center.lng), html );
	});
	return polygon;
};

cg.Choropleth.prototype.render = function() { 
	var d = this.data;
	for( var i = 0; i < d.length; i++ ) { 
		var polygon = this.createPolygon( d[i] );
		if( polygon ) { 
			this.map.addOverlay( polygon );
			if( !this.bbox ) { 
				this.bbox = polygon.getBounds();
			} else { 
				this.bbox.extend( polygon.getBounds().getNorthEast() );
				this.bbox.extend( polygon.getBounds().getSouthWest() );
			}
		}
	} 
};

