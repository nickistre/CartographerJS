# Cartographer.js Makefile
#
# Requires the YUI compressor
#

REGION_FILES = \
	build/US.js

REGION_MAKEFILES = \
	make/US.mk	

JS_CG_FILES = \
	js/cartographer-start.js \
	js/util/ColorSchemes.js \
	js/maps/Map.js \
	js/maps/ThematicLayer.js \
	js/maps/Bubble.js \
	js/maps/Choropleth.js \
	js/maps/Pie.js \
	js/marks/Shape.js \
	js/marks/PieMarker.js \
	js/regions/regions-start.js \
	$(REGION_FILES) \
	js/regions/regions-end.js \
	js/cartographer-end.js 

JS_FILES = \
	js/cartographer-license.js \
	$(JS_CG_FILES) 

# Run Makefiles on any regions
include $(REGION_MAKEFILES)


all: cartographer.js cartographer.min.js releases/cartographer.min.0.3.js

cartographer.js: $(JS_FILES) Makefile
	cat $(JS_FILES) > $@

cartographer.min.js: cartographer.js 
	rm -f $@
	cat js/cartographer-license.js >> $@
	cat $(JS_CG_FILES) | java -jar yuicompressor-2.4.2.jar --charset UTF-8 --type js >> $@

releases/cartographer.min.0.3.js: cartographer.min.js
	cp cartographer.min.js releases/cartographer.min.0.3.js

clean:
	rm -rf build/* cartographer.js cartographer.min.js releases/cartographer.min.0.3.js

