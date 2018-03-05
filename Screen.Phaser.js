//-----------------------------------------------------------------------------
// Filename : Screen.Phaser.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Phaser specific screen functions
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	buildChild: function(container, child_params, is_reposition) {

		var child, i;

		this.processOrientationProperties(child_params);

		if (child_params.type === 'sprite') {

			var frame = this.getTextureFrame(child_params.frame || child_params.image);

			if (frame && frame.type === 'image') child = App.Game.add.sprite(0, 0, frame.name);

			else if (frame && frame.type === 'frame') child = App.Game.add.sprite(0, 0, frame.texture, frame.name);

			else {

				console.warn('Sprite is not created: ', child_params.frame || child_params.image);

				child = App.Game.add.sprite(0, 0, App.emptyTexture);

            }

			if (child) container.addChild(child);

		} else if (child_params.type === 'text') {

			child = App.Game.add.text(0, 0, child_params.text || '');

			container.addChild(child);

		} else if (child_params.type === 'bitmap-text') {

			child = new PIXI.extras.BitmapText(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type === 'graphics') {

			child = App.Game.add.graphics(0, 0);

			//Graphics will be drawn on resize event

			container.addChild(child);

		} else if (child_params.type === 'movie-clip') {

			if (child_params.frameTemplate) {

				child_params.frames = [];

				if ("frameStart" in child_params) {

					for (i=child_params.frameStart; i<=child_params.frameEnd; i++) {

						if (!child_params.frameFilter || child_params.frameFilter(i)) child_params.frames.push(child_params.frameTemplate.replace('???', i<100?(i<10?'00'+i:'0'+i):i).replace('??', i<10?'0'+i:i).replace('?', i));

					}

				} else if ("frameNumbers" in child_params) {

					for (i=0; i<=child_params.frameNumbers.length; i++) {

						var c = child_params.frameNumbers[i];

						if (!child_params.frameFilter || child_params.frameFilter(c)) child_params.frames.push(child_params.frameTemplate.replace('???', c<100?(c<10?'00'+c:'0'+c):c).replace('??', c<10?'0'+c:c).replace('?', c));

					}

				}

			}

			var frames = child_params.frames;

			child = App.Game.add.sprite(0, 0, 'texture');

			child['defaultAnimation'] = child.animations.add(child_params.name, frames, child_params.fps || 10, child_params.loop || false, false);

			container.addChild(child);

		} else if (child_params.type === 'container') {

			child = App.Game.add.group();

			container.addChild(child);

		} else {

			if (!child_params.type) child_params.type = 'container';

			child = App.Game.add.group();

			container.addChild(child);

		}

		child.objectType = child_params.type;

		if (child_params.name) {

			this[child_params.name] = child;

			child.name = child_params.name;

		}

		child.params = child_params;

		var event_params = child_params.event || child_params.button;

		if (event_params) {

			if (event_params === true) event_params = {name: child_params.name};

			else if (typeof event_params === 'string') event_params = {name: event_params};

			if (child_params.button) event_params.button = true;

			if (!event_params.name) event_params.name = child_params.name;

			this.enableEvents(child, event_params);

		}

		if (event_params && event_params.cursor) {
			child.defaultCursor = event_params.cursor;
			child.buttonMode = true;
		}

		if (child_params.hit) {
			if (child_params.hit[0] === 'circle') child.hitArea = new PIXI.Circle (child_params.hit[1], child_params.hit[2], child_params.hit[3]);
			else if (child_params.hit[0] === 'polygon') child.hitArea = new PIXI.Polygon(child_params.hit[1]);
			else if (child_params.hit[0] === 'rect') child.hitArea = new PIXI.Rectangle(child_params.hit[1], child_params.hit[2], child_params.hit[3], child_params.hit[4]);
		}

		if (child_params.visible === false) child.visible = false;

		if (child.filters) {
			if (child_params.shadow) {
				var dropShadowFilter = new PIXI.filters.DropShadowFilter();
				dropShadowFilter.color = child_params.shadow.color || 0x000000;
				dropShadowFilter.alpha = child_params.shadow.alpha || 0.2;
				dropShadowFilter.blur = child_params.shadow.blur || 6;
				dropShadowFilter.distance = child_params.shadow.distance || 20;
			}
		}

		if (child_params.mask) {

			if (this.contains(['rect', 'circle', 'arc'], child_params.mask[0])) {

				child.mask = new PIXI.Graphics();

				child.mask.beginFill(0x000000);

				if (child_params.mask[0] === 'rect') {

					child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

					if (child_params.mask[5] === true) child.addChild(child.mask);

				} else if (child_params.mask[0] === 'circle') {

					child.mask.drawCircle(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]));

					if (child_params.mask[4] === true) child.addChild(child.mask);

				} else if (child_params.mask[0] === 'arc') {

					child.mask.moveTo(0, 0);

					child.mask.arc(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]), this.calculate(child_params.mask[5]));

					if (child_params.mask[6] === true) child.addChild(child.mask);

				}

			} else if (child_params.mask[0] === 'sprite') {

				if (!child_params.mask[1].name) child_params.mask[1].name = child.name + ' mask';

				if (!child_params.mask[1].type) child_params.mask[1].type = 'sprite';

				child.mask = this.buildChild(child.parent, child_params.mask[1]);

				//Recreate texture to prevent blinking effect (possible Pixi bug?)
				child.mask.texture = PIXI.Texture.fromCanvas(child.mask.texture.baseTexture.source);

			} else if (this[child_params.mask]) {

				child.mask = this[child_params.mask];

			}

		}

		if (child_params.skew) {

			child.skew.set(this.calculate(child_params.skew[0]), this.calculate(child_params.skew[1]));

		}

		if ('alpha' in child_params) child.alpha = this.calculate(child_params.alpha);
		if ('rotation' in child_params) child.rotation = this.calculate(child_params.rotation);

		if (child.anchor) {
			if (child_params.anchor) child.anchor.set(child_params.anchor[0], child_params.anchor[1]);
			else child.anchor.set(0.5, 0.5);
		}

		if (child.pivot) {
			if (child_params.pivot) child.pivot.set(child_params.pivot[0], child_params.pivot[1]);
		}

		if (child_params.tint) child.tint = child_params.tint;

		Broadcast.call(this.Name + ' build child', [child, child_params]);

		if (is_reposition) this.resizeChild(child);

		return child;

	},

	rebuildChild: function(sprite) {

		if (typeof sprite === 'string') sprite = this[sprite];

		if (sprite) {

			this.buildChild(sprite.parent, sprite.params, true);

			sprite.destroy();

		}

	},

	getTextureFrame: function(value) {

		if (typeof value === 'function') value = value.call(this);

		if (this.isObject(value)) return value;

		var sprites = this.getPhaserSprites();

		return sprites[value];

	},

	getPhaserSprites: function() {

		if (App.PhaserSprites) return App.PhaserSprites;

		App.PhaserSprites = {};

		this.each(App.Game.cache._cache.image, function(image_data, image_key) {

			if (image_data.frame) App.PhaserSprites[image_key] = {type: 'image', name: image_key};

			else if (image_data.frameData) {

				this.each(image_data.frameData._frames, function(frame) {

					App.PhaserSprites[frame.name] = {type: 'frame', name: frame.name, texture: image_key};

				});

			}

		});

		return App.PhaserSprites;

	},

	getTextures: function(names) {

		var textures = [];

		for (var i=0; names[i]; i++) textures.push(this.getTexture(names[i]));

		return textures;

	},

	update: function() {

		this.updateTimeOffset = App.time - this.updateTime;

		this.updateTime = App.time;

		Broadcast.call(this.Name + ' update');

	},

	resizeChild: function(child) {

		var child_params = child.params;

		this.processOrientationProperties(child_params);

		if (!('scaleStrategy' in child_params) && ('scale' in child_params)) {

			if (!this.isArray(child_params.scale)) child_params.scale = [child_params.scale, child_params.scale];

			child.scale.set(this.calculate(child_params.scale[0]), this.calculate(child_params.scale[1]));

			if ('scaleGlobal' in child_params) {

				if (!this.isArray(child_params.scaleGlobal)) child_params.scaleGlobal = [child_params.scaleGlobal, child_params.scaleGlobal];

				var parent = child.parent,
					scale_x = child.scale.x,
					scale_y = child.scale.y;

				while (parent && parent !== App.Stage) {

					if (child_params.scaleGlobal[0]) scale_x /= parent.scale.x;
					if (child_params.scaleGlobal[1]) scale_y /= parent.scale.y;

					parent = parent.parent;

				}

				child.scale.set(scale_x, scale_y);

			}

		} else if ('scaleStrategy' in child_params) {

			var scale = null;

			if (child_params.scaleStrategy) scale = this.getScaleByStrategy(child_params.scaleStrategy);

			child.scale.set(scale || 1);

		}

		if ('position' in child_params) {
			
			if (!this.isArray(child_params.position)) child_params.position = [child_params.position, child_params.position];

			child.position.set(this.calculate(child_params.position[0]), this.calculate(child_params.position[1]));

		} /*else {

			child.position.set(0, 0);

		}*/

		if (child_params.mask) {

			if (this.contains(['rect', 'circle', 'arc'], child_params.mask[0])) {

				child.mask.clear();

				child.mask.moveTo(0, 0);

				child.mask.beginFill(0x000000);

				if (child_params.mask[0] === 'rect') {

					if (child_params.mask[5] !== true) child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

				} else if (child_params.mask[0] === 'circle') {

					child.mask.drawCircle(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]));

				} else if (child_params.mask[0] === 'arc') {

					child.mask.moveTo(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]));

					child.mask.arc(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]), this.calculate(child_params.mask[5]));

				}

			} else if (child_params.mask[0] === 'sprite') {

				this.resizeChild(child.mask);

			} else if (this[child_params.mask]) {

				if (!child.mask) child.mask = this[child_params.mask];

			}

		}

		if (child_params.draw) {

			child.clear();

			if (!this.isArray(child_params.draw[0])) child_params.draw = [child_params.draw];

			this.each(child_params.draw, function(shape) {

				if (shape[0] === 'rect') {

					child.beginFill(shape[5]);

					child.fillAlpha = shape[6] || 1;

					child.drawRect(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]), this.calculate(shape[4]));

				} else if (shape[0] === 'circle') {

					child.beginFill(shape[4]);

					child.fillAlpha = shape[5] || 1;

					child.drawCircle(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]));

				}

			}, this);

		}

		if (child_params.styles) {

			if (child_params.type === 'text') {

				this.extend(child, child_params.styles);

				if (child_params.styles.fill) child.addColor(child_params.styles.fill, 0);

			}

		}

		if (child.anchor) {

			if (child_params.anchor) child.anchor.set(child_params.anchor[0], child_params.anchor[1]);

			else child.anchor.set(0.5, 0.5);

		}

		if ('visible' in child_params) child.visible = !!child_params.visible;

		return scale;

	},

	enableEvents: function (sprite, event_params) {

		var name = event_params.name;

		var on_down_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' down', [sprite, arguments[1]]);

			if (event_params.press) start_press_event.apply(this, [arguments[1], event_params.press]);

		};

		var on_up_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' up', [sprite, arguments[1]]);
			Broadcast.call(this.Name + ' ' + name + ' click', [sprite, arguments[1]]);

			if (event_params.press) stop_press_event();

		};

		var on_over_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' over', [sprite, arguments[1]]);

		};

		var on_out_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' out', [sprite, arguments[1]]);

			if (event_params.press) stop_press_event();

		};

		var on_move_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' move', [sprite, arguments[1]]);

		};

		var on_down_change = function() {

			var down = event_params.down;

			if (down) {

				if (typeof down === 'function') down = down.apply(this, []);

				if (down) {

					var actions = this.isArray(down) ? down : [down];

					if (!this.isArray(actions[0])) actions = [actions];

					for (var i = 0; actions[i]; i++) {

						var action = actions[i];

						var tween = this.Tweens[action[0]];

						if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<down> definition.');

						if (!action[1]) action[1] = sprite;

						this.tween(action[0], action[1]);

					}

				}

			}

			var down_sprite = event_params.downSprite;

			if (down_sprite) {

				sprite.alpha = 0;
				this[down_sprite].alpha = 1;

			}

		};

		var on_up_change = function() {

			var up = event_params.up;

			if (up) {

				if (typeof up === 'function') up = up.apply(this, []);

				if (up) {

					var actions = this.isArray(up) ? up : [up];

					if (!this.isArray(actions[0])) actions = [actions];

					for (var i = 0; actions[i]; i++) {

						var action = actions[i];

						var tween = this.Tweens[action[0]];

						if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<up> definition.');

						if (!action[1]) action[1] = sprite;

						this.tween(action[0], action[1]);

					}

				}

			}

			var down_sprite = event_params.downSprite;

			if (down_sprite) {

				sprite.alpha = 1;
				this[down_sprite].alpha = 0;

			}

		};

		var on_over_change = function() {

			var over = event_params.over;

			if (typeof over === 'function') over = over.apply(this, []);

			if (this.isArray(over) || typeof over === 'string') {

				var actions = this.isArray(over) ? over : [over];

				if (!this.isArray(actions[0])) actions = [actions];

				for (var i = 0; actions[i]; i++) {

					var action = actions[i];

					var tween = this.Tweens[action[0]];

					if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<over> definition.');

					if (!action[1]) action[1] = sprite;

					this.tween(action[0], action[1]);

				}

			} else if (this.isObject(over)) {

				sprite.params._over_original_position = sprite.params.position;
				sprite.params._over_original_scale = sprite.params.scale;

				this.tween(over, sprite);

			}

		};

		var on_out_change = function() {

			var out = event_params.out;

			if (typeof out === 'function') out = out.apply(this, []);

			else if (this.isArray(out) || typeof out === 'string') {

				var actions = this.isArray(out) ? out : [out];

				if (!this.isArray(actions[0])) actions = [actions];

				for (var i = 0; actions[i]; i++) {

					var action = actions[i];

					var tween = this.Tweens[action[0]];

					if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<out> definition.');

					if (!action[1]) action[1] = sprite;

					this.tween(action[0], action[1]);

				}

			} else if (this.isObject(out)) {

				this.tween(out, sprite);

			}

			var over = event_params.over;

			if (this.isObject(over) && !this.isArray(over)) {

				var tween_params = [];

				if (sprite.params._over_original_position) tween_params.push(['position', sprite.params._over_original_position, over.time || 200, over.delay || 0, over.ease || Ease.linear]);
				if (sprite.params._over_original_scale) tween_params.push(['scale', sprite.params._over_original_scale, over.time || 200, over.delay || 0, over.ease || Ease.linear]);

				this.tween(tween_params, sprite);

			}

		};

		var start_press_event = function(e, object, interval) {

			Broadcast.call(this.Name + ' ' + name + ' press', [sprite, e, object]);

			sprite.pressInterval = setInterval(function() {

				Broadcast.call(this.Name + ' ' + name + ' press', [sprite, e, object]);

			}.bind(this), interval);

		};

		var stop_press_event = function() {

			clearInterval(sprite.pressInterval);

		};

		if (sprite.objectType !== 'container') {

			sprite.inputEnabled = true;

			if (event_params.button) sprite.input.useHandCursor = true;

			sprite.events.onInputDown.add(on_down_call, this);
			sprite.events.onInputUp.add(on_up_call, this);
			sprite.events.onInputOver.add(on_over_call, this);
			sprite.events.onInputOut.add(on_out_call, this);

			if (event_params.move) {

				App.Game.input.addMoveCallback(function () {

					if (sprite.input.pointerOver()) {

						on_move_call.call(this);

					}

				}, this);

			}

			if (event_params.down || event_params.up || event_params.over || event_params.out) {

				sprite.events.onInputDown.add(on_down_change, this);
				sprite.events.onInputUp.add(on_up_change, this);
				sprite.events.onInputOver.add(on_over_change, this);
				sprite.events.onInputOut.add(on_out_change, this);

			}

		} else if (sprite.objectType === 'container') {

			sprite.inputEnableChildren = true;

			sprite.onChildInputDown.add(on_down_call, this);
			sprite.onChildInputUp.add(on_up_call, this);
			sprite.onChildInputOver.add(on_over_call, this);
			sprite.onChildInputOut.add(on_out_call, this);

		}

		Broadcast.on("Document Press Up", function(e) {

			stop_press_event();

		}, sprite);

	},

	bringToTop: function() {

		for (var i = 0; this._containers[i]; i++) App.Stage.addChild(this._containers[i]);

	}

}); 
