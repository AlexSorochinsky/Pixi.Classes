//-----------------------------------------------------------------------------
// Filename : Loader.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 09.05.17
// Require: 
//-----------------------------------------------------------------------------
// Simple utility for preloading big js files and show loading progress
//-----------------------------------------------------------------------------

var Loader = {

	loadingBackgroundColor: '#ffffff',

	loadingTextColor: '#888888',

	loadingProgressColor: 'rgba(255, 255, 255, 0.8)',

	loadingProgressCodePercent: 0.25,

	load: function (src, next) {

		this.setup();

		this.showLoadProgress();

		var req = new XMLHttpRequest();

		req.addEventListener("progress", function (event) {

			if (event.lengthComputable) {

				var percent = (event.loaded / event.total) * Loader.loadingProgressCodePercent;

				Loader.updateLoadProgress(percent);

			}

		}, false);

		req.addEventListener("load", function (event) {

			Loader.updateLoadProgress(Loader.loadingProgressCodePercent);

			var s = document.createElement("script");

			s.innerHTML = event.target.responseText; // or: s[s.innerText!=undefined?"innerText":"textContent"] = e.responseText

			document.getElementsByTagName('head')[0].appendChild(s);

			setTimeout(function() {

				Broadcast.on("Assets Preload Progress", function(loader) {

					Loader.updateLoadProgress(Loader.loadingProgressCodePercent + (loader.pixiLoader.progress / 100) || 0);

				}, this);

				Broadcast.on("Assets Preload Complete", function() {

					Loader.updateLoadProgress(1);

					Loader.hideLoadProgress();

					Broadcast.off(["Assets Preload Progress", "Assets Preload Complete"], this);

				}, this);

				if (next) next();

			}, 100);

		}, false);

		req.open("GET", src);

		req.send();

	},

	showLoadProgress: function() {

		var container = this.loadOverlayEl = document.createElement('div');
		container.className = 'mraid-loading';
		container.style.width = window.innerWidth + 'px';
		container.style.height = window.innerHeight + 'px';
		container.style.lineHeight = window.innerHeight + 'px';
		container.style.zIndex = '2000';
		container.style.transition = 'opacity 1s';

		var indicator = this.indicatorEl = document.createElement('div');
		indicator.className = 'indicator';
		container.appendChild(indicator);

		var text = this.logoEl = document.createElement('div');
		text.className = 'text';
		text.innerText = 'Loading...';
		indicator.appendChild(text);

		var progress = document.createElement('div');
		progress.className = 'progress';
		indicator.appendChild(progress);

		var complete = this.loadProgressEl = document.createElement('div');
		complete.className = 'complete';
		progress.appendChild(complete);

		document.body.appendChild(container);

		window.addEventListener("resize", function() {

			container.style.width = window.innerWidth + 'px';
			container.style.height = window.innerHeight + 'px';
			container.style.lineHeight = window.innerHeight + 'px';

		});

	},

	hideLoadProgress: function() {

		Loader.loadOverlayEl.style.opacity = 0;

		setTimeout(function() {

			Loader.loadOverlayEl.style.display = 'none';

		}, 1000);

	},

	updateLoadProgress: function(percent) {

		this.loadProgressEl.style.width = Math.round(percent*100) + '%';

	},

	setup: function() {

		this.setupViewport();

		this.setupCharset();

		this.setupCss();

	},

	setupViewport: function () {

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

	setupCharset: function () {

		var element = document.querySelector("meta[charset]");

		if (!element) {

			element = document.createElement("meta");

			element.setAttribute("charset", "UTF-8");

			document.getElementsByTagName('head')[0].appendChild(element);

		} else {

			element.charset = "UTF-8";

		}

	},

	setupCss: function () {

		var style = this.styleEl = document.createElement("style");
		style.appendChild(document.createTextNode(
			"html, body {" +
				"width: 100%;" +
				"height: 100%;" +
				"padding: 0;" +
				"margin: 0;" +
				"overflow: hidden;" +
				"font-family: \"Verdana\", \"Droid Sans\"" +
			"}" +
			".mraid-loading {" +
				"position: fixed;" +
				"left: 0px;" +
				"top: 0px;" +
				"vertical-align: middle;" +
				"background-color: " + Loader.loadingBackgroundColor + ";" +
				"transition: opacity 1s;" +
			"}" +
			".mraid-loading .indicator {" +
				"display: inline-block;" +
				"width: 100%;" +
				"height: 50px;" +
				"line-height: normal;" +
				"text-align: center;" +
			"}" +
			".mraid-loading .text {" +
				"display: inline-block;" +
				"width: 100%;" +
				"vertical-align: middle;" +
				"color: " + Loader.loadingTextColor + ";" +
				"font-size: 13pt;" +
			"}" +
			".mraid-loading .progress {" +
				"display: inline-block;" +
				"width: 200px;" +
				"height: 2px;" +
				"background-color: rgba(0, 0, 0, 0.3);" +
				"vertical-align: middle;" +
				"position: relative;" +
				"opacity: 0.5;" +
			"}" +
			".mraid-loading .complete {" +
				"display: inline-block;" +
				"width: 200px;" +
				"height: 2px;" +
				"width: 0%;" +
				"background-color: " + Loader.loadingProgressColor + ";" +
				"vertical-align: middle;" +
				"position: absolute;" +
				"left: 0;" +
				"top: 0;" +
				"transition: width 1s;" +
				"opacity: 0.9;" +
			"}"

		));

		document.head.appendChild(style);

	}

};