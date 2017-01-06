//-----------------------------------------------------------------------------
// Filename : Service.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 08.06.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Service class for server-side requests and business logic
//-----------------------------------------------------------------------------

var Service = function(properties) {

	var _class = new Class(properties);

	var instance = new _class(Service.prototype);

	if (!instance.Actions) instance.Actions = {};

	Broadcast.on('Server Data Received', function(data) {

		this.checkAction(data);

	}, instance);

	return instance;

};

Service.prototype = {

	checkAction: function(data) {

		_.each(this.Actions, function(fn, key) {

			if (key in data) fn.apply(this, [data[key], data]);

		}, this);

	}

};
