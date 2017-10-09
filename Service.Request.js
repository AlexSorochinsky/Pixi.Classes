//-----------------------------------------------------------------------------
// Filename : Service.Request.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 14.06.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of Service methods for http requests
//-----------------------------------------------------------------------------

Class.Mixin(Service, {

	initialize: function() {

	},

	get: function(url, next){

		var req = new XMLHttpRequest();

		req.onreadystatechange = function(res) {

			if (this.readyState == 4 && this.status == 200) {

				//TODO: Get correct data, not "res.responseJSON"

				Broadcast.call("Server Data Received", [res.responseJSON]);

				next(res.responseJSON);

			}

		};

		req.open("GET", url, true);

		req.send();

	},

	post: function(url, object, next){

		var req = new XMLHttpRequest();

		req.onreadystatechange = function(event) {

			if (this.readyState == 4 && this.status == 200) {

				var result = null;

				if (req.responseJSON) result = req.responseJSON;

				else if (req.responseText && req.responseText.charAt(0) == '{') {

					try {

						result = JSON.parse(req.responseText);

					} catch(e) {

						result = null;

					}

				}

				Broadcast.call("Server Data Received", [result, req, event]);

				next(result, req, event);

			}

		};

		req.open("POST", url, true);

		req.setRequestHeader("Content-type", "application/json");

		if (_.isString(object)) {

			var o = {};

			o[object] = true;

			object = o;

		}

		req.send(JSON.stringify(object));

	}

});