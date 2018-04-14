//-----------------------------------------------------------------------------
// Filename : Screen.Pixi.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Pixi specific screen functions
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	buildChild: function(container, child_params) {

		var child, i;

		this.processOrientationProperties(child_params);

		if (child_params.type === 'sprite') {

			child = new PIXI.Sprite(this.getTexture(child_params.frame || child_params.image));

			container.addChild(child);

		} else if (child_params.type === 'tiling-sprite') {

			child = new PIXI.TilingSprite(this.getTexture(child_params.frame || child_params.image), child_params.width, child_params.height);

			container.addChild(child);

		} else if (child_params.type === 'text') {

			child = new PIXI.Text(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type === 'bitmap-text') {

			child = new PIXI.extras.BitmapText(child_params.text, child_params.styles);

			container.addChild(child);

		}  else if (child_params.type === 'multistyle-text') {

			child = new MultiStyleText(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type === 'graphics') {

			child = new PIXI.Graphics();

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

			var frames = _.map(child_params.frames, function(image) {

				return this.getTexture(image);

			}, this);

			child = new PIXI.extras.AnimatedSprite(frames);

			child.animationSpeed = child_params.speed || 1;

			child.loop = child_params.loop || false;

			container.addChild(child);

		} else if (child_params.type === 'video') {

			child = new PIXI.Sprite(PIXI.Texture.fromVideo(App.srcURL + child_params.src, 1));

			child.video = child.texture.baseTexture.source;

			child.play = function() {

				child.texture.baseTexture.source.play();

				child.isPlaying = true;

			};

			child.pause = function() {

				child.texture.baseTexture.source.pause();

				child.isPlaying = false;

			};

			if (child_params.muted) child.texture.baseTexture.source.muted = true;

			if (!child_params.autoplay) {

				child.texture.baseTexture.on('loaded', function() {

					child.texture.baseTexture.source.addEventListener('playing', function() {

						if (!child.isPlaying) child.pause();

					});

				});

			}

			container.addChild(child);

		} else if (child_params.type === 'container') {

			child = new PIXI.Container();

			container.addChild(child);

		} else if (child_params.type === 'projection-container-2d') {

			child = new PIXI.projection.Container2d();

			container.addChild(child);

		} else if (child_params.type === 'projection-sprite-2d') {

			child = new PIXI.projection.Sprite2d(this.getTexture(child_params.frame || child_params.image));

			container.addChild(child);

		} else {

			if (!child_params.type) child_params.type = 'container';

			child = new PIXI.Container();

			container.addChild(child);

		}

		if (child.anchor) child.anchor.set(0.5, 0.5);

		child.type = child_params.type;

		if (child_params.name) {

			this[child_params.name] = child;

			child.name = child_params.name;

		}

		child.params = child_params;

		var event_params = child_params.event || child_params.button;

		if (event_params) {

			if (event_params === true) event_params = {name: child_params.name};

			else if (_.isString(event_params)) event_params = {name: event_params};

			if (child_params.button) event_params.button = true;

			if (!event_params.name) event_params.name = child_params.name;

			this.enableEvents(child, event_params);

			if (event_params.button) {

				child.defaultCursor = 'pointer';

				child.buttonMode = true;

			}

		}

		if (event_params && event_params.cursor) {

			child.defaultCursor = event_params.cursor;
			child.buttonMode = true;

		}

		Broadcast.call(this.Name + ' build child', [child, child_params]);

		this.applyChildParams(child, child_params);

		return child;

	},

	rebuildChild: function(sprite) {

		if (_.isString(sprite)) sprite = this[sprite];

		if (sprite) {

			this.buildChild(sprite.parent, sprite.params, true);

			sprite.destroy();

		}

	},

	getTexture: function(value) {

		if (_.isFunction(value)) value = value.call(this);

		if (_.isObject(value)) return value;

		if (App.resources[value]) return App.resources[value].texture;

		else if (PIXI.utils.TextureCache[value]) return PIXI.utils.TextureCache[value];

		else return App.emptyTexture;

	},

	getTextures: function(names) {

		var textures = [];

		for (var i=0; names[i]; i++) textures.push(this.getTexture(names[i]));

		return textures;

	},

	applyChildParams: function(child, params, is_change_params, is_rebuild) {

		if (_.isString(child)) child = this[child];

		this.processOrientationProperties(params);

		if (params.image) {

			var texture = this.getTexture(params.image);

			if (child.params.type === 'sprite' && texture !== child.texture) {

				child.texture = texture;

			}

		}

		if ('alpha' in params) child.alpha = this.calculate(params.alpha);

		if ('rotation' in params) child.rotation = this.calculate(params.rotation);

		if (child.anchor) {

			if (params.anchor) child.anchor.set(params.anchor[0], params.anchor[1]);

		}

		if (child.pivot) {

			if (params.pivot) child.pivot.set(params.pivot[0], params.pivot[1]);

		}

		if (params.tint) child.tint = this.toHex(params.tint);

		if (params.skew) {

			child.skew.set(this.calculate(params.skew[0]), this.calculate(params.skew[1]));

		}

		if (!('scaleStrategy' in params) && ('scale' in params)) {

			if (!_.isArray(params.scale)) params.scale = [params.scale, params.scale];

			child.scale.set(this.calculate(params.scale[0]), this.calculate(params.scale[1]));

			if ('scaleGlobal' in params) {

				if (!_.isArray(params.scaleGlobal)) params.scaleGlobal = [params.scaleGlobal, params.scaleGlobal];

				var parent = child.parent,
					scale_x = child.scale.x,
					scale_y = child.scale.y;

				while (parent && parent !== App.Stage) {

					if (params.scaleGlobal[0]) scale_x /= parent.scale.x;
					if (params.scaleGlobal[1]) scale_y /= parent.scale.y;

					parent = parent.parent;

				}

				child.scale.set(scale_x, scale_y);

			}

		} else if ('scaleStrategy' in params) {

			var scale = null;

			if (params.scaleStrategy) scale = this.getScaleByStrategy(params.scaleStrategy);

			child.scale.set(scale || 1);

		}

		if ('position' in params) {

			if (!_.isArray(params.position)) params.position = [params.position, params.position];

			child.position.set(this.calculate(params.position[0]), this.calculate(params.position[1]));

		}

		if (params.mask) {

			if (_.contains(['rect', 'circle', 'arc'], params.mask[0])) {

				if (!child.mask) child.mask = new PIXI.Graphics();

				child.mask.clear();

				child.mask.moveTo(0, 0);

				child.mask.beginFill(0x000000);

				if (params.mask[0] === 'rect') {

					if (params.mask[5] !== true) child.mask.drawRect(this.calculate(params.mask[1]), this.calculate(params.mask[2]), this.calculate(params.mask[3]), this.calculate(params.mask[4]));

				} else if (params.mask[0] === 'circle') {

					child.mask.drawCircle(this.calculate(params.mask[1]), this.calculate(params.mask[2]), this.calculate(params.mask[3]));

				} else if (params.mask[0] === 'arc') {

					child.mask.moveTo(this.calculate(params.mask[1]), this.calculate(params.mask[2]));

					child.mask.arc(this.calculate(params.mask[1]), this.calculate(params.mask[2]), this.calculate(params.mask[3]), this.calculate(params.mask[4]), this.calculate(params.mask[5]));

					if (params.mask[6] === true) child.addChild(child.mask);

				}

			} else if (params.mask[0] === 'sprite') {

				if (!child.mask) {

					if (!params.mask[1].name) params.mask[1].name = child.name + ' mask';

					if (!params.mask[1].type) params.mask[1].type = 'sprite';

					child.mask = this.buildChild(child.parent, params.mask[1]);

					//Recreate texture to prevent blinking effect (possible Pixi bug?)
					child.mask.texture = PIXI.Texture.fromCanvas(child.mask.texture.baseTexture.source);

				} else {

					this.applyChildParams(child.mask, child.mask.params);

				}

			} else if (this[params.mask]) {

				if (!child.mask) child.mask = this[params.mask];

			}

		}

		if (params.draw) {

			child.clear();

			if (!_.isArray(params.draw[0])) params.draw = [params.draw];

			_.each(params.draw, function(shape) {

				if (shape[0] === 'rect') {

					child.beginFill(this.toHex(shape[5]));

					child.fillAlpha = shape[6] || 1;

					child.drawRect(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]), this.calculate(shape[4]));

				} else if (shape[0] === 'circle') {

					child.beginFill(this.toHex(shape[4]));

					child.fillAlpha = shape[5] || 1;

					child.drawCircle(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]));

				} else if (shape[0] === 'arc') {

					child.lineStyle(shape[6], this.toHex(shape[7]));

					child.fillAlpha = shape[8] || 1;

					child.arc(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]), this.calculate(shape[4]), this.calculate(shape[5]));

				} else if (shape[0] === 'path') {

					child.lineStyle(shape[2], this.toHex(shape[3]));

					child.fillAlpha = shape[4] || 1;

					var path = shape[1];

					child.moveTo(path[0], path[1]);

					for (var i=1; i<path.length/2; i++) {

						child.lineTo(path[i*2], path[i*2+1]);

					}

				}

			}, this);

		}

		if (params.text) child.text = params.text;

		if (params.styles) this.setTextStyles(child, params.styles);

		if (params.hit) {
			if (params.hit[0] === 'circle') child.hitArea = new PIXI.Circle (params.hit[1], params.hit[2], params.hit[3]);
			else if (params.hit[0] === 'polygon') child.hitArea = new PIXI.Polygon(params.hit[1]);
			else if (params.hit[0] === 'rect') child.hitArea = new PIXI.Rectangle(params.hit[1], params.hit[2], params.hit[3], params.hit[4]);
		}

		if ('visible' in params) child.visible = params.visible;

		if (child.filters) {

			if (params.shadow) {

				var dropShadowFilter = new PIXI.filters.DropShadowFilter();

				dropShadowFilter.color = params.shadow.color || 0x000000;
				dropShadowFilter.alpha = params.shadow.alpha || 0.2;
				dropShadowFilter.blur = params.shadow.blur || 6;
				dropShadowFilter.distance = params.shadow.distance || 20;

			}

		}

		if (is_change_params !== false && child.params !== params) {

			_.extend(child.params, params);

			if (is_rebuild) this.rebuildChild(child);

		}

	},

	enableEvents: function (sprite, event_params) {

		var name = event_params.name;

		sprite.interactive = true;

		var on_down_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' down', [sprite, arguments[0], arguments[1]]);

			if (event_params.press) start_press_event.apply(this, [arguments[0], arguments[1], event_params.press]);

		};

		var on_up_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' up', [sprite, arguments[0], arguments[1]]);
			Broadcast.call(this.Name + ' ' + name + ' click', [sprite, arguments[0], arguments[1]]);

			if (event_params.press) stop_press_event();

		};

		var on_up_out_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' up outside', [sprite, arguments[0], arguments[1]]);

			if (event_params.press) stop_press_event();

		};

		var on_over_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' over', [sprite, arguments[0], arguments[1]]);

		};

		var on_out_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' out', [sprite, arguments[0], arguments[1]]);

			if (event_params.press) stop_press_event();

		};

		var on_move_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' move', [sprite, arguments[0], arguments[1]]);

		};

		var on_wheel_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' wheel', [sprite, arguments[0], arguments[1]]);

		};

		var on_down_change = function() {

			var down = event_params.down;

			if (down) {

				if (_.isFunction(down)) down = down.apply(this, []);

				if (down) {

					var actions = _.isArray(down) ? down : [down];

					if (!_.isArray(actions[0])) actions = [actions];

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

				if (_.isFunction(up)) up = up.apply(this, []);

				if (up) {

					var actions = _.isArray(up) ? up : [up];

					if (!_.isArray(actions[0])) actions = [actions];

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

			if (_.isFunction(over)) over = over.apply(this, []);

			if (_.isArray(over) || _.isString(over)) {

				var actions = _.isArray(over) ? over : [over];

				if (!_.isArray(actions[0])) actions = [actions];

				for (var i = 0; actions[i]; i++) {

					var action = actions[i];

					var tween = this.Tweens[action[0]];

					if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<over> definition.');

					if (!action[1]) action[1] = sprite;

					this.tween(action[0], action[1]);

				}

			} else if (_.isObject(over)) {

				sprite.params._over_original_position = sprite.params.position;
				sprite.params._over_original_scale = sprite.params.scale;

				this.tween(over, sprite);

			}

		};

		var on_out_change = function() {

			var out = event_params.out;

			if (_.isFunction(out)) out = out.apply(this, []);

			else if (_.isArray(out) || _.isString(out)) {

				var actions = _.isArray(out) ? out : [out];

				if (!_.isArray(actions[0])) actions = [actions];

				for (var i = 0; actions[i]; i++) {

					var action = actions[i];

					var tween = this.Tweens[action[0]];

					if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<out> definition.');

					if (!action[1]) action[1] = sprite;

					this.tween(action[0], action[1]);

				}

			} else if (_.isObject(out)) {

				this.tween(out, sprite);

			}

			var over = event_params.over;

			if (_.isObject(over) && !_.isArray(over)) {

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

		if (window.PointerEvent) {

			sprite
				.on('pointerdown', _.bind(on_down_call, this))
				.on('pointerup', _.bind(on_up_call, this))
				.on('pointerover', _.bind(on_over_call, this))
				.on('pointerout', _.bind(on_out_call, this));

			if (event_params.move) {

				sprite
					.on('pointermove', _.bind(on_move_call, this))

			}

			if (event_params.down || event_params.up || event_params.over || event_params.out) {

				sprite
					.on('pointerdown', _.bind(on_down_change, this))
					.on('pointerup', _.bind(on_up_change, this))
					.on('pointerover', _.bind(on_over_change, this))
					.on('pointerout', _.bind(on_out_change, this));

			}

		} else if (App.IsTouchDevice) {

			sprite
				.on('touchstart', _.bind(on_down_call, this))
				.on('touchend', _.bind(on_up_call, this))
				.on('touchendoutside', _.bind(on_up_out_call, this))
				.on('touchenter', _.bind(on_over_call, this))
				.on('touchleave', _.bind(on_out_call, this));

			if (event_params.move) {

				sprite
					.on('touchmove', _.bind(on_move_call, this))

			}

			if (event_params.down || event_params.up || event_params.over || event_params.out) {

				sprite
					.on('touchstart', _.bind(on_down_change, this))
					.on('touchend', _.bind(on_up_change, this))
					.on('touchendoutside', _.bind(on_up_change, this));

			}

		} else {

			sprite
				.on('mousedown', _.bind(on_down_call, this))
				.on('mouseup', _.bind(on_up_call, this))
				.on('mouseupoutside', _.bind(on_up_out_call, this))
				.on('mouseover', _.bind(on_over_call, this))
				.on('mouseout', _.bind(on_out_call, this))
				.on('wheel', _.bind(on_wheel_call, this));

			if (event_params.move) {

				sprite
					.on('mousemove', _.bind(on_move_call, this))

			}

			if (event_params.down || event_params.up || event_params.over || event_params.out) {

				sprite
					.on('mousedown', _.bind(on_down_change, this))
					.on('mouseup', _.bind(on_up_change, this))
					.on('mouseupoutside', _.bind(on_up_change, this))
					.on('mouseover', _.bind(on_over_change, this))
					.on('mouseout', _.bind(on_out_change, this));

			}

		}

		Broadcast.on("Document Press Up", function(e) {

			stop_press_event();

		}, sprite);

	},

	bringToTop: function() {

		for (var i = 0; this._containers[i]; i++) App.Stage.addChild(this._containers[i]);

	}

}); 
