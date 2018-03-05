//-----------------------------------------------------------------------------
// Filename : Game.Phaser.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Game.js
//-----------------------------------------------------------------------------
// Phaser based game logic
//-----------------------------------------------------------------------------

Class.Mixin(Game, {

	Engine: 'Phaser',

	start: function () {

		createjs.Ticker.timingMode = createjs.Ticker.RAF;

		if (this.IsCreateGame) {

			this.Game = new Phaser.Game(300, 300, this.ForceCanvasRenderer ? Phaser.CANVAS : Phaser.AUTO, document.body, {

				init: function() {

					if (App.prepare) App.prepare();

					this.game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;

				},

				preload: function() {

					App.Loader = App.loadAssets(null, function() {

						Broadcast.call("Assets Loaded");

						App.create();

					}, {strategy: 'preload'});

				},

				loadUpdate: function () {

					Broadcast.call('Game Load Progress', [App.Game.load.progress]);

				},

				create: function() {

					App.Loader.states['image'] = 'ready';
					App.Loader.states['atlas'] = 'ready';
					App.Loader.states['bitmap-font'] = 'ready';

					App.Loader.check();

				},

				update: function() {

					App.update();

				}

			});

		}

	},

	loadImages: function(loader, images) {

		this.each(images, function(asset) {

			this.Game.load.image(asset[0], asset[1]);

		}, this);

	},

	loadAtlases: function(loader, atlases) {

		this.each(atlases, function(asset) {

			this.Game.load.atlas(asset[0], asset[1].replace('.json', '.png'), asset[1], null, Phaser.Loader.TEXTURE_ATLAS_JSON_ARRAY);

		}, this);

	},

	loadBitmapFonts: function(loader, bitmap_fonts) {

		this.each(bitmap_fonts, function(asset) {

			this.Game.load.bitmapFont(asset[0], asset[1]);

		}, this);

	},

	loadSounds: function(loader, sounds) {

		//TODO: Load via Phaser loader!

		if (sounds && sounds.length > 0) {

			if (!createjs.Sound) throw new Error('SoundJS not found.');

			for (var i=0; sounds[i]; i++) createjs.Sound.registerSound(sounds[i][1], sounds[i][0]);

			createjs.Sound.on("fileload", function(event) {

				Broadcast.call("Sound Loaded", [event.id]);

				//TODO: Check sounds loading process
				App.Assets[event.id].loaded = true;

				//TODO: Wait all sounds before load complete callback
				loader.states['sound'] = 'ready';

				loader.check();

			}, this);

		} else {

			loader.states['sound'] = 'ready';

			loader.check();

		}

	},

	create: function () {

		//if (this.Renderer) document.body.appendChild(this.Renderer.view);

		this.Game.clearBeforeRender = this.Game.renderer.clearBeforeRender = this.ClearBeforeRender;

		this.Game.transparent = (this.StageBackgroundColor === false);

		this.Game.stage.backgroundColor = this.StageBackgroundColor;

		this.Game.antialias = this.Antialias;

		this.Game.renderer.renderSession.roundPixels = this.RoundPixels;

		this.Stage = App.Game.stage;

		this.createEmptyTexture();

		this.addRendererEvents();

		this.time = this.Game.time.now;

		this.each(this.Screens, function (screen) {

			screen.build();

		}, this);

		window.addEventListener('resize', function () {

			App.resize(false);

		});

		this.resize(true);

		this.ready();

	},

	update: function () {

		this.time = this.Game.time.now;

		Broadcast.call("Game Update");

	},

	registerScreen: function (screen) {

		screen.App = this;

		this.Screens.push(screen);

	},

	//Draw all textures first time, so all textures will be cached in memory and animation will be more smooth
	cacheScreenTextures: function() {

		//TODO: Complete function

		/*var container = new PIXI.Container();

		container.cached_textures_hash = {};

		 this.each(PIXI.utils.TextureCache, function(texture, name) {

			if (!container.cached_textures_hash[name]) {

				var sprite = container.cached_textures_hash[name] = new PIXI.Sprite(texture);

				sprite.alpha = 0.001;

				container.addChild(sprite);

			}

		});

		 this.each(this.Screens, function (screen) {

		 this.each(screen.Assets, function(asset) {

				if (asset.type === 'web-font' && !container.cached_textures_hash['web-font-' + asset.name]) {

					var sprite = container.cached_textures_hash['web-font-' + asset.name] = new PIXI.Text('test 123', {fontFamily: asset.name, fontSize: '50px', fill: 0xff0000});

					sprite.alpha = 0.001;

					container.addChild(sprite);

				}

			}, this);

		}, this);

		this.Renderer.render(container);*/

	},

	resize: function (is_initial_resize) {

		var width = window.innerWidth,
			height = window.innerHeight;

		this.IsLandscape = width > height;

		this.IsPortrait = !this.IsLandscape;

		this.Orientation = this.IsLandscape ? 'Landscape' : 'Portrait';

		this.Width = width * this.PixelRatio;
		this.Height = height * this.PixelRatio;

		this.CenterX = Math.round(this.Width / 2);
		this.CenterY = Math.round(this.Height / 2);

		this.Scale = Math.min(this.Width / this.ResolutionWidth, this.Height / this.ResolutionHeight);

		Broadcast.call("Game Resize", [is_initial_resize]);

		if (this.Game) {

			//this.Game.renderer.resolution = this.PixelRatio;

			this.Game.scale.setGameSize(this.Width, this.Height);

			this.Game.canvas.style.width = width + 'px';
			this.Game.canvas.style.height = height + 'px';

		}

	},

	play: function(name, volume, is_loop) {

		//TODO: Rewrite using Phaser functionality

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

		this.Game.input.onDown.add(function(sprite, e) {

			Broadcast.call("Stage Press Down", [App.Stage, e]);

		}, this);

		this.Game.input.onUp.add(function(sprite, e) {

			//TODO: remove delay and make stage events after sprite events
			Broadcast.call("Stage Press Up", [App.Stage, e], {delay: 1});

		}, this);

		this.Game.input.addMoveCallback(function(e) {

			Broadcast.call("Stage Press Move", [App.Stage, e]);

		}, this);

	},

	createEmptyTexture: function() {

		var canvas = document.createElement('canvas');

		canvas.width = 1;
		canvas.height = 1;

		this.emptyTexture = PIXI.Texture.fromCanvas(canvas);

	}

});