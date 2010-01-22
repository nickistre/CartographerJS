cg.Map = function( map, options ) {
	this.id = cg.mapCounter++,
	this.bbox = null;
	this.handlers = [];

	this.map = map;
	this.opts = cg.parseOptions( this.defaults, options ),

	// TODO: detect this dynamically, support for other map types
	this.maptype = "GMap2";

	this.init();
}

cg.Map.prototype.defaults = { 
	"colorize": "#ffffff", 
	"colorizeAlpha": 0.5,
	"autoZoom": true
};


cg.Map.prototype.init = function() { 
	var m = this;
	m.applyFilters();
	GEvent.addListener( m.map, "zoomend", function( oldLevel, newLevel ) {
		for( var i = 0, ii = m.handlers.length; i < ii; i++ ) { 
			if( m.handlers[i].zoomend && cg.callable( m.handlers[i].zoomend ) ) { 
				m.handlers[i].zoomend( oldLevel, newLevel ); 
			}
		}
	});
	GEvent.addListener( m.map, "moveend", function() {
		for( var i = 0, ii = m.handlers.length; i < ii; i++ ) { 
			if( m.handlers[i].moveend && cg.callable( m.handlers[i].moveend ) ) { 
				m.handlers[i].moveend(); 
			}
		}
	});
	GEvent.addListener( m.map, "maptypechanged", function() {
		for( var i = 0, ii = m.handlers.length; i < ii; i++ ) { 
			if( m.handlers[i].maptypechanged && cg.callable( m.handlers[i].maptypechanged ) ) { 
				m.handlers[i].maptypechanged(); 
			}
		}
	});
};

cg.Map.prototype.applyFilters = function() { 
	// only filter now is colorize
	if(!this.opts.colorize) return;

	var rects = [new GPolygon([new GLatLng(-85,0),new GLatLng(85,0),new GLatLng(85,90),new GLatLng(-85,90)],null,0,0,this.opts.colorize,this.opts.colorizeAlpha),
		new GPolygon([new GLatLng(-85,90),new GLatLng(85,90),new GLatLng(85,180),new GLatLng(-85,180)],null,0,0,this.opts.colorize,this.opts.colorizeAlpha),
		new GPolygon([new GLatLng(-85,180.000001),new GLatLng(85,180.000001),new GLatLng(85,270),new GLatLng(-85,270)],null,0,0,this.opts.colorize,this.opts.colorizeAlpha),
		new GPolygon([new GLatLng(-85,270),new GLatLng(85,270),new GLatLng(85,360),new GLatLng(-85,360)],null,0,0,this.opts.colorize,this.opts.colorizeAlpha)]
	for(var i = 0; i < rects.length; i++ ) { 
		this.map.addOverlay( rects[i] );
	}
};

cg.Map.prototype.registerHandler = function( obj ) { 
	this.handlers.push( obj );

	// zoom to the bounds of the object
	if( this.opts.autoZoom && cg.callable( obj.bounds ) ) { 
		if( !this.bbox ) { 
			this.bbox = obj.bounds();
		} else { 
			this.bbox.extend( obj.bounds().getSouthWest() );
			this.bbox.extend( obj.bounds().getNorthEast() );
		}
		this.map.setCenter( this.bbox.getCenter() );
		this.map.setZoom( this.map.getBoundsZoomLevel( this.bbox ) );
	}

	return obj;
};

/*
 * Shortcut function for making choropleths
 */
cg.Map.prototype.choropleth = function( data, options ) { 
	var options = options || {};
	return this.registerHandler( new cg.Choropleth( this, data, options ) );
};

cg.Map.prototype.chloropleth = cg.Map.prototype.choropleth;

/*
 * shortcut method for creating bubble maps
 */
cg.Map.prototype.bubble = function( data, options ) { 
	var options = options || {};
	return this.registerHandler( new cg.Bubble( this, data, options ) );
};

/*
 * shortcut for clustering/bubble maps
 */
cg.Map.prototype.cluster = function( data, options ) { 
	var options = options || {};
	options['cluster'] = true;
	return this.registerHandler( new cg.Bubble( this, data, options ) );
};

/*
 * shortcut for pie charts
 */
cg.Map.prototype.pie = function( lat, lng, radius, data, options ) { 
	return this.registerHandler( new cg.PieChart( this, new GLatLng(lat,lng), radius, data, options ) );
};

cg.Map.prototype.pies = function( ls, options ) { 
	var options = options || {};
	// ls is a list of [ lat, lng, data ] arrays.
	var defaults = { 
		"colorScheme": "Spectral",
		"colors": [],
		"reverseColors": false,
		"stroke": "#000",
		"labels": [],
		"opacity": .8
	},
	opts = cg.parseOptions( defaults, options ),
	maxsegments = 0;
			
	// Determine the pie with the most segments, 
	//  and verify its color scheme has enough colors.
	for( var i = 0; i < ls.length; i++ ) { 
		maxsegments = Math.max( maxsegments, ls[i][3].length );
	}
			
	// If the user didn't specify their own colors, 
	//  we'll pull an array of colors from the color scheme.
	if( true || !opts.colors || opts.colors.length == 0 ) { 
		opts.colors = cg.colorSchemes[ opts.colorScheme ][ Math.min( maxsegments-1, cg.colorSchemes[opts.colorScheme].length-1 ) ];
		if( opts.reverseColors ) { 
			var c = [];
			for( var i = opts.colors.length - 1; i > 0; i-- ) { 
				c.push( opts.colors[i] );
			}
			opts.colors = c;
		}
	} 
	
	for( var i = 0, ii = ls.length; i < ii; i++ ) { 
		this.pie( ls[i][0], ls[i][1], ls[i][2], ls[i][3], opts );
	}
};

