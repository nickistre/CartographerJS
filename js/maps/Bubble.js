
/*
 * Little class for helping with the Cluster grids
 */
cg.ClusterGridCell = function( parent ) { 
	this.parent = parent;
	this.val = 0;
	this.items = [];
	this.rendered = false;
	this.lat = 0;
	this.lng = 0;
};

cg.ClusterGridCell.prototype.push = function( val, item, lat, lng ) {
	if( this.parent.opts.average && this.parent.opts.enableDots ) { 
		this.lat = ((this.lat * this.val) + ( lat * val )) / ( val + this.val );
		this.lng = ((this.lng * this.val) + ( lng * val )) / ( val + this.val );
	}
	this.val = this.parent.opts.combine( this.val, val );
	this.items.push( item );
};


/*
 * Bubble maps also known as proportional-symbol maps.
 * Supports grid-based clustering to group data points into dynamically-sized symbols.
 * 
 * @parent the parent Cartographer.Map object
 *
 */
cg.Bubble = function( parent, data, options ) { 
	var options = options || {};
	cg.ThematicLayer.call( this, parent, data );
	this.opts = cg.parseOptions( this.defaults, options );

	this.overlays = [];
	this.currMax = 0;
	this.convertedMax = 0; 
	this.gridsize = 20; // dynamically scaled based on the current zoom level of the map
	this.grid = [[]]; // lats then lngs, 2d array

	this.latMin = null;
	this.latMax = null;
	this.lngMin = null;
	this.lngMax = null;
	this.gridLatMin = null;
	this.gridLatMax = null;
	this.gridLngMin = null;
	this.gridLngMax = null;

	// we don't redraw if the map hasn't
	// actually moved even when a move event is fired
	this.lastMapBounds = null;

	this.init();
}

cg.Bubble.prototype = cg.extend( cg.ThematicLayer );


cg.Bubble.prototype.defaults = { 
	"enableDots": true,
	"enableGrid": false,
	"combine": function(a,b) { return a + b; },
			
	// colors for dots
	"color": "#fc8d59",
	"stroke": "#000",
	"colorHover": "#ffffbf",
	"colorActive": "#ffffbf",
	"opacity":0.8,
			
	// grid
	"gridColor":"#5e4fa2",
	"gridSize": 24.0,

	// whether or not to average location of grid circle
	// TODO support other clustering strategies
	"average": true, 

	// how to display data in popups,
	"popup": "all", // or "reduce" [DEPRECATED]
	"popupLabel": "Value:", // for "reduce" [DEPRECATED]
	"balloon": function( obj ) { return obj.parent.createDefaultBalloon(obj) } // func with one arg, the data-cell

};

cg.Bubble.prototype.init = function() { 
	var zoom = this.map.getZoom();
	this.buildGrid( zoom );

	// the render() method will be called by this.placeGroups()
	this.placeGroups();
};

cg.Bubble.prototype.boundsToGrid = function( zoomlevel ) { 
	var sw = this.map.getBounds().getSouthWest();
	var ne = this.map.getBounds().getNorthEast();
	var sw_snap = this.snapToGrid( sw.lat(), sw.lng() );
	var ne_snap = this.snapToGrid( ne.lat(), ne.lng() );
	this.latMax = ne.lat();
	this.latMin = sw.lat();
	this.lngMax = ne.lng();
	this.lngMin = sw.lng();
	this.gridLatMax = ne_snap[0] + (2 * this.gridsize);
	this.gridLatMin = sw_snap[0];
	this.gridLngMax = ne_snap[1] + (2 * this.gridsize);
	this.gridLngMin = sw_snap[1];
};

cg.Bubble.prototype.buildGrid = function( zoom ) { 
	var b = this;
	this.grid = [];
	this.gridsize = this.opts.gridSize / Math.pow( 2, zoom ); 
	this.boundsToGrid();
	this.loopGrid( 
		function( i, j ) { 
			b.grid[ i ][ j ] = new cg.ClusterGridCell( b ); 
		}, 
		function( i ) { 
			b.grid[ i ] = []; 
		}); 
};

