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

	var cl = function(props_2) {

		var instance = this,
			props, i, m;

		for (var i in props_1) if (props_1.hasOwnProperty(i) && i !== 'initialize') {

			instance[i] = props_1[i];

		}

		for (m = 0; cl._mixins[m]; m++) {

			props = cl._mixins[m];

			for (i in props) if (props.hasOwnProperty(i) && i !== 'initialize') {

				instance[i] = props[i];

			}

		}

		for (i in props_2) if (props_2.hasOwnProperty(i) && i !== 'initialize') {

			instance[i] = props_2[i];

		}

		if (props_1.initialize) props_1.initialize.apply(instance, arguments);

		for (m = 0; cl._mixins[m]; m++) {

			props = cl._mixins[m];

			if (props.initialize) props.initialize.apply(instance, []);

		}

	};

	return cl;

};

Class.Mixin = function(target, properties) {

	if (!target._mixins) target._mixins = [];

	target._mixins.push(properties);

	return properties;

};
