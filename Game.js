//-----------------------------------------------------------------------------
// Filename : Game.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Class.js, TweenJS
//-----------------------------------------------------------------------------
// Abstract Pixi game constructor with main functionality
//-----------------------------------------------------------------------------

var Game = new Class({

	PixelRatio: window.devicePixelRatio || 1,

	IsTouchDevice: (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)),

	IsCreateGame: true,

	ResolutionWidth: 1920, //Resolution of game assets (psd file resolution)
	ResolutionHeight: 1080, //Resolution of game assets (psd file resolution)

	MaximumCanvasSize: 2048 * 2048,

	ForceCanvasRenderer: false,
	ClearBeforeRender: false,
	Antialias: false,
	RoundPixels: false,

	StageBackgroundColor: 0x000000,

	Scale: 1, //Game scale based on (ResolutionWidth/ResolutionHeight of assets and real game Width/Height)

	Width: 1920, //Real size of game canvas in pixels (calculated dynamically when window resize)
	Height: 1080, //Real size of game canvas in pixels (calculated dynamically when window resize)

	CenterX: 960, //Center of the screen (Width / 2)
	CenterY: 540, //Center of the screen (Height / 2)

	IsLandscape: true, //Current orientation (calculated from current Width and Height of game)
	IsPortrait: false, //Current orientation (calculated from current Width and Height of game)

	srcURL: '',

	Assets: {},

	Screens: [], //Array of game screen objects

	start: function () {

		throw new Error('App.start must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	loadAssets: function (assets, next, options) {

		if (!options) options = {};

		var _this = this;

		var loader = {
			sources: {},
			states: {},
			check: function check_complete() {

				var result = true;

				_this.each(loader.states, function(m) {if (m !== 'ready') result = false;});

				if (result) {

					if (next) {

						Broadcast.call("Assets Preload Complete", [loader, assets]);

						next.call(this);

						next = null;

					}

				}

			}
		};

		this.extractAssetsForLoad(loader, this.Screens, assets, next, options);

		this.loadImages(loader, loader.sources['image']);

		this.loadAtlases(loader, loader.sources['atlas']);

		this.loadBitmapFonts(loader, loader.sources['bitmap-font']);

		this.loadWebFonts(loader, loader.sources['web-font']);

		this.loadSounds(loader, loader.sources['sound']);

		this.loadDOMImages(loader, loader.sources['dom-image']);

		this.loadTexts(loader, loader.sources['text']);

		this.loadSources(loader);

		return loader;

	},

	extractAssetsForLoad: function(loader, screens, assets, next, options) {

		this.each(screens, function (screen) {

			this.each(screen.Assets, function (asset) {

				var name = asset.name;

				if (assets && !this.contains(assets, name)) return;

				if (App.Assets[name] && App.Assets[name].state !== 'prepared') {

					if (App.Assets[name].state === 'loaded') console.warn('Asset already loaded. Check "'+name+'" asset for multiple load.');

					else if (App.Assets[name].state === 'loading') console.warn('Asset already loading. Check "'+name+'" asset for multiple load.');

					else throw new Error('Asset names in all screens must be unique. Check "'+name+'" asset definition in "'+screen.Name+'" screen.');

				} else if (!App.Assets[name]) {

					App.Assets[name] = asset;

					asset.state = 'prepared';

				}

				if (!asset.loadStrategy) asset.loadStrategy = 'preload';

				if (options.strategy === 'preload' && asset.loadStrategy !== 'preload') return;

				var url = asset.url;

				//Allow disable assets on removing url
				if (url) {

					if (typeof url === 'function') url = url.call(App);

					if (url.indexOf('http') !== 0) url = App.srcURL + url;

					if (!loader.states[asset.type]) {

						loader.states[asset.type] = 'initialized';

						loader.sources[asset.type] = [];

					}

					loader.sources[asset.type].push([asset.name, url]);

					asset.state = 'loading';

				}

			});

		});

	},

	loadImages: function() {

		throw new Error('App.loadImages must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	loadAtlases: function() {

		throw new Error('App.loadAtlases must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	loadBitmapFonts: function() {

		throw new Error('App.loadBitmapFonts must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	loadWebFonts: function(loader, fonts) {

		if (fonts && fonts.length > 0) {

			var _this = this;

			window.WebFontConfig = {
				custom: {
					families: fonts.map(function (font) {
						return font[0];
					}),
					urls: fonts.map(function (font) {
						return font[1];
					})
				},
				active: function () {

					_this.each(fonts, function(font) {

						App.Assets[font[0]].loaded = true;

					});

					loader.states['web-font'] = 'ready';

					loader.check();

				},
				inactive: function () {

					_this.each(fonts, function (font) {

						App.Assets[font[0]].loaded = true;

					});

					loader.states['web-font'] = 'ready';

					loader.check();

				},
				fontactive: function(name) {

					var el = document.createElement('div');

					el.id = name;

					el.style.fontFamily = name;
					el.style.position = 'fixed';
					el.style.top = 0;
					el.style.visibility = 'hidden';

					el.innerHTML = 'AbCdE 12345';

					document.body.appendChild(el);

				},
				fontinactive: function(familyName, fvd) {

					console.warn("failed " +familyName + " " + fvd);

				},
				timeout: 5000
			};

			if (window.WebFont) window.WebFont.load();

			else {

				(function(d) {
					var wf = d.createElement('script'), s = d.scripts[0];
					wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
					wf.async = true;
					s.parentNode.insertBefore(wf, s);
				})(document);

			}

		} else {

			loader.states['font'] = 'ready';

			loader.check();

		}

	},

	loadSounds: function() {

		throw new Error('App.loadSounds must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	loadDOMImages: function(loader, dom_images) {

		if (dom_images && dom_images.length > 0) {

			this.each(dom_images, function(data) {

				var img = new Image();
				img.src = data[1];

				//TODO: Add dom images load event (test if image already loaded in css, load event will not work)
				App.Assets[data[0]].loaded = true;

			});

			//TODO: Wait dom images before load complete callback (test if image already loaded in css, load event will not work)

			loader.states['dom-image'] = 'ready';

			loader.check();

		} else {

			loader.states['dom-image'] = 'ready';

			loader.check();

		}

	},

	loadTexts: function(loader, texts) {

		if (texts && texts.length > 0) {

			var _this = this;

			this.each(texts, function(data) {

				var xhr = new XMLHttpRequest();

				xhr.open('GET', data[1], true);

				xhr.send();

				xhr.onreadystatechange = function () {

					if (xhr.readyState === 4 && xhr.status === 200) {

						App.Assets[data[0]].data = xhr.responseText;
						App.Assets[data[0]].loaded = true;

						loader.states['text'] = 'ready';

						_this.each(texts, function(data) {

							if (!App.Assets[data[0]] || !App.Assets[data[0]].loaded) loader.states['text'] = 'loading';

						});

						loader.check();

					}

				};

			});

		} else {

			loader.states['text'] = 'ready';

			loader.check();

		}

	},

	loadSources: function() {

		//Just for redeclare in App.js for loading unknown type of assets

	},

	create: function () {

		throw new Error('App.create must be redefined. Include Game.Phaser.js or Game.Pixi.js');

	},

	registerScreen: function (screen) {

		screen.App = this;

		this.Screens.push(screen);

	},

	each: function(obj, fn) {

		for (var i in obj) if (obj.hasOwnProperty(i)) {

			fn.call(this, obj[i], i);

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

	}

});