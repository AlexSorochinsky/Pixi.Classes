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

			MRAID.isReady = true;

			Broadcast.call("MRAID Ready");

			if (MRAID.isMRAID) {

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

			} else {

				setTimeout(function() {

					MRAID.isViewable = true;

					Broadcast.call("MRAID Viewable");

				}, 1000);

			}

		});

		window.onerror = function(message, url, line) {

			MRAID.track("Errors", "Error: " + message + ' Url: ' + url + ' Line: ' + line);

			window.onerror = null;

		}

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

			if (next) next.call(MRAID);

		}

	},

	onReady: function(next) {

		if (MRAID.isReady) {

			next();

		} else {

			Broadcast.once('MRAID Ready', function () {

				next();

			}, this);

		}

	},

	onViewable: function(next) {

		if (MRAID.isViewable) {

			next();

		} else {

			Broadcast.once('MRAID Viewable', function () {

				next();

			}, Date.now() + '');

		}

	},

	showApp: function() {

		this.createCloseButton();

		if (this.isMRAID) {

			mraid.addEventListener("stateChange", function (state) {

				MRAID.log('mraid stateChange', state);

				Broadcast.call("MRAID State Changed");

			});

		}

		if (Settings["custom-close-button"] && !Settings["interstitial-timeout"]) {

			setTimeout(function () {

				MRAID.showCloseButton();

			}, Settings["custom-close-button"]);

		}

	},

	close: function() {

		if (this.isMRAID || Settings["web-mode"] === 'mraid') mraid.close();

		else if (Settings["web-mode"] === 'alert') alert('Close!');

		else if (Settings["web-mode"] === 'redirect') window.close();

	},

	open: function() {

		console.log('MRAID.open()', Settings["target-url"], this.isMRAID, Settings["web-mode"]);

		if (this.isMRAID || Settings["web-mode"] === 'mraid') mraid.open(Settings["target-url"]);

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

	},

	createCloseButton: function(){

		var container = this.closeButtonContainer = document.createElement("div");
		container.className = "mraid-close-button-container";
		document.body.appendChild(container);

		var close_button = this.closeButtonEl = document.createElement("div");
		close_button.className = "mraid-close-button";
		container.appendChild(close_button);

		close_button.addEventListener("click", function () {

			MRAID.track('Main Events', 'Close click - Gameplay');

			MRAID.track('Main Events', 'Close click');

			MRAID.close();

		});

		var style = document.createElement("style");
		style.appendChild(document.createTextNode(
			"div.mraid-close-button-container {" +
				"width: 32px;" +
				"height: 32px;" +
				"right: 10px;" +
				"top: 10px;" +
				"position: fixed;" +
				"font-size: 0px;" +
				"z-index: 100;" +
			"}" +
			"div.mraid-close-button {" +
				"width: 18px;" +
				"height: 18px;" +
				"right: 7px;" +
				"top: 7px;" +
				"position: absolute;" +
				"display: none;" +
				"background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MzMwMTBDQzBEMjhBMTFFN0FBNTFFMkU0Q0M1MDdEN0MiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MzMwMTBDQzFEMjhBMTFFN0FBNTFFMkU0Q0M1MDdEN0MiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDozMzAxMENCRUQyOEExMUU3QUE1MUUyRTRDQzUwN0Q3QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDozMzAxMENCRkQyOEExMUU3QUE1MUUyRTRDQzUwN0Q3QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PjuNTC4AAAXaSURBVHja5N3baxxV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');" +
				"background-size: 100%;" +
			"}"
		));
		document.head.appendChild(style);

		MRAID.extendStyles(container, Settings["close-button-container-styles"]);
		MRAID.extendStyles(close_button, Settings["close-button-styles"]);

		if (Settings["interstitial-timeout"]) {

			var bar_styles = {
				strokeWidth: 6,
				color: '#FFF',
				trailColor: '#eee',
				trailWidth: 1,
				svgStyle: null
			};

			MRAID.extend(bar_styles, Settings["close-button-bar-styles"]);

			var bar = this.progressBar = new ProgressBar.Circle(container, bar_styles);

			MRAID.onViewable(function() {

				bar.animate(1.0, {
					duration: Settings["interstitial-timeout"]
				}, function() {

					MRAID.showCloseButton();

				});

			});

		}

	},

	extend: function(object1, object2) {

		if (!object1 || !object2) return;

		for (var key in object2) if (object2.hasOwnProperty(key)) {

			object1[key] = object2[key];

		}

	},

	extendStyles: function(el, styles) {

		if (!el || !styles) return;

		for (var key in styles) if (styles.hasOwnProperty(key)) {

			if (key === 'data') continue;

			if (typeof styles[key] !== 'string') continue;

			if (styles[key].indexOf('url(') !== -1 && styles[key].indexOf("http") === -1 && styles[key].indexOf("//") === -1 && styles[key].indexOf("data:") === -1 ) {

				styles[key] = styles[key].replace('url(', 'url(' + Settings["assets-path"]);

			}

			el.style[key] = styles[key];

		}

	},

	showCloseButton: function() {

		MRAID.isCloseButtonShowed = true;

		Broadcast.call("MRAID Show Close Button");

		MRAID.closeButtonEl.style.display = "block";

		MRAID.track('Main Events', 'Close Button Showed');

	},

	track: function(type, event) {

		if (Settings["google-analytics-key"]) {

			ga('send', 'event', type, event, Math.round((Date.now() - Settings["start-time"]) / 1000));

		}

		if (Settings['mixpanel-key']) {

			if (!this.MixpanelUserId) this.MixpanelUserId = Date.now();

			var mdata = Base64.encode(JSON.stringify({
				"event": type + ' ' + event,
				"properties": {
					"token": Settings['mixpanel-key'],
					"distinct_id": this.MixpanelUserId,
					"$browser": platform.description
				}
			}));

			var xhr = new XMLHttpRequest();

			xhr.open('GET', 'https://api.mixpanel.com/track/?data=' + mdata + '&ip=1', true);

			xhr.send();

		}

	}

};

var Base64 = {

	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;

		input = Base64._utf8_encode(input);

		while (i < input.length) {

			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output +
				this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
				this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

		}

		return output;
	},

	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;

		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

		while (i < input.length) {

			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			output = output + String.fromCharCode(chr1);

			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}

		}

		output = Base64._utf8_decode(output);

		return output;

	},

	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

};