//-----------------------------------------------------------------------------
// Filename : Service.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 08.06.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Service class for server-side requests and business logic
//-----------------------------------------------------------------------------

var Service = new Class({

	initialize: function() {

		if (!this.Actions) this.Actions = {};

	Broadcast.on('Server Data Received', function(data) {

		this.checkAction(data);

		}, this);

	},

	checkAction: function(data) {

		_.each(this.Actions, function(fn, key) {

			if (key in data) fn.apply(this, [data[key], data]);

		}, this);

	}

});
