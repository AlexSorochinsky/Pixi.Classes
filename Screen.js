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

		this._emitters = [];

		this._anims = {};

		this._tweens = {};

		this.state = 'idle';

		_.each(this.Events, function(func, name) {

			Broadcast.on(name, function() {

				if (name.indexOf(this.Name) === 0 || this.showed) func.apply(this, arguments);

			}, this);

		}, this);

	},

	build: function() {

		if (!this.Tweens) this.Tweens = {};

		Broadcast.call(this.Name + ' before build');

		_.each(this.Containers, function(container_params) {

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

			if (child_params.childs) this.buildChilds(child_params.childs, child);

		}, this);

	},

	buildChild: function(container, child_params, is_reposition) {

		var child;

		if (child_params.type == 'sprite') {

			if (child_params.image && App.resources[child_params.image]) child = new PIXI.Sprite(App.resources[child_params.image].texture);

			else if (child_params.frame || child_params.image) {

				child = PIXI.Sprite.fromFrame(child_params.frame || child_params.image);

			}

			container.addChild(child);

		} else if (child_params.type == 'tiling-sprite') {

			if (child_params.image) child = new PIXI.TilingSprite(App.resources[child_params.image].texture, child_params.width, child_params.height);

			else if (child_params.frame) child = PIXI.TilingSprite.fromFrame(child_params.frame, child_params.width, child_params.height);

			container.addChild(child);

		} else if (child_params.type == 'emitter') {

			child = new PIXI.particles.Emitter(container, [child_params.image ? PIXI.Texture.fromImage(child_params.image) : PIXI.Texture.fromFrame(child_paramse)], {
				alpha: _.extend({start: 0.8, end: 0.1}, child_params.options.alpha),
				scale: _.extend({start: 1, end: 0.3}, child_params.options.scale),
				color: _.extend({start: "ffffff", end: "ffffff"}, child_params.options.color),
				speed: _.extend({start: 200, end: 100}, child_params.options.speed),
				acceleration: _.extend({x: 100, y: 100}, child_params.options.acceleration),
				startRotation: _.extend({min: 0, max: 360}, child_params.options.startRotation),
				rotationSpeed: _.extend({min: 0, max: 0}, child_params.options.rotationSpeed),
				lifetime: _.extend({min: 0.5, max: 0.5}, child_params.options.lifetime),
				frequency: child_params.options.frequency || 0.008,
				emitterLifetime: child_params.options.emitterLifetime || 0.31,
				maxParticles: child_params.options.maxParticles || 1000,
				pos: {x: 0, y: 0},
				addAtBack: false,
				spawnType: "circle",
				spawnCircle: {x: 0, y: 0, r: 10}
			});

			child.emit = false;

			this._emitters.push(child);

		} else if (child_params.type == 'text') {

			child = new PIXI.Text(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type == 'bitmap-text') {

			child = new PIXI.extras.BitmapText(child_params.text, child_params.styles);

			container.addChild(child);

		} else if (child_params.type == 'container') {

			child = new PIXI.Container();

			container.addChild(child);

		} else if (child_params.type == 'graphics') {

			child = new PIXI.Graphics();

			if (!_.isArray(child_params.draw[0])) child_params.draw = [child_params.draw];

			_.each(child_params.draw, function(shape) {

				if (shape[0] == 'rect') {

					child.beginFill(shape[5]);

					child.drawRect(this.calculate(shape[1]), this.calculate(shape[2]), this.calculate(shape[3]), this.calculate(shape[4]));

				}

			}, this);

			container.addChild(child);

		} else if (child_params.type == 'movie-clip') {

			var frames = _.map(child_params.frames, function(image) {

				return App.resources[image] ? App.resources[image].texture : PIXI.Texture.fromFrame(image);

			});

			child = new PIXI.extras.MovieClip(frames);

			child.animationSpeed = child_params.speed || 1;

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

		if (child.anchor) {
			if (child_params.anchor) child.anchor.set(child_params.anchor[0], child_params.anchor[1]);
			else child.anchor.set(0.5, 0.5);
		}

		if (child_params.tint) child.tint = child_params.tint;

		child.type = child_params.type;

		if (child_params.name) {

		this[child_params.name] = child;

			child.name = child_params.name;

		}

		child._child_params = child_params;

		if (is_reposition) this.resizeChild(child);

		return child;

	},

	update: function() {

		this.updateTimeOffset = App.time - this.updateTime;

		this.updateTime = App.time;

		_.each(this._emitters, function(emitter) {

			emitter.update(this.updateTimeOffset * 0.001);

		}, this);

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

		if ('position' in child_params) {

			if (!_.isArray(child_params.position)) child_params.position = [child_params.position, child_params.position];

			if (child.type == 'emitter') child.spawnPos = {x: this.calculate(child_params.position[0]), y: this.calculate(child_params.position[1])};

			else child.position.set(this.calculate(child_params.position[0]), this.calculate(child_params.position[1]));

		} else {

			if (child.type == 'emitter') child.spawnPos = {x: 0, y: 0};

			else if (child.type == 'container') child.position.set(App.CenterX, App.CenterY);

			else child.position.set(0, 0);

		}

		if ('scale' in child_params) {

			if (!_.isArray(child_params.scale)) child_params.scale = [child_params.scale, child_params.scale];

			if (child.type == 'emitter') {

				child.startScale = this.calculate(child_params.scale[0]);
				child.endScale = this.calculate(child_params.scale[1])

			}

			else child.scale.set(this.calculate(child_params.scale[0]), this.calculate(child_params.scale[1]));

		} else {

			if (child.type == 'emitter') child.startScale = child.endScale = 1;

			else if (child.type == 'container') {

				var scale = App.Scale;

				if (child_params.scaleStrategy) scale = this.getScaleByStrategy(child_params.scaleStrategy);

				child.scale.set(scale);

			}

			else child.scale.set(1);

		}

		if ('alpha' in child_params) child.alpha = this.calculate(child_params.alpha);
		if ('rotation' in child_params) child.rotation = this.calculate(child_params.rotation);

		if ('width' in child_params) child.width = this.calculate(child_params.width);
		if ('height' in child_params) child.height = this.calculate(child_params.height);

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

		return scale;

	},

	getScaleByStrategy: function(scale_strategy) {

		var scale = 1,
			width = App.Width,
			height = App.Height;

		if (!_.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] == 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(App.Width / width, App.Height / height);

			if (scale > 1 && scale_strategy[3] !== false) scale = 1;

		} else if (scale_strategy[0] == 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(App.Width / width, App.Height / height);

			if (scale > 1 && scale_strategy[3] !== false) scale = 1;

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

		};

		var on_over_change = function() {

			var over = event_params.over;

			if (over) {

				if (_.isFunction(over)) over = over.apply(this, []);

				if (over) {

					var actions = _.isArray(over) ? over : [over];

					if (!_.isArray(actions[0])) actions = [actions];

					for (var i = 0; actions[i]; i++) {

						var action = actions[i];

						var tween = this.Tweens[action[0]];

						if (!tween) throw new Error('There are no tween with name "' + action[0] + '". Look at "' + this.Name + '".Tweens definition or "' + this.Name + '".Containers.<child>.<event>.<over> definition.');

						if (!action[1]) action[1] = sprite;

						this.tween(action[0], action[1]);

					}

				}

			}

		};

		var on_out_change = function() {

			var out = event_params.out;

			if (out) {

				if (_.isFunction(out)) out = out.apply(this, []);

				if (out) {

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

		if (App.IsTouchDevice) {

			sprite
				.on('touchstart', _.bind(on_down_call, this))
				.on('touchend', _.bind(on_up_call, this))
				.on('touchendoutside', _.bind(on_up_out_call, this));

			if (event_params.move) {

				sprite
					.on('touchmove', _.bind(on_move_call, this))

			}

			if (event_params.down || event_params.up) {

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

	startAnimation: function(animation_name, delay, next) {

		if (!this._anims[animation_name]) this._anims[animation_name] = {_tweens: [], _delays: []};

		var animation_props = this.Animations[animation_name];

		if (_.isArray(animation_props)) {

			var duration = 0;

			_.each(animation_props, function(animation_line_params) {

				if (!_.isArray(animation_line_params[0])) animation_line_params[0] = [animation_line_params[0]];

				_.each(animation_line_params[0], function(target_name) {

					var result = this._animate(animation_name, this[target_name], this.Animations[animation_line_params[1]], animation_line_params[2] + (delay || 0));

					if (duration < result.duration) duration = result.duration;

				}, this);

			}, this);

			clearTimeout(this._anims[animation_name].endTimeout);
			this._anims[animation_name].endTimeout = setTimeout(_.bind(function() {

				this.stopAnimation(animation_name, false);

				if (next) next.apply(this, []);

			}, this), duration);

		} else {

			var result = this._animate(animation_name, this[animation_props.target], animation_props,  delay || 0);

			clearTimeout(this._anims[animation_name].endTimeout);
			this._anims[animation_name].endTimeout = setTimeout(_.bind(function() {

				this.stopAnimation(animation_name, false);

				if (!("complete" in animation_props)) animation_props.complete = animation_props.animate;

				if (animation_props.complete) this._animateSet(animation_props.complete, this[animation_props.target]);

				if (animation_props.next) this.startAnimation(animation_props.next, 0, next);

				else if (next) next.apply(this, []);

			}, this), result.duration);

		}

	},

	_animate: function(animation_name, target, animation_props, additional_delay) {

		var duration = 0;

		this._animateSet(animation_props.set, target);

		_.each(animation_props.animate, function(to_object) {

			var tween_vars = {},
				end_time = to_object[2] + (to_object[3] ? to_object[3] : 0) + (additional_delay || 0);

			if (to_object[0] == 'position') {

				tween_vars.x = this.calculate(to_object[1][0]);
				tween_vars.y = this.calculate(to_object[1][1]);

				this._animateProperty(animation_name, target.position, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			} else if (to_object[0] == 'scale') {

				tween_vars.x = to_object[1];
				tween_vars.y = to_object[1];

				this._animateProperty(animation_name, target.scale, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			} else if (to_object[0] in target) {

				tween_vars[to_object[0]] = to_object[1];

				this._animateProperty(animation_name, target, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			}

			if (duration < end_time) duration = end_time;

		}, this);

		return {duration: duration};

	},

	_animateSet: function(props, target) {

		if (!props) return;

		if (!_.isArray(props[0])) props = [props];

		_.each(props, function(set_object) {

			if (set_object[0] == 'position') {

				target.position.set(this.calculate(set_object[1][0]), this.calculate(set_object[1][1]));

			} else if (set_object[0] == 'scale') {

				target.scale.set(this.calculate(set_object[1]), this.calculate(set_object[1]));

			} else if (set_object[0] in target) {

				target[set_object[0]] = this.calculate(set_object[1]);

			}

		}, this);

	},

	_animateProperty: function(animation_name, object, props, time, delay, ease) {

		if (this._anims[animation_name]) {

			var _this = this;

			this._anims[animation_name]._delays.push(setTimeout(function() {

				_this._anims[animation_name]._tweens.push(createjs.Tween.get(object, {override:true}).to(props, time, ease));

			}, delay || 0));

		}

	},

	stopAnimation: function(animation_name, is_stop_tweens) {

		if (this._anims[animation_name]) {

			clearTimeout(this._anims[animation_name].endTimeout);

			if (is_stop_tweens !== false) {

			var tweens = this._anims[animation_name]._tweens;
				for (var i=0, l=tweens.length; i<l; i++) createjs.Tween._tweens = _.without(createjs.Tween._tweens, tweens[i]);

			}

			var delays = this._anims[animation_name]._delays;
			for (i=0, l=delays.length; i<l; i++) clearTimeout(delays[i]);

		}

	},

	tween: function (tween_name, targets, next, options) {

		//console.log('tween', tween_name);

		if (!_.isArray(targets)) targets = [targets];

		if (!options) options = {};

		var tween_props = this.Tweens[tween_name];

		if (!tween_props) throw new Error('There are no tween with name "' + tween_name + '". Look at ' + this.Name + '.tween()');

		var max_duration = 0;

		for (var i = 0; targets[i]; i++) {

			var target = _.isObject(targets[i]) ? targets[i] : _.result(this, targets[i]);

			if (!target) throw new Error('There are no target with name "' + targets[i] + '". Look at ' + this.Name + '.tween()');

			var tween_index = options.index || (target.name + ' > ' + tween_name);

			if (target.tween_index) this.stopTween(target, target.tween_index, true);

			var tween_object = this._anims[tween_index] = {index: tween_index, props: tween_props, _tweens: [], _delays: []};

			var result = this._tween(target, tween_object, options.delay || 0);

			if (max_duration < result.duration) max_duration = result.duration;

		}

		clearTimeout(tween_object.endTimeout);
		tween_object.endTimeout = setTimeout(_.bind(function () {

			if (!("complete" in tween_props)) tween_props.complete = tween_props.animate;

			if (tween_props.complete) {

				for (var i = 0; targets[i]; i++) {

					var target = _.isObject(targets[i]) ? targets[i] : _.result(this, targets[i]);

					this._animateSet(tween_props.complete, target);

					var tween_index = options.index || (target.name + ' > ' + tween_name);

					//console.log('endTimeout', tween_name);

					this.stopTween(target, tween_index, false);

				}

			}

			if (next) next.apply(this, []);

		}, this), max_duration);

	},

	_tween: function (target, tween_object, additional_delay) {

		//console.log('_tween', this.Name);

		var duration = 0;

		var tween_props = tween_object.props;

		target.tween_index = tween_object.index;

		this._animateSet(tween_props.set, target);

		if (!tween_props.animate) return {duration: 0};

		if (!_.isArray(tween_props.animate[0])) tween_props.animate = [tween_props.animate];

		_.each(tween_props.animate, function (to_object) {

			var tween_vars = {},
				end_time = to_object[2] + (to_object[3] ? to_object[3] : 0) + (additional_delay || 0);

			if (to_object[0] == 'position') {

				tween_vars.x = this.calculate(to_object[1][0]);
				tween_vars.y = this.calculate(to_object[1][1]);

				this._tweenProperty(tween_object, target.position, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			} else if (to_object[0] == 'scale') {

				tween_vars.x = to_object[1];
				tween_vars.y = to_object[1];

				this._tweenProperty(tween_object, target.scale, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			} else if (to_object[0] in target) {

				tween_vars[to_object[0]] = to_object[1];

				this._tweenProperty(tween_object, target, tween_vars, to_object[2], (to_object[3] || 0) + (additional_delay || 0), to_object[4] || createjs.Ease.linear);

			}

			if (duration < end_time) duration = end_time;

		}, this);

		return {duration: duration};

	},

	_tweenProperty: function (tween_object, target, props, time, delay, ease) {

		tween_object._delays.push(setTimeout(function () {

			tween_object._tweens.push(createjs.Tween.get(target, {override: true}).to(props, time, ease));

		}, delay || 0));

	},

	stopTween: function (target, tween_index, is_stop_tweens) {

		//console.log('stopTween', tween_index);

		if (this._anims[tween_index]) {

			clearTimeout(this._anims[tween_index].endTimeout);

			if (is_stop_tweens !== false) {

				var tweens = this._anims[tween_index]._tweens;

				for (var i = 0, l = tweens.length; i < l; i++) createjs.Tween._tweens = _.without(createjs.Tween._tweens, tweens[i]);

			}

			var delays = this._anims[tween_index]._delays;
			for (i = 0, l = delays.length; i < l; i++) clearTimeout(delays[i]);

			delete this._anims[tween_index];

		}

		delete target.tween_index;

	},

	show: function() {

		this.showed = true;

		for (var i=0; this._containers[i]; i++) this._containers[i].visible = true;

		this.resize();

		Broadcast.on("Game Update", this.update, this);

		Broadcast.on("Game Resize", this.resize, this);

		Broadcast.call(this.Name + ' showed', arguments);

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

	}

}); 
