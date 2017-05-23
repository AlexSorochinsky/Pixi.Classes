//-----------------------------------------------------------------------------
// Filename : Mraid.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 11.08.16
// Require: 
//-----------------------------------------------------------------------------
// Simple utility for MRAID (Mobile Rich Media Ad Interface Definitions) apps development
//-----------------------------------------------------------------------------

var MRAID = {

	targetURL: '',

	start: function(is_show_logger) {

		if (is_show_logger) this.showLogger();

		this.setup();

		this.checkReady(function() {

			if (window.mraidReady) window.mraidReady();

			else MRAID.showApp();

		});

	},

	setup: function() {

		this.isMRAID = (typeof mraid == 'object');

		this.isTouchDevice = (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

		this.log('MRAID.isMRAID', this.isMRAID);

		this.log('MRAID.isTouchDevice', this.isTouchDevice);

		this.setupViewport();

		this.setupCharset();

		this.setupCss();

	},

	setupViewport: function() {

		this.log('Setup viewport...');

		var element = document.querySelector("meta[name=viewport]");

		if (!element) {

			element = document.createElement("meta");

			element.name = "viewport";
			element.content = "width=device-width,initial-scale=1,maximum-scale=1";

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.content = "width=device-width,initial-scale=1,maximum-scale=1";

		}

	},

	setupCharset: function() {

		this.log('Setup charset...');

		var element = document.querySelector("meta[charset]");

		if (!element) {

			element = document.createElement("meta");

			element.setAttribute("charset", "UTF-8");

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.charset = "UTF-8";

		}

	},

	setupCss: function() {

		this.log('Setup css...');

		var style = document.createElement("style");
		style.appendChild(document.createTextNode(
			"html, body {" +
			"width: 100%;" +
			"height: 100%;" +
			"padding: 0;" +
			"margin: 0;" +
			"overflow: hidden;" +
				"font-family: \"Verdana\", \"Droid Sans\"" +
			"}"
		));

		document.head.appendChild(style);

	},

	checkReady: function (next) {

		this.log('checkReady');

		var readyStateCheckInterval = setInterval(function () {

			if (document.readyState === "complete") {

				MRAID.log('document.readyState === "complete"');

				clearInterval(readyStateCheckInterval);

				MRAID._domReady = true;

				MRAID._checkReady(next);

			}

		}, 10);

		if (this.isMRAID) {

			if (mraid.getState() == 'loading') {

				mraid.addEventListener("ready", function () {

					MRAID.log('mraid ready');

					mraid.removeEventListener("ready", arguments.callee);

					MRAID._mraidReady = true;

					MRAID._checkReady(next);

				});

			} else {

				this._mraidReady = true;

				this._checkReady(next);

			}

		} else {

			this._mraidReady = true;

			this._checkReady(next);

		}

	},

	_checkReady: function (next) {

		if (this._mraidReady && this._domReady) {

			if (next) next();

		}

	},

	showApp: function() {

		if (this.isMRAID) {

			mraid.addEventListener("stateChange", function (state) {

				MRAID.log('mraid stateChange', state);

				Broadcast.call("MRAID State Changed");

			});

			if (mraid.usecustomclose) mraid.usecustomclose(true);

			if (mraid.useCustomClose) mraid.useCustomClose(true);

		}

		setTimeout(function() {

			MRAID.isCloseButtonShowed = true;

			Broadcast.call("MRAID Show Close Button");

		}, 5000);

		App.start();

	},

	close: function() {

		if (this.isMRAID) mraid.close();

		else alert('Close!');

	},

	open: function() {

		if (this.isMRAID) mraid.open(this.targetURL);

		else alert('Open: ' + this.targetURL);

	},

	log: function() {

		if (typeof console == 'object') console.log.apply(console, Array.prototype.slice.call(arguments));

	},

	showLogger: function() {

		document.getElementsByTagName('html')[0].setAttribute('debug', 'true');

		var element = document.createElement("script");

		element.setAttribute("src", "https://getfirebug.com/firebug-lite.js");

		document.getElementsByTagName('head')[0].appendChild(element);

	}

};