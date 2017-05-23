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

	Version: '1.0.0',

	PixelRatio: window.devicePixelRatio || 1,

	IsTouchDevice: (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0)),

	ResolutionWidth: 1920, //Resolution of game assets (psd file resolution)
	ResolutionHeight: 1080, //Resolution of game assets (psd file resolution)

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

		createjs.Ticker.timingMode = createjs.Ticker.RAF;

		if (this.ForceCanvasRenderer) {

			this.Renderer = new PIXI.CanvasRenderer(300, 300, {
				clearBeforeRender: true,
				transparent: (this.StageBackgroundColor === false),
				backgroundColor: this.StageBackgroundColor
			});

		} else {

			this.Renderer = PIXI.autoDetectRenderer(300, 300, {
				clearBeforeRender: true,
				transparent: (this.StageBackgroundColor === false),
				backgroundColor: this.StageBackgroundColor
			});

		}

		this.Renderer.plugins.interaction.moveWhenInside = true;

		this.Stage = new PIXI.Container();

		this.Stage.interactive = true;
		this.Stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

		this.resources = {};

		if (this.prepare) this.prepare();

		this.loadAssets(null, function() {

			Broadcast.call("Assets Loaded");

			App.create();

		}, {strategy: 'preload'});

		this.createEmptyTexture();

		this.addRendererEvents();

	},

	loadAssets: function (assets, next, options) {

		if (!options) options = {};

		var loader = {
			pixiReady: false,
			domImagesReady: false,
			webFontsReady: false,
			soundsReady: false,
			textsReady: false
		};

		var pixi_loader = loader.pixiLoader = new PIXI.loaders.Loader();

		pixi_loader.on("progress", function() {

			Broadcast.call('Game Load Progress', [loader, assets]);

		});

		var fonts = [],
			sounds = [],
			images = [],
			texts = [];

		_.each(this.Screens, function (screen) {

			if (screen.Assets) {

				_.each(screen.Assets, function (asset) {

					var name = asset.name;

					if (assets && !_.contains(assets, name)) return;

					if (App.Assets[name] && App.Assets[name].state != 'prepared') {

						if (App.Assets[name].state == 'loaded') console.warn('Asset already loaded. Check "'+name+'" asset for multiple load.');

						else if (App.Assets[name].state == 'loading') console.warn('Asset already loading. Check "'+name+'" asset for multiple load.');

						else throw new Error('Asset names in all screens must be unique. Check "'+name+'" asset definition in "'+screen.Name+'" screen.');

					} else if (!App.Assets[name]) {

						asset.state = 'prepared';
						App.Assets[name] = asset;

					}

					if (!asset.loadStrategy) asset.loadStrategy = 'preload';

					if (options.strategy == 'preload' && asset.loadStrategy != 'preload') return;

					var url = asset.url;

					if (_.isFunction(url)) url = url.call(App);

					if (url.indexOf('http') !== 0) url = App.srcURL + url + '?v=' + this.Version;

					if (asset.type == 'image') pixi_loader.add(asset.name, url, { crossOrigin: "*" });

					else if (asset.type == 'atlas') pixi_loader.add(asset.name, url, { crossOrigin: "*" });

					else if (asset.type == 'bitmap-font') pixi_loader.add(asset.name, url, { crossOrigin: "*" });

					else if (asset.type == 'web-font') fonts.push([asset.name, url]);

					else if (asset.type == 'sound') sounds.push([asset.name, url]);

					else if (asset.type == 'dom-image') images.push([asset.name, url]);

					else if (asset.type == 'text') texts.push([asset.name, url]);

					asset.state = 'loading';

				}, this);

			}

		}, this);

		if (_.size(pixi_loader.resources) > 0) {

			pixi_loader.load(_.bind(function (pixi_loader, resources) {

				App.resources = resources;

				_.each(resources, function(item, index) {

					if (App.Assets[index]) {

						App.Assets[index].data = item;
						App.Assets[index].loaded = true;

					} else {

						App.Assets[index] = {
							data: item,
							loaded: true
						};

					}

				});

				loader.pixiReady = true;
				check_complete();

			}, this));

		} else {

			loader.pixiReady = true;
			check_complete();

		}

		if (fonts.length > 0) {

			window.WebFontConfig = {
				custom: {
					families: _.map(fonts, function (font) {
						return font[0];
					}),
					urls: _.map(fonts, function (font) {
						return font[1];
					})
				},
				active: function () {

					_.each(fonts, function(font) {

						App.Assets[font[0]].loaded = true;

					});

					loader.webFontsReady = true;
					check_complete();

				}
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

			loader.webFontsReady = true;
			check_complete();

		}

		if (sounds.length > 0) {

			if (!createjs.Sound) throw new Error('SoundJS not found.');

			for (var i=0; sounds[i]; i++) createjs.Sound.registerSound(sounds[i][1], sounds[i][0]);

			createjs.Sound.on("fileload", function(event) {

				Broadcast.call("Sound Loaded", [event.id]);

				//TODO: Check sounds loading process
				App.Assets[event.id].loaded = true;

				//TODO: Wait all sounds before load complete callback
				loader.soundsReady = true;
				check_complete();

			}, this);

		} else {

			loader.soundsReady = true;
			check_complete();

		}

		if (images.length > 0) {

			_.each(images, function(data) {

				var img = new Image();
				img.src = data[1];

				//TODO: Add dom images load event (test if image already loaded in css, load event will not work)
				App.Assets[data[0]].loaded = true;

			});

			//TODO: Wait dom images before load complete callback (test if image already loaded in css, load event will not work)
			loader.domImagesReady = true;
			check_complete();

		} else {

			loader.domImagesReady = true;
			check_complete();

		}

		if (texts.length > 0) {

			_.each(texts, function(data) {

				var xhr = new XMLHttpRequest();

				xhr.open('GET', data[1], true);

				xhr.send();

				xhr.onreadystatechange = function () {

					if (xhr.readyState == 4 && xhr.status == 200) {

						App.Assets[data[0]].data = xhr.responseText;
						App.Assets[data[0]].loaded = true;

						loader.textsReady = true;

						_.each(texts, function(data) {

							if (!App.Assets[data[0]] || !App.Assets[data[0]].loaded) loader.textsReady = false;

						});

						check_complete();

					}

				};

			});

		} else {

			loader.textsReady = true;
			check_complete();

		}

		function check_complete() {

			if (loader.pixiReady && loader.webFontsReady && loader.soundsReady && loader.domImagesReady && loader.textsReady) {

				if (next) {

					next.call(this);

					next = null;

				}

			}

		}

	},

	create: function () {

		this.time = Date.now();

		var game = this;

		_.each(this.Screens, function (screen) {

			screen.build();

		}, this);

		window.addEventListener('resize', function () {

			game.resize(false);

		});

		document.body.appendChild(this.Renderer.view);

		this.resize(true);

		this.isReady = true;

		this.ready();

		createjs.Ticker.addEventListener("tick", _.bind(this.update, this));

	},

	update: function () {

		this.time = Date.now();

		Broadcast.call("Game Update");

		this.Renderer.render(this.Stage);

	},

	registerScreen: function (screen) {

		screen.App = this;

		this.Screens.push(screen);

	},

	//Draw all containers first time, so all textures will be cached in memory and animation will be more smooth
	cacheScreenTextures: function() {

		_.each(this.Screens, function (screen) {

			_.each(screen._containers, function(container) {

				container._prev_visible = container.visible;

				container.visible = true;

			}, this);

		}, this);

		this.Renderer.render(this.Stage);

		_.each(this.Screens, function (screen) {

			_.each(screen._containers, function(container) {

				container.visible = container._prev_visible;

				delete container._prev_visible;

			}, this);

		}, this);

	},

	resize: function (is_initial_resize) {

		var width = window.innerWidth,
			height = window.innerHeight;

		this.IsLandscape = width > height;

		this.IsPortrait = !this.IsLandscape;

		this.Width = width * this.PixelRatio;
		this.Height = height * this.PixelRatio;

		this.CenterX = Math.round(this.Width / 2);
		this.CenterY = Math.round(this.Height / 2);

		this.Scale = Math.min(this.Width / this.ResolutionWidth, this.Height / this.ResolutionHeight);

		Broadcast.call("Game Resize", [is_initial_resize]);

		this.Renderer.resize(this.Width, this.Height);

		this.Renderer.view.style.width = width + 'px';
		this.Renderer.view.style.height = height + 'px';

	},

	play: function(name, volume, is_loop) {

		if (createjs.Sound.loadComplete(name)) {

			var instance = createjs.Sound.play(name);

			instance._looping = !!is_loop;

			instance.volume = volume || 1;

			instance.on("complete", function() {

				if (instance._looping) {

					instance.position = 0;

					instance.play();

				}

			}, this);

			return instance;

		}

		return false;

	},

	addRendererEvents: function() {

		if (App.IsTouchDevice) {

			this.Stage.on("touchstart", function(e) {

				Broadcast.call("Stage Press Down", [App.Stage, e]);

			}, false);

			this.Stage.on("touchend", function(e) {

				Broadcast.call("Stage Press Up", [App.Stage, e]);

			}, false);

			this.Stage.on("touchmove", function(e) {

				Broadcast.call("Stage Press Move", [App.Stage, e]);

			}, false);

		} else {

			this.Stage.on("mousedown", function(e) {

				Broadcast.call("Stage Press Down", [App.Stage, e]);

			}, false);

			this.Stage.on("mouseup", function(e) {

				Broadcast.call("Stage Press Up", [App.Stage, e]);

			}, false);

			this.Stage.on("mousemove", function(e) {

				Broadcast.call("Stage Press Move", [App.Stage, e]);

			}, false);

		}

	},

	createEmptyTexture: function() {

		var canvas = document.createElement('canvas');

		canvas.width = 1;
		canvas.height = 1;

		this.emptyTexture = PIXI.Texture.fromCanvas(canvas);

	}

});