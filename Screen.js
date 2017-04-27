//-----------------------------------------------------------------------------
// Filename : Screen.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 05.09.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of groups with sprites, which can easy added / removed from stage as one logical object
//-----------------------------------------------------------------------------

var Screen = new Class({

	initialize: function() {

		App.registerScreen(this);

		this._containers = [];

		this._childs = [];

		this._emitters = [];

		this.state = 'idle';

		_.each(this.Events, function(func, name) {

			Broadcast.on(name, function() {

				if (name.indexOf(this.Name) === 0 || this.showed) func.apply(this, arguments);

			}, this);

		}, this);

	},

	build: function() {

		if (!this.Tweens) this.Tweens = {};

		this.AssetsHash = _.indexBy(this.Assets, 'name');

		Broadcast.call(this.Name + ' before build');

		_.each(this.Containers, function(container_params) {

			if (!container_params.position) container_params.position = ['width/2', 'height/2'];
			if (!container_params.scale) container_params.scale = 'scale';
			if (!container_params.type) container_params.type = 'container';

			if (container_params.type == 'container') {

				var container = this.buildChild(App.Stage, container_params);

				this._containers.push(container);

				container.visible = false;

				if (container_params.childs) this.buildChilds(container_params.childs, container);

			}

		}, this);

		this.updateTime = App.time;

		this.isBuild = true;

		Broadcast.call(this.Name + ' build');

	},

	buildChilds: function(childs, container) {

		_.each(childs, function(child_params) {

			var child = this.buildChild(container, child_params);

			this._childs.push(child);

			if (child_params.childs) this.buildChilds(child_params.childs, child);

		}, this);

	},

	buildChild: function(container, child_params, is_reposition) {

		var child;

		this.processOrientationProperties(child_params);

		if (child_params.type == 'sprite') {

			child = new PIXI.Sprite(this.getTexture(child_params.frame || child_params.image));

			container.addChild(child);

		} else if (child_params.type == 'tiling-sprite') {

			child = new PIXI.TilingSprite(this.getTexture(child_params.frame || child_params.image), child_params.width, child_params.height);

			container.addChild(child);

		} else if (child_params.type == 'text') {

			child = new PIXI.Text(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type == 'bitmap-text') {

			child = new PIXI.extras.BitmapText(child_params.text, child_params.styles);

			container.addChild(child);

		}  else if (child_params.type == 'multistyle-text') {

			child = new MultiStyleText(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type == 'graphics') {

			child = new PIXI.Graphics();

			//Graphics will be drawn on resize event

			container.addChild(child);

		} else if (child_params.type == 'movie-clip') {

			if (child_params.frameTemplate) {

				child_params.frames = [];

				for (var i=child_params.frameStart; i<=child_params.frameEnd; i++) child_params.frames.push(child_params.frameTemplate.replace('??', i<10?'0'+i:i));

			}

			var frames = _.map(child_params.frames, function(image) {

				return this.getTexture(image);

			}, this);

			child = new PIXI.extras.MovieClip(frames);

			child.animationSpeed = child_params.speed || 1;

			child.loop = child_params.loop || false;

			container.addChild(child);

		} else if (child_params.type == 'container') {

			child = new PIXI.Container();

			container.addChild(child);

		} else {

			child = new PIXI.Container();

			container.addChild(child);

		}

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

		if (child_params.hit) {
			if (child_params.hit[0] == 'circle') child.hitArea = new PIXI.Circle (0, 0, child_params.hit[1]);
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

			if (child_params.mask[0] == 'rect') {

				child.mask = new PIXI.Graphics();

				child.mask.beginFill(0x000000);

				if (child_params.mask[5] === true) {

					child.mask.drawRect(child_params.mask[1], child_params.mask[2], child_params.mask[3], child_params.mask[4]);

					child.addChild(child.mask);

				} else {

				child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

				}

			} else if (child_params.mask[0] == 'sprite') {

				if (!child_params.mask[1].name) child_params.mask[1].name = child.name + ' mask';

				if (!child_params.mask[1].type) child_params.mask[1].type = 'sprite';

				child.mask = this.buildChild(child.parent, child_params.mask[1]);

				//Recreate texture to prevent blinking effect (possible Pixi bug?)
				child.mask.texture = PIXI.Texture.fromCanvas(child.mask.texture.baseTexture.source);

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

		child.type = child_params.type;

		if (child_params.name) {

		this[child_params.name] = child;

			child.name = child_params.name;

		}

		child._child_params = child_params;

		Broadcast.call(this.Name + ' build child', [child, child_params]);

		if (is_reposition) this.resizeChild(child);

		return child;

	},

	getTexture: function(name) {

		if (App.resources[name]) return App.resources[name].texture;

		else if (PIXI.utils.TextureCache[name]) return PIXI.utils.TextureCache[name];

		else return App.emptyTexture;

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

	resize: function() {

		this.Scale = App.Scale;

		if (this.isBuild) Broadcast.call(this.Name + ' before resize');

		_.each(this.Containers, function(child_params) {

			if (child_params.type == 'container') {

				var child = this[child_params.name];

				if (child) this.resizeChild(child);

				if (child_params.childs) this.resizeChilds(child_params.childs);

			}

		}, this);

		if (this.isBuild) Broadcast.call(this.Name + ' resize');

	},

	resizeChilds: function(childs) {

		_.each(childs, function(child_params) {

			var child = this[child_params.name];

			if (child) this.resizeChild(child);

				if (child_params.childs) this.resizeChilds(child_params.childs);

		}, this);

	},

	resizeChild: function(child) {

		var child_params = child._child_params;

		this.processOrientationProperties(child_params);

		if (!('scaleStrategy' in child_params) && ('scale' in child_params)) {

			if (!_.isArray(child_params.scale)) child_params.scale = [child_params.scale, child_params.scale];

			child.scale.set(this.calculate(child_params.scale[0]), this.calculate(child_params.scale[1]));

		} else if ('scaleStrategy' in child_params) {

			var scale = null;

			if (child_params.scaleStrategy) scale = this.getScaleByStrategy(child_params.scaleStrategy);

			child.scale.set(scale || 1);

		}

		if ('position' in child_params) {

			if (!_.isArray(child_params.position)) child_params.position = [child_params.position, child_params.position];

			child.position.set(this.calculate(child_params.position[0]), this.calculate(child_params.position[1]));

		} /*else {

			child.position.set(0, 0);

		}*/

		if (child_params.mask) {

			if (child_params.mask[0] == 'rect') {

				if (child_params.mask[5] !== true) {

					child.mask.clear();

					child.mask.beginFill(0x000000);

					child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

				}

			} else if (child_params.mask[0] == 'sprite') {

				this.resizeChild(child.mask);

			}

		}

		if (child_params.draw) {

			child.clear();

			if (!_.isArray(child_params.draw[0])) child_params.draw = [child_params.draw];

			_.each(child_params.draw, function(shape) {

				if (shape[0] == 'rect') {

					child.beginFill(shape[5]);

					child.fillAlpha = shape[6] || 1;

					child.drawRect(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]), this.calculate(shape[4]));

				}

			}, this);

		}

		return scale;

	},

	processOrientationProperties: function(object) {

		_.each(object, function(value, key) {

			if (App.IsLandscape && key.indexOf('Landscape') > 0) object[key.replace('Landscape', '')] = object[key];

			else if (App.IsPortrait && key.indexOf('Portrait') > 0) object[key.replace('Portrait', '')] = object[key];

		});

	},

	getScaleByStrategy: function(scale_strategy) {

		var scale = 1,
			width = App.Width,
			height = App.Height,
			max_scale = 1;

		if (!_.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] == 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 100000;
			else if (scale_strategy[3] == 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		} else if (scale_strategy[0] == 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 100000;
			else if (scale_strategy[3] == 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		}

		return scale;

	},

	calculate: function(value, fixed_multiplier, special_multiplier) {

		if (!value) value = 0;

		if (!fixed_multiplier) fixed_multiplier = 1;

		if (!special_multiplier) special_multiplier = 1;

		if (!_.isArray(value)) value = [value];

		var result = 0;

		_.each(value, function(part) {

			if (_.isString(part)) {

				var direction_multiplier = 1;

				if (part.indexOf('-') === 0) {

					part = part.substr(1);

					direction_multiplier = -1;

				}

				if (part == 'width') result += App.Width * special_multiplier * direction_multiplier;

				else if (part == 'height') result += App.Height * special_multiplier * direction_multiplier;

				else if (part == 'scale') result += App.Scale * special_multiplier * direction_multiplier;

				else if (part.indexOf('width/') === 0) result += App.Width / parseFloat(part.replace('width/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('height/') === 0) result += App.Height / parseFloat(part.replace('height/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('scale/') === 0) result += App.Scale / parseFloat(part.replace('scale/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('scale*') === 0) result += App.Scale * parseFloat(part.replace('scale*', '')) * special_multiplier * direction_multiplier;

				else result = part;

			} else if (_.isFunction(part)) {

				result += part.apply(this, []);

			} else {

				result += part * fixed_multiplier;

			}

		}, this);

		return result;

	},

	valueBySpeed: function(value_per_second) {

		return value_per_second * (this.updateTimeOffset / 1000);

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

				sprite._child_params._over_original_position = sprite._child_params.position;
				sprite._child_params._over_original_scale = sprite._child_params.scale;

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

			}

			var over = event_params.over;

			if (_.isObject(over) && !_.isArray(over)) {

				var tween_params = [];

				if (sprite._child_params._over_original_position) tween_params.push(['position', sprite._child_params._over_original_position, over.time || 200, over.delay || 0, over.ease || Ease.linear]);
				if (sprite._child_params._over_original_scale) tween_params.push(['scale', sprite._child_params._over_original_scale, over.time || 200, over.delay || 0, over.ease || Ease.linear]);

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
				.on('touchendoutside', _.bind(on_up_out_call, this));

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

	tween: function (tween_name, targets, next, options) {

		//console.log('tween', tween_name);

		if (!_.isArray(targets)) targets = [targets];

		if (!options) options = {};

		var tween_props = this.Tweens[tween_name];

		if (!tween_props) {

			if (_.isArray(tween_name)) tween_name = {to: tween_name};

			if (_.isObject(tween_name)) {

				tween_props = tween_name;

				tween_name = JSON.stringify(tween_name);

			}

		}

		if (!tween_props) throw new Error('There are no tween with name "' + tween_name + '". Look at ' + this.Name + ' > .tween()');

		var tween_object = options.tweenObject || {};

		tween_object.targets = targets;
		tween_object.props = tween_props;
		tween_object.next = next;
		tween_object.options = options;
		tween_object.tweens = [];

		if (!tween_object.index) tween_object.index = _.uniqueId();

		if (!tween_object.startingProps) tween_object.startingProps = tween_props;

		for (var i = 0; targets[i]; i++) {

			var target = targets[i] = _.isObject(targets[i]) ? targets[i] : _.result(this, targets[i]);

			if (!target) throw new Error('There are no target with name "' + targets[i] + '". Look at ' + this.Name + ' > .tween()');

			this._tween(target, tween_object, options.delay || 0, {
				override: ('override' in options) ? options.override : true,
				loop: options.loop || false,
				onChange: options.onChange
			});

		}

		return tween_object;

	},

	_tween: function (target, tween_object, additional_delay, options) {

		var tween_props = tween_object.props;

		this._tweenSet(tween_props.set, target);

		if (!tween_props.to) return;

		if (!_.isArray(tween_props.to[0])) tween_props.to = [tween_props.to];

		_.each(tween_props.to, function (to_object) {

			var tween_vars = {};

			if (_.contains(['position', 'scale', 'anchor', 'skew'], to_object[0])) {

				if (!target[to_object[0]]) throw new Error('The are no property "'+to_object[0]+'" in tween target.');

				if (!_.isArray(to_object[1])) to_object[1] = [to_object[1], to_object[1]];

				if (to_object[1][0] || to_object[1][0] === 0) tween_vars.x = this.calculate(to_object[1][0]);
				if (to_object[1][1] || to_object[1][1] === 0) tween_vars.y = this.calculate(to_object[1][1]);

				this._tweenProperty(tween_object, target[to_object[0]], tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear, options);

				if (!options.dontChangeChildParams) target._child_params[to_object[0]] = to_object[1];

			} else if (to_object[0] in target) {

				tween_vars[to_object[0]] = to_object[1];

				this._tweenProperty(tween_object, target, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear, options);

			}

		}, this);

	},

	_tweenSet: function(props, target) {

		if (!props) return;

		if (!_.isArray(props[0])) props = [props];

		var x, y;

		_.each(props, function(set_object) {

			if (_.contains(['position', 'scale', 'anchor', 'skew'], set_object[0])) {

				if (!target[set_object[0]]) throw new Error('The are no property "'+set_object[0]+'" in tween target.');

				if (!_.isArray(set_object[1])) set_object[1] = [set_object[1], set_object[1]];

				x = (set_object[1][0] || set_object[1][0] === 0) ? this.calculate(set_object[1][0]) : target[set_object[0]].x;
				y = (set_object[1][1] || set_object[1][1] === 0) ? this.calculate(set_object[1][1]) : target[set_object[0]].y;

				target[set_object[0]].set(x, y);

			} else if (set_object[0] in target) {

				target[set_object[0]] = this.calculate(set_object[1]);

			}

		}, this);

	},

	_tweenProperty: function (tween_object, target, props, time, delay, ease, options) {

		if (!options) options = {};

		if (!('override' in options)) options.override = true;

		var tween = createjs.Tween.get(target, options).wait(delay || 0).to(props, time, ease).call(function() {

			tween._pc_completed = true;

			this._tweenEnd(tween_object);

		}, [], this);

		tween_object.tweens.push(tween);

	},

	_tweenEnd: function(tween_object) {

		var is_completed = true;

		for (var i=0; tween_object.tweens[i]; i++) {

			if (!tween_object.tweens[i]._pc_completed) is_completed = false;

		}

		if (is_completed) {

			if (tween_object.props.next) {

				this.tween(tween_object.props.next, tween_object.targets, tween_object.next, _.extend(tween_object.options, {tweenObject: tween_object}));

			} else if (tween_object.startingProps.loop) {

				this.tween(tween_object.startingProps, tween_object.targets, tween_object.next, _.extend(tween_object.options, {tweenObject: tween_object}));

			} else {

				if (tween_object.next) tween_object.next.apply(this, [tween_object]);

				}

			}

	},

	stopTween: function (tween_object) {

		if (tween_object) {

			var tweens = tween_object.tweens;

			for (var i = 0, l = tweens.length; i < l; i++) {

				createjs.Tween._tweens = _.without(createjs.Tween._tweens, tweens[i]);

				createjs.Tween.tweens = _.without(createjs.Tween.tweens, tweens[i]);

			}

		}

	},

	show: function() {

		this.showed = true;

		for (var i=0; this._containers[i]; i++) this._containers[i].visible = true;

		this.resize();

		Broadcast.on("Game Update", this.update, this);

		Broadcast.on("Game Resize", this.resize, this);

		Broadcast.call(this.Name + ' showed', arguments);

		this.checkAssets();

	},

	hide: function() {

		this.showed = false;

		for (var i=0; this._containers[i]; i++) this._containers[i].visible = false;

		Broadcast.off("Game Update", this.update, this);

		Broadcast.off("Game Resize", this.resize, this);

		Broadcast.call(this.Name + ' hided');

	},

	bringToTop: function() {

		for (var i = 0; this._containers[i]; i++) App.Stage.addChild(this._containers[i]);

	},

	checkAssets: function() {

		if (this.assetsLoadOnShowChecked) return;

		var assets_for_loading = [];

		_.each(this.Assets, function(asset) {

			if (asset.loadStrategy == 'first show') assets_for_loading.push(asset.name);

		}, this);

		this.assetsLoadOnShowChecked = true;

		if (assets_for_loading.length > 0) App.loadAssets(assets_for_loading, _.bind(function() {

			_.each(this._childs, function(child) {

				var child_params = child._child_params;

				if (child_params.type == 'sprite') {

					if (child.texture == App.emptyTexture) child.texture = this.getTexture(child_params.frame || child_params.image);

				}

			}, this);

		}, this), {strategy: 'first show'});

	}

}); 