cg.Bubble.prototype.clearMarkers = function() { 
	for( var i = 0; i < this.overlays.length; i++ ) {
		try { 
			this.map.removeOverlay( this.overlays[ i ] );
		} catch( e ) { 
			cg.log( "Error: cg.Bubble.prototype.clearMarkers() " + e );
		}
	}
	this.overlays = [];
};

cg.Bubble.prototype.createDefaultBalloon = function( cell ) {
	// creates a balloon with HTML for multiple items
	var rtn = "<div class='cartographer-balloon' style='height:100px;max-height:100px;overflow:auto;'>";
	var item = null;
	if( this.opts.popup == "all" ) { // for legacy code; DEPRECATED 
		rtn += "<ol>";
		for( var i = 0; i < cell.items.length; i++ ) { 
			rtn += "<li>";
			item = cell.items[i];
			if( item.label ) { 
				rtn += item.label + ": ";	
			} 
			rtn += item.val;
			rtn += "</li>";
		}
		rtn += "</ol>";
	} else { // for legacy code; DEPRECATED
		rtn += this.opts.popupLabel + " " + cell.val;
	}
	return rtn + "</div>";
};

cg.Bubble.prototype.createMarker = function( point, val, label ) { 
	var convertedVal = Math.sqrt( (1+val) * 100.0 / Math.PI );
	convertedVal = cg.convert( 1, this.convertedMax, 2, this.opts.gridSize * .5, convertedVal );
	var marker = new Shape( point, convertedVal, { 
		"infoWindow": label, 
		"color": this.opts.color, 
		"stroke": this.opts.stroke, 
		"colorHover": this.opts.colorHover, 
		"colorActive": this.opts.colorActive, 
		"opacity": this.opts.opacity,
		"zIndexProcess": function() { return 10 + this.currMax - val; }
	});
	return marker;
};

cg.Bubble.prototype.createRect = function( sw, ne, val ) { 
	var gborder = [];
	var nw = new GLatLng( ne.lat(), sw.lng() );
	var se = new GLatLng( sw.lat(), ne.lng() );
	gborder.push( se );
	gborder.push( sw );
	gborder.push( nw );
	gborder.push( ne );
	gborder.push( se );
	var color = this.opts.gridColor; 
	var polygon = new GPolygon( gborder, color, 1, .3, color, Math.max( .1, Math.min( val * .1, .70 ) ) );
	return polygon;
};

cg.Bubble.prototype.loopGrid = function( cellFn, rowFn ) {
	var idl = ( this.lngMax < this.lngMin );
	var idlLngMax = this.snapToGrid( 0, 180 )[ 1 ]; 
	var idlLngMin = this.snapToGrid( 0, -180 )[ 1 ]; 
	if( !idl ) {
		for( var i = this.gridLatMin; i < this.gridLatMax; i++ ) {
			if( rowFn ) { 
				rowFn( i ); 
			}
			for( var j = this.gridLngMin; j < this.gridLngMax; j++ ) {
				cellFn( i, j );
			}
		}
	} else {
		// International Date Line foo
		for( var i = this.gridLatMin; i < this.gridLatMax; i++ ) {
			if( rowFn ) { 
				rowFn( i ); 
			}
			for( var j = idlLngMin; j < this.gridLngMax; j++ ) {
				cellFn( i, j );
			}
			for( var k = this.gridLngMin; k < this.idlLngMax; k++ ) {
				cellFn( i, k );
			}
		}
	}
};

cg.Bubble.prototype.placeGroups = function() { 
	var forceDirty = false;
	var lastCycleMax = this.currMax;
	for( var k = 0; k < this.data.length; k++ ) {
		var lat = this.data[ k ].lat;
		var lng = this.data[ k ].lng;
		if( !( this.latMin <= lat && this.latMax >= lat && 
		       ( ( this.lngMin <= lng && this.lngMax >= lng ) 
		         // check for wrap on International Date Line
		         || ( this.lngMin > this.lngMax && ( ( this.lngMin <= lng && lng <= 180 ) || ( this.lngMax >= lng && lng > -180 ) ) ) 
			  ) 
			) 
		  ) 
		{
			continue;
		} 
		try {
			// only place the item if that grid cell hasn't been rendered
			var snap = this.snapToGrid( lat, lng );
			if( !this.grid[ snap[0] ][ snap[1] ].rendered ) {  // "rendered" flag
				this.grid[ snap[0] ][ snap[1] ].push( 
					this.data[k].val, this.data[k], this.data[k].lat, this.data[k].lng 
				);
				this.currMax = Math.max( this.grid[ snap[0] ][ snap[1] ].val, this.currMax );
			}
		}
		catch( e ) { cg.log( "Snap error at " + snap + " Error:" + e ); }
	}

	// for items that are dynamically scaled... 
	if( lastCycleMax < this.currMax ) { 
		this.buildGrid( this.map.getZoom() );
		if( this.placeGroups() ) {
			this.render( true );
		}
		return false;
	}
	return true;
};

