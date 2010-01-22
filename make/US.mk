REGIONS = \
	js/regions/US/US-AK.js \
	js/regions/US/US-AL.js \
	js/regions/US/US-AR.js \
	js/regions/US/US-AZ.js \
	js/regions/US/US-CA.js \
	js/regions/US/US-CO.js \
	js/regions/US/US-CT.js \
	js/regions/US/US-DC.js \
	js/regions/US/US-DE.js \
	js/regions/US/US-FL.js \
	js/regions/US/US-GA.js \
	js/regions/US/US-HI.js \
	js/regions/US/US-IA.js \
	js/regions/US/US-ID.js \
	js/regions/US/US-IL.js \
	js/regions/US/US-IN.js \
	js/regions/US/US-KS.js \
	js/regions/US/US-KY.js \
	js/regions/US/US-LA.js \
	js/regions/US/US-MA.js \
	js/regions/US/US-MD.js \
	js/regions/US/US-ME.js \
	js/regions/US/US-MI.js \
	js/regions/US/US-MN.js \
	js/regions/US/US-MO.js \
	js/regions/US/US-MS.js \
	js/regions/US/US-MT.js \
	js/regions/US/US-NC.js \
	js/regions/US/US-ND.js \
	js/regions/US/US-NE.js \
	js/regions/US/US-NH.js \
	js/regions/US/US-NJ.js \
	js/regions/US/US-NM.js \
	js/regions/US/US-NV.js \
	js/regions/US/US-NY.js \
	js/regions/US/US-OH.js \
	js/regions/US/US-OK.js \
	js/regions/US/US-OR.js \
	js/regions/US/US-PA.js \
	js/regions/US/US-RI.js \
	js/regions/US/US-SC.js \
	js/regions/US/US-SD.js \
	js/regions/US/US-TN.js \
	js/regions/US/US-TX.js \
	js/regions/US/US-UT.js \
	js/regions/US/US-VA.js \
	js/regions/US/US-VT.js \
	js/regions/US/US-WA.js \
	js/regions/US/US-WI.js \
	js/regions/US/US-WV.js \
	js/regions/US/US-WY.js 

all: build/US.js

build/US.js: $(REGIONS) make/US.mk
	cat $(REGIONS) >> $@
	

