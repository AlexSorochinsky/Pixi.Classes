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

	start: function(is_show_logger) {

		if (is_show_logger) this.showLogger();

		this.setup();

		this.checkReady(function() {

			if (this.isMRAID) {

				if (mraid.isViewable){

					mraid.addEventListener("viewableChange", function (is_viewable) {

						MRAID.isViewable = is_viewable;

						if (MRAID.isViewable) Broadcast.call("MRAID Viewable");
						else Broadcast.call("MRAID Hidden");

					});

					MRAID.isViewable = mraid.isViewable();

					if (MRAID.isViewable) Broadcast.call("MRAID Viewable");
					else Broadcast.call("MRAID Hidden");

				} else {

					mraid.addEventListener("stateChange", function (state) {

						MRAID.isViewable = state !== "hidden";

						if (MRAID.isViewable) Broadcast.call("MRAID Viewable");
						else Broadcast.call("MRAID Hidden");

					});

					MRAID.isViewable = mraid.getState() !== "hidden";

					if (MRAID.isViewable) Broadcast.call("MRAID Viewable");
					else Broadcast.call("MRAID Hidden");

				}

			}

			Broadcast.call("MRAID Ready");

		});

	},

	setup: function() {

		this.isMRAID = (typeof mraid === 'object');

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
			element.content = "width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.content = "width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover";

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

		var readyStateCheckInterval = setInterval(function () {

			if (document.readyState === "complete") {

				MRAID.log('document.readyState === "complete"');

				clearInterval(readyStateCheckInterval);

				MRAID._domReady = true;

				MRAID._checkReady(next);

			}

		}, 10);

		if (this.isMRAID) {

			if (mraid.getState() === 'loading') {

				mraid.addEventListener("ready", function () {

					mraid.removeEventListener("ready", arguments.callee);

					MRAID._mraidReady = true;

					//On some SDK it works only after mraid ready
					if (Settings["custom-close-button"]) {

						if (mraid.usecustomclose) mraid.usecustomclose(true);

						if (mraid.useCustomClose) mraid.useCustomClose(true);

						if (mraid.setExpandProperties) mraid.setExpandProperties({"useCustomClose":true});

					}

					MRAID._checkReady(next);

				});

			} else {

				this._mraidReady = true;

				//On some SDK it works only after mraid ready
				if (Settings["custom-close-button"]) {

					if (mraid.usecustomclose) mraid.usecustomclose(true);

					if (mraid.useCustomClose) mraid.useCustomClose(true);

					if (mraid.setExpandProperties) mraid.setExpandProperties({"useCustomClose":true});

				}

				this._checkReady(next);

			}

		} else {

			this._mraidReady = true;

			this._checkReady(next);

		}

	},

	_checkReady: function (next) {

		if (this._mraidReady && this._domReady) {

			this.isReady = true;

			if (next) next.call(MRAID);

		}

	},

	showApp: function() {

		if (this.isMRAID) {

			mraid.addEventListener("stateChange", function (state) {

				MRAID.log('mraid stateChange', state);

				Broadcast.call("MRAID State Changed");

			});

		}

		if (Settings["custom-close-button"]) {

			setTimeout(function () {

				MRAID.isCloseButtonShowed = true;

				Broadcast.call("MRAID Show Close Button");

			}, Settings["custom-close-button"]);

		}

	},

	close: function() {

		if (this.isMRAID) mraid.close();

		else if (Settings["web-mode"] === 'alert') alert('Close!');

		else if (Settings["web-mode"] === 'redirect') window.close();

	},

	open: function() {

		if (this.isMRAID) mraid.open(Settings["target-url"]);

		else if (Settings["web-mode"] === 'alert') alert('Open: ' + Settings["target-url"]);

		else if (Settings["web-mode"] === 'redirect') window.location.href = Settings["target-url"];

	},

	log: function() {

		if (typeof console === 'object') console.log.apply(console, Array.prototype.slice.call(arguments));

	},

	showLogger: function() {

		document.getElementsByTagName('html')[0].setAttribute('debug', 'true');

		var element = document.createElement("script");

		element.setAttribute("src", "https://getfirebug.com/firebug-lite.js");

		document.getElementsByTagName('head')[0].appendChild(element);

	},

	processSettings: function(settings) {

		settings['start-time'] = Date.now();

		for (var key in settings) if (settings.hasOwnProperty(key)) {

			var data = settings[key];

			if (data && data.type) settings[key] = ('value' in data) ? data.value : data.default;

			else settings[key] = data;

			settings[key].data = data;

		}

	}

};