cg.Bubble.prototype.render = function( clear ) {
	// only draw if the map bounds have changed
	if(this.lastMapBounds != null && this.lastMapBounds.equals(this.map.getBounds())) { 
		return;	
	}
	this.lastMapBounds = this.map.getBounds();
	var point, val, html, marker, rendered, cell;
	var b = this;
	if( clear ) { 
		b.clearMarkers();
	}
	b.convertedMax = parseInt( Math.sqrt( (1 + b.currMax) * 100.0 / Math.PI ) );

	this.loopGrid( function( i, j ) { 
		cell = b.grid[ i ][ j ];
		rendered = cell.rendered;
		val = cell.val;
		if( val > 0 && ( !rendered || clear ) ) {
			var sw = new GLatLng( i * b.gridsize - 90, j * b.gridsize - 180 );
			var ne = new GLatLng( (i+1) * b.gridsize - 90, (j+1) * b.gridsize - 180 );
			if(!b.bbox) { 
				b.bbox = new GLatLngBounds( sw, ne );
			} else { 
				b.bbox.extend( sw );
				b.bbox.extend( ne );
			}
			if( b.opts.enableDots ) { 
				if( b.opts.average ) { 
					point = new GLatLng( cell.lat, cell.lng );
				} else {
					point = new GLatLng( ( i + .5 ) * b.gridsize - 90, ( j + .5 ) * b.gridsize - 180 );
				}
				html = b.opts.balloon( cell ); //b.createBalloon( cell.labels, val );
				marker = b.createMarker( point, val, html ); 
				b.map.addOverlay( marker );
				b.overlays.push( marker );
			} 
			if( b.opts.enableGrid ) { 
				polygon = b.createRect( sw, ne, val );
				b.map.addOverlay( polygon );
				b.overlays.push( polygon );
			}
			b.grid[ i ][ j ].rendered = true; // set "rendered" flag
		} 
	});	
};

cg.Bubble.prototype.snapToGrid = function( lat, lng ) { 
	// returns [i,j] indicating grid indices
	// var ki = parseInt( 180.0 / this.gridsize );
	// var kj = parseInt( 360.0 / this.gridsize );
	// while( lat < ( ki * this.gridsize ) - 90 ) { ki--; } 
	// while( lng < ( kj * this.gridsize ) - 180 ) { kj--; } 
	// return [ ki, kj ]; 
	lat = (lat) + 90.0;
	lng += 180.0;
	return [ parseInt((lat - ( lat % this.gridsize )) / this.gridsize), 
			parseInt((lng - ( lng % this.gridsize )) / this.gridsize) ];
};

cg.Bubble.prototype.updateGrid = function() { 
	var b = this;
	// only add new grid components, don't push the reset button
	b.boundsToGrid();
	this.loopGrid( function( i, j ) { 
			if( typeof( b.grid[ i ][ j ] ) != "object" ) {
				b.grid[ i ][ j ] = new cg.ClusterGridCell( b ); 
			}
		}, 
		function( i ) { 
			if( typeof( b.grid[ i ] ) != "object" ) { 
				b.grid[ i ] = [];
			} 
		} 
	); 
};

cg.Bubble.prototype.zoomend = function( oldLevel, newLevel ) { 
	this.currMax = 0;
	this.buildGrid( newLevel );
	this.placeGroups(); 
	this.render( true );
};

cg.Bubble.prototype.moveend = function() { 
	this.updateGrid();
	if( this.placeGroups() ) { 
		this.render( false );
	}
};

