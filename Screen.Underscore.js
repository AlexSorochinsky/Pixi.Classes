//-----------------------------------------------------------------------------
// Filename : Screen.Underscore.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 25.11.2017
// Require: Screen.js
//-----------------------------------------------------------------------------
// Utility functions for Screens
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function() {

		this.uniqueIds = {};

	},

	bind: function(fn) {

		var _this = this;

		return function() {

			fn.apply(_this, arguments);

		};

	},

	timeout: function(fn, time) {

		return setTimeout(this.bind(fn), time);

	},

	each: function(obj, fn, context) {

		if (!obj) return;

		var i;

		if (this.isArray(obj)) {

			for (i = 0; i < obj.length; i++) {

				fn.call(context || this, obj[i], i);

			}

		} else {

			for (i in obj) if (obj.hasOwnProperty(i)) {

				fn.call(context || this, obj[i], i);

			}

		}

	},

	contains: function(array, obj) {

		if (!array) return false;

		var i = array.length;

		while (i--) {

			if (array[i] === obj) {

				return true;

			}

		}

		return false;

	},

	difference: function(array, exclude) {

		return this.filter(array, function(value) {

			return !this.contains(exclude, value);

		});

	},

	without: function() {

		return this.difference(arguments[0], Array.prototype.slice.call(arguments).slice(1));

	},

	indexBy: function(array, key) {

		var result = {};

		this.each(array, function(value) {

			result[value[key]] = value;

		});

		return result;

	},

	isObject: function(obj) {

		return typeof obj === 'object' && obj !== null && !(obj instanceof Array);

	},

	isArray: function(obj) {

		return obj instanceof Array;

	},

	extend: function(obj1, obj2) {

		this.each(obj2, function(value, key) {

			obj1[key] = value;

		});

		return obj1;

	},

	merge: function(out) {

		out = out || {};

		for (var i = 1, len = arguments.length; i < len; ++i) {

			var obj = arguments[i];

			if (!obj) {
				continue;
			}

			for (var key in obj) {

				if (!obj.hasOwnProperty(key)) {
					continue;
				}

				if (this.isObject(obj[key])) {
					out[key] = this.merge(out[key], obj[key]);
					continue;
				}

				out[key] = obj[key];

			}

		}

		return out;

	},

	filter: function(array, fn) {

		var result = [];

		this.each(array, function(value, key) {

			if (fn.call(this, value, key)) result.push(value);

		});

		return result;

	},

	sample: function(array) {

		if (!array) return null;

		if (!this.isArray(array)) array = this.values(array);

		return array[Math.floor(Math.random() * array.length)];

	},

	pluck: function(obj, key) {

		var result = [];

		this.each(obj, function(value) {

			result.push(value[key]);

		});

		return result;

	},

	shuffle: function(array) {

		array = array.concat([]);

		var j, x, i;

		for (i = array.length - 1; i > 0; i--) {
			j = Math.floor(Math.random() * (i + 1));
			x = array[i];
			array[i] = array[j];
			array[j] = x;
		}

	},

	random: function(min, max) {

		return Math.floor(Math.random() * (max - min + 1)) + min;

	},

	isEqual: function(arr1, arr2) {

		var result = arr1 && arr2 && arr1.length === arr2.length;

		if (!result) return false;

		for (var i = arr1.length - 1; i >= 0; i--) {

			if (arr1[i] !== arr2[i]) result = false;

		}

		return result;

	},

	values: function(obj) {

		var result = [];

		this.each(obj, function(value) {

			result.push(value);

		});

		return result;

	},

	uniqueId: function(name) {

		if (!this.uniqueIds[name]) this.uniqueIds[name] = 0;

		return (name || '') + this.uniqueIds[name]++;

	}

}); 
