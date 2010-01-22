cg.ThematicLayer = function( parent, data ) {
	this.parent = parent;
	this.map = parent.map;
	this.data = data;
	this.bbox = null;
}


cg.ThematicLayer.prototype.bounds = function() { 
	return this.bbox;
}

cg.ThematicLayer.prototype.zoomend = function( oldlevel, newlevel ) { 
	return;
}

cg.ThematicLayer.prototype.moveend = function() { 
	return;
}

cg.ThematicLayer.prototype.maptypechanged = function() { 
	return;
}

cg.ThematicLayer.prototype.render = function() { 
	return;
}

