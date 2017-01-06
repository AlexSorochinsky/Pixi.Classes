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

	Screens: [], //Array of game screen objects

	start: function () {

		createjs.Ticker.timingMode = createjs.Ticker.RAF;

		this.Renderer = PIXI.autoDetectRenderer(300, 300, {
			clearBeforeRender: true,
			transparent: (this.StageBackgroundColor === false),
			backgroundColor: this.StageBackgroundColor
		});

		this.Renderer.plugins.interaction.moveWhenInside = true;

		this.Stage = new PIXI.Container();

		this.resources = {};

		this.preload();

		this.addRendererEvents();

	},

	preload: function () {

		if (this.prepare) this.prepare();

		var loader = this.loader = new PIXI.loaders.Loader();

		loader.on("progress", function() {

			Broadcast.call('Game Load Progress');

		});

		var fonts = [],
			sounds = [],
			images = [];

		_.each(this.Screens, function (screen) {

			if (screen.Assets) {

				_.each(screen.Assets, function (asset) {

					if (asset.type == 'image') loader.add(asset.name, App.srcURL + asset.url + '?v=' + this.Version);

					else if (asset.type == 'atlas') loader.add(asset.name, App.srcURL + asset.url + '?v=' + this.Version);

					else if (asset.type == 'bitmap-font') loader.add(asset.name, App.srcURL + asset.url + '?v=' + this.Version);

					else if (asset.type == 'web-font') fonts.push([asset.name, App.srcURL + asset.url + '?v=' + this.Version]);

					else if (asset.type == 'sound') sounds.push([asset.name, App.srcURL + asset.url + '?v=' + this.Version]);

					else if (asset.type == 'dom-image') images.push(App.srcURL + asset.url);

				}, this);

			}

		}, this);

		_.each(images, function(url) {

			var img = new Image();
			img.src = url;

		});

		var load_images = function () {

			if (_.size(loader.resources) > 0) {

				loader.load(_.bind(function (loader, resources) {

					App.resources = resources;

					App.create();

				}, this));

			} else {

				App.create();

			}

		};

		if (fonts.length > 0) {

			window.WebFont.load({
				custom: {
					families: _.map(fonts, function (font) {
						return font[0];
					}),
					urls: _.map(fonts, function (font) {
						return font[1];
					})
				},
				active: function () {
					load_images();
				}
			});

		} else {

			load_images();

		}

		this.loadSounds(sounds);

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

	loadSounds: function (sounds) {

		if (!sounds || sounds.length == 0) return;

		if (!createjs.Sound) throw new Error('SoundJS not found!');

		for (var i=0; sounds[i]; i++) createjs.Sound.registerSound(sounds[i][1], sounds[i][0]);

		createjs.Sound.on("fileload", function(event) {

			Broadcast.call("Sound Loaded", [event.id]);

		}, this);

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

			App.Renderer.view.addEventListener("touchstart", function(e) {

				Broadcast.call("Stage Press Down", [e]);

			}, false);

			App.Renderer.view.addEventListener("touchend", function(e) {

				Broadcast.call("Stage Press Up", [e]);

			}, false);

			App.Renderer.view.addEventListener("touchmove", function(e) {

				Broadcast.call("Stage Press Move", [e]);

			}, false);

		} else {

			App.Renderer.view.addEventListener("mousedown", function(e) {

				Broadcast.call("Stage Press Down", [e]);

			}, false);

			App.Renderer.view.addEventListener("mouseup", function(e) {

				Broadcast.call("Stage Press Up", [e]);

			}, false);

			App.Renderer.view.addEventListener("mousemove", function(e) {

				Broadcast.call("Stage Press Move", [e]);

			}, false);

		}

	}

});