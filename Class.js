//-----------------------------------------------------------------------------
// Filename : Class.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: underscore.js
//-----------------------------------------------------------------------------
// Javascript classes constructor
//-----------------------------------------------------------------------------

var Class = function(props_1) {

	return function(props_2) {

		for (var i in props_1) if (props_1.hasOwnProperty(i) && i != 'initialize') {

			this[i] = props_1[i];

		}

		for (i in props_2) if (props_2.hasOwnProperty(i) && i != 'initialize') {

			this[i] = props_2[i];

		}

		if (props_1.initialize) props_1.initialize.apply(this, arguments);

	};

};