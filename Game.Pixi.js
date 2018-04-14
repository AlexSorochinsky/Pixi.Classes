//-----------------------------------------------------------------------------
// Filename : Game.Pixi.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Game.js
//-----------------------------------------------------------------------------
// Pixi based game logic
//-----------------------------------------------------------------------------

Class.Mixin(Game, {

	Engine: 'Pixi',

	MoveWhenInside: false,

	start: function () {

		createjs.Ticker.timingMode = createjs.Ticker.RAF;

		PIXI.settings.PRECISION_FRAGMENT = this.PrecisionFragment || PIXI.settings.PRECISION_FRAGMENT;

		if (this.IsCreateGame) {

			var options = {
				clearBeforeRender: this.ClearBeforeRender,
				antialias: this.Antialias,
				roundPixels: this.RoundPixels,
				transparent: (this.StageBackgroundColor === false),
				backgroundColor: this.StageBackgroundColor
			};

			if (this.ForceCanvasRenderer) this.Renderer = new PIXI.CanvasRenderer(300, 300, options);

			else this.Renderer = PIXI.autoDetectRenderer(300, 300, options);

			this.Renderer.plugins.interaction.moveWhenInside = this.MoveWhenInside;

			this.Stage = new PIXI.Container();

			this.Stage.interactive = true;
			this.Stage.hitArea = new PIXI.Rectangle(0, 0, 10000, 10000);

			this.createEmptyTexture();

			this.addRendererEvents();

		}

		this.resources = {};

		if (this.prepare) this.prepare();

		App.Loader = this.loadAssets(null, function() {

			Broadcast.call("Assets Loaded");

			App.create();

		}, {strategy: 'preload'});

	},

	loadImages: function(loader, images) {

		if (images && images.length > 0) {

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.loaders.Loader();

			_.each(images, function(asset) {

				loader.pixiLoader.add(asset[0], asset[1], {crossOrigin: "*"})

			});

		} else {

			loader.states['image'] = 'ready';

			loader.check();

		}

	},

	loadAtlases: function(loader, atlases) {

		if (atlases && atlases.length > 0) {

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.loaders.Loader();

			_.each(atlases, function(asset) {

				loader.pixiLoader.add(asset[0], asset[1], {crossOrigin: "*"})

			});

		} else {

			loader.states['atlas'] = 'ready';

			loader.check();

		}

	},

	loadBitmapFonts: function(loader, bitmap_fonts) {

		if (bitmap_fonts && bitmap_fonts.length > 0) {

			if (!loader.pixiLoader) loader.pixiLoader = new PIXI.loaders.Loader();

			_.each(bitmap_fonts, function(asset) {

				loader.pixiLoader.add(asset[0], asset[1], {crossOrigin: "*"})

			});

		} else {

			loader.states['bitmap-font'] = 'ready';

			loader.check();

		}

	},

	loadSounds: function(loader, sounds) {

		if (sounds && sounds.length > 0) {

			if (!PIXI.sound) throw new Error('PIXI.sound not found.');

			for (var i=0; sounds[i]; i++) {

				loader.pixiLoader.add(sounds[i][0], sounds[i][1], {crossOrigin: "*"})

			}

		} else {

			loader.states['sound'] = 'ready';

			loader.check();

		}

	},

	loadSources: function(loader) {

		if (loader.pixiLoader) {

			loader.pixiLoader.on("progress", function () {

				Broadcast.call('Game Load Progress', [loader]);

			});

			loader.pixiLoader.load(_.bind(function (pixi_loader, resources) {

				_.each(resources, function (item, index) {

					App.resources[index] = item;

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

				loader.states['image'] = 'ready';
				loader.states['atlas'] = 'ready';
				loader.states['bitmap-font'] = 'ready';
				loader.states['sound'] = 'ready';

				loader.check();

			}, this));

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

		if (this.Renderer) document.body.appendChild(this.Renderer.view);

		this.resize(true);

		this.ready();

	},

	startTicker: function() {

		createjs.Ticker.addEventListener("tick", _.bind(this.update, this));

	},

	update: function (event) {

		this.time = Date.now();
		this.timeDelta = event.delta;

		Broadcast.call("Game Update");

		if (this.Renderer) this.Renderer.render(this.Stage);

	},

	//Draw all textures first time, so all textures will be cached in memory and animation will be more smooth
	cacheScreenTextures: function() {

		var container = new PIXI.Container();

		container.cached_textures_hash = {};

		_.each(PIXI.utils.TextureCache, function(texture, name) {

			if (!container.cached_textures_hash[name]) {

				var sprite = container.cached_textures_hash[name] = new PIXI.Sprite(texture);

				sprite.alpha = 0.001;

				container.addChild(sprite);

			}

		});

		_.each(this.Screens, function (screen) {

			_.each(screen.Assets, function(asset) {

				if (asset.type === 'web-font' && !container.cached_textures_hash['web-font-' + asset.name]) {

					var sprite = container.cached_textures_hash['web-font-' + asset.name] = new PIXI.Text('test 123', {fontFamily: asset.name, fontSize: '50px', fill: 0xff0000});

					sprite.alpha = 0.001;

					container.addChild(sprite);

				}

			}, this);

		}, this);

		this.Renderer.render(container);

	},

	resize: function (is_initial_resize) {

		var width = window.innerWidth,
			height = window.innerHeight;

		this.IsLandscape = width > height;

		this.IsPortrait = !this.IsLandscape;

		this.Orientation = this.IsLandscape ? 'Landscape' : 'Portrait';

		this.Width = width * this.PixelRatio;
		this.Height = height * this.PixelRatio;

		if (this.Width * this.Height > this.MaximumCanvasSize) {

			var scale = this.MaximumCanvasSize / (this.Width * this.Height);

			this.Width *= scale;
			this.Height *= scale;

		}

		this.CenterX = Math.round(this.Width / 2);
		this.CenterY = Math.round(this.Height / 2);

		this.Scale = Math.min(this.Width / this.ResolutionWidth, this.Height / this.ResolutionHeight);

		Broadcast.call("Game Resize", [is_initial_resize]);

		if (this.Renderer) this.Renderer.resize(this.Width, this.Height);

		if (this.Renderer) this.Renderer.view.style.width = width + 'px';
		if (this.Renderer) this.Renderer.view.style.height = height + 'px';

	},

	play: function(name, volume, is_loop) {

		if (this.resources[name]) {

			return PIXI.sound.play(name, {loop: !!is_loop});

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