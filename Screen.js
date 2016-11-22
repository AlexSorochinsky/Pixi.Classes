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

		this._dom_containers = {};

		this._emitters = [];

		this._anims = {};

		this.state = 'idle';

		_.each(this.Events, function(func, name) {

			Broadcast.on(name, function() {

				if (name.indexOf(this.Name) === 0 || this.showed) func.apply(this, arguments);

			}, this);

		}, this);

	},

	build: function() {

		Broadcast.call(this.Name + ' before build');

		_.each(this.Containers, function(container_params) {

			if (!container_params.type) container_params.type = 'container';

			if (container_params.type == 'dom-container') this.buildDOMContainer(container_params);

			else this.buildContainer(container_params);

		}, this);

		this.updateTime = App.time;

		this.isBuild = true;

		Broadcast.call(this.Name + ' build');

	},

	buildContainer: function(container_params) {

			var container_name = container_params.name;

			var container_objects = container_params.childs;

			var container = this[container_name] = new PIXI.Container();

			container.type = container_params.type;

			container._object_params = container_params;

			App.MainStage.addChild(container);

			this._containers.push(container);

			container.visible = false;

			this.buildChilds(container_objects, container);

	},

	buildChilds: function(childs, container) {

		_.each(childs, function(child_params) {

			var child = this.buildChild(container, child_params);

			if (child_params.childs) this.buildChilds(child_params.childs, child);

		}, this);

	},

	buildChild: function(container, object_params) {

		var child;

		if (object_params.type == 'sprite') {

			if (object_params.image) child = new PIXI.Sprite(App.resources[object_params.image].texture);

			else if (object_params.frame) {

				child = PIXI.Sprite.fromFrame(object_params.frame);

			}

			container.addChild(child);

		} else if (object_params.type == 'tiling-sprite') {

			if (object_params.image) child = new PIXI.TilingSprite(App.resources[object_params.image].texture, object_params.width, object_params.height);

			else if (object_params.frame) child = PIXI.TilingSprite.fromFrame(object_params.frame, object_params.width, object_params.height);

			container.addChild(child);

		} else if (object_params.type == 'emitter') {

			child = new PIXI.particles.Emitter(container, [object_params.image ? PIXI.Texture.fromImage(object_params.image) : PIXI.Texture.fromFrame(object_params.frame)], {
				alpha: _.extend({start: 0.8, end: 0.1}, object_params.options.alpha),
				scale: _.extend({start: 1, end: 0.3}, object_params.options.scale),
				color: _.extend({start: "ffffff", end: "ffffff"}, object_params.options.color),
				speed: _.extend({start: 200, end: 100}, object_params.options.speed),
				acceleration: _.extend({x: 100, y: 100}, object_params.options.acceleration),
				startRotation: _.extend({min: 0, max: 360}, object_params.options.startRotation),
				rotationSpeed: _.extend({min: 0, max: 0}, object_params.options.rotationSpeed),
				lifetime: _.extend({min: 0.5, max: 0.5}, object_params.options.lifetime),
				frequency: object_params.options.frequency || 0.008,
				emitterLifetime: object_params.options.emitterLifetime || 0.31,
				maxParticles: object_params.options.maxParticles || 1000,
				pos: {x: 0, y: 0},
				addAtBack: false,
				spawnType: "circle",
				spawnCircle: {x: 0, y: 0, r: 10}
			});

			child.emit = false;

			this._emitters.push(child);

		} else if (object_params.type == 'bitmap-text') {

			child = new PIXI.extras.BitmapText(object_params.text, object_params.styles);

			container.addChild(child);

		} else if (object_params.type == 'container') {

			child = new PIXI.Container();

			container.addChild(child);

		}

		var event_params = object_params.event || object_params.button;

		if (event_params) this.enableEvents(child, _.isString(object_params.event) ? object_params.event : (_.isString(object_params.button) ? object_params.button : object_params.name), event_params, object_params.button);

		if (object_params.button) {
			child.defaultCursor = 'pointer';
			child.buttonMode = true;
		}

		if (event_params && event_params.cursor) {
			child.defaultCursor = event_params.cursor;
			child.buttonMode = true;
		}

		if (object_params.hit) {
			if (object_params.hit[0] == 'circle') child.hitArea = new PIXI.Circle (0, 0, object_params.hit[1]);
		}

		if (object_params.visible === false) child.visible = false;

		if (child.filters) {
			if (object_params.shadow) {
				var dropShadowFilter = new PIXI.filters.DropShadowFilter();
				dropShadowFilter.color = object_params.shadow.color || 0x000000;
				dropShadowFilter.alpha = object_params.shadow.alpha || 0.2;
				dropShadowFilter.blur = object_params.shadow.blur || 6;
				dropShadowFilter.distance = object_params.shadow.distance || 20;
			}
		}

		if (child.anchor) {
			if (object_params.anchor) child.anchor.set(object_params.anchor[0], object_params.anchor[1]);
			else child.anchor.set(0.5, 0.5);
		}

		child.name = object_params.name;
		child.type = object_params.type;

		this[object_params.name] = child;

		child._object_params = object_params;

		return child;

	},

	buildDOMContainer: function(container_params, z_index) {

		var container_name = container_params.name;

		var container = this._dom_containers[container_name] = this[container_name] = {
			el: document.createElement('div'),
			els: {},
			x: 0,
			y: 0,
			transformOrigin: container_params.transformOrigin || ['center', 'center'],
			applyTransform: function() {

				this.positionTransform = 'translate('+Math.round(this.x)+'px, '+Math.round(this.y)+'px)';

				var transform_origin = this.transformOrigin.join(' ');
				var transform = this.positionTransform;

				if (transform_origin != this._transform_origin) {
					this.el.style.transformOrigin = transform_origin;
					this._transform_origin = transform_origin;
				}

				if (transform != this._transform) {
					this.el.style.WebkitTransform = transform;
					this.el.style.transform = transform;
					this._transform = transform;
				}

			}
		};

		//Mixin.Transform.Create(container);

		//Mixin.Scale.Create(container);

		container.el.className = 'dom-container ' + container_name.toLowerCase();

		container.name = container_name;

		container.width = container_params.width;

		container.height = container_params.height;

		container.scale = container_params.scale;

		this.buildDOMChilds(container_name, container_params.childs);

		return container;

	},

	buildDOMChilds: function(container_name, dom_childs) {

		_.each(dom_childs, function(params) {

			if (params[2] && params[2].template) {

				this.registerDomObjectPool(params[0], params[1])

			} else {

				var dom_structure = this.createDOMStructure(params);

				dom_structure.name = params[1];

				dom_structure.params = params;

				this._dom_containers[container_name].el.appendChild(dom_structure.el);

				_.extend(this._dom_containers[container_name].els, dom_structure.els);

			}

		}, this);

	},

	createDOMStructure: function(params, els) {

		if (!els) els = {};

		if (_.isString(params)) {

			var text = document.createTextNode(params);

			return {el: text, els: els};

		}

		var el = document.createElement(params[0]);

		el.className = params[1];

		if (!els[el.className]) els[el.className] = el;
		else if (_.isArray(els[el.className])) els[el.className].push(el);
		else els[el.className] = [els[el.className], el];

		if (_.isObject(params[2])) {

			if (params[2].scale) el._scaleStyles = params[2].scale;

			if (params[2].event) this.applyDOMEvents(el, params[2].event, params);

			if (params[2].attrs) this.applyDOMAttributes(el, params[2].attrs);

		}

		var last_param = params[params.length-1];

		if (_.isString(last_param) && params.length > 2) el.innerHTML = last_param;

		else if (_.isArray(last_param)) _.each(last_param, function(params) {

			el.appendChild(this.createDOMStructure(params, els).el);

		}, this);

		return {el: el, els: els};

	},

	applyDOMEvents: function (el, code, params) {

		var name = this.Name;

		if (App.IsTouchDevice) {

			el.addEventListener("touchstart", function (e) {

				var clickpos = Screen.prototype.getMousePositionDistance(e);

				this.setAttribute('clickpos', clickpos);

			}, false);

			el.addEventListener("touchend", function (e) {

				var clickpos = Screen.prototype.getMousePositionDistance(e);

				if (Math.abs(parseFloat(this.getAttribute('clickpos')) - clickpos) < 20) Broadcast.fireEvent(name + ' ' + code + ' click', [e, el]);

			}, false);

		}

		else {

			el.addEventListener("click", function(e) {

				Broadcast.call(name + ' ' + code + ' click', [e, el, params]);

			}, false);

			el.addEventListener("mouseup", function(e) {

				if (params[2].event) Screen.PressEndEvents.push(params[2].event);

				Broadcast.call(name + ' ' + code + ' click', [e, el, params]);

			}, false);

		}

	},

	getMousePositionDistance: function (e) {

		e = e || window.event;

		var pageX, pageY;

		if (e.changedTouches && e.changedTouches[0]) {

			pageX = e.changedTouches[0].pageX;

			pageY = e.changedTouches[0].pageY;

		} else {

			pageX = e.pageX;

			pageY = e.pageY;

		}

		if (pageX === undefined) {

			if ('clientX' in e) {

				pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;

				pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;

			}

		}

		return Math.sqrt(pageX * pageX + pageY * pageY);

	},

	applyDOMAttributes: function(el, attrs) {

		_.each(attrs, function(value, name) {

			el.setAttribute(name, value);

		});

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

		this.resizeChilds(this.Containers);

		if (this.isBuild) Broadcast.call(this.Name + ' resize');

	},

	resizeChilds: function(childs) {

		_.each(childs, function(child_params) {

			if (child_params.type == 'dom-container') {

				var container = this._dom_containers[child_params.name];

				//var container_width = container.width;
				//var container_height = container.height;

				var scale = App.Scale;

				if (child_params.scaleStrategy) scale = this.getScaleByStrategy(child_params.scaleStrategy);

				if (child_params.position) {

					container.x = this.calculate(child_params.position[0]);
					container.y = this.calculate(child_params.position[1]);

				} else {

					container.x = (App.Width / App.PixelRatio) * 0.5;
					container.y = (App.Height / App.PixelRatio) * 0.5;

				}

				container.applyTransform();

				this.scaleStyles(container.els, scale);

				/*_.each(container.DomObjects, function(dom_object_props) {

					var dom_object = this[dom_object_props[0]];

					if (dom_object) this.scaleStyles(dom_object.els, scale);

				}, this);*/

				//if (child_params.childs) this.resizeDOMChilds(child_params.childs);

			} else {

				this.resizeChild(child_params);

				if (child_params.childs) this.resizeChilds(child_params.childs);

			}

		}, this);

	},

	resizeChild: function(child_params) {

		var child = this[child_params.name];

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

		if ('width' in child_params) child.width = this.calculate(child_params.width);
		if ('height' in child_params) child.height = this.calculate(child_params.height);

		if (child_params.mask) {

			if (child_params.mask[0] == 'rect') {

				child.mask = new PIXI.Graphics();

				child.mask.beginFill(0x000000);

				child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

			}

		}

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

	scaleStyles: function(els, scale) {

		_.each(els, function(inner_els) {

			if (!_.isArray(inner_els)) inner_els = [inner_els];

			_.each(inner_els, function(el) {

				var styles = el._scaleStyles;

				_.each(styles, function(style_params, style) {

					this.scaleStyle(el, style, style_params, scale);

				}, this);

			}, this);

		}, this);

	},

	scaleStyle: function(el, style, style_params, scale) {

		if (!_.isArray(style_params)) style_params = [style_params];

		var values = _.map(style_params, function(style_param) {

			if (_.contains(style_param, ['px', '%'])) return style_param;

			var v = this.calculate(style_param, scale, 1 / App.PixelRatio);

			return v;

		}, this);

		values = _.map(values, function(value) {

			if (_.isNumber(value)) return ((value > 0) ? Math.ceil(value) : Math.floor(value)) + 'px';

		});

		el.style[style] = values.join(' ');

		//console.log(el, style, style_params, scale, values, values.join(' '));

	},

	calculate: function(value, fixed_multiplier, special_multiplier) {

		if (!value) value = 0;

		if (!fixed_multiplier) fixed_multiplier = 1;

		if (!special_multiplier) special_multiplier = 1;

		if (!_.isArray(value)) value = [value];

		var result = 0;

		_.each(value, function(part) {

			if (_.isString(part)) {

				if (part == 'width') result += App.Width * special_multiplier;

				else if (part == 'height') result += App.Height * special_multiplier;

				else if (part == 'scale') result += App.Scale * special_multiplier;

				else if (part.indexOf('width/') === 0) result += App.Width / parseFloat(part.replace('width/', '')) * special_multiplier;

				else if (part.indexOf('height/') === 0) result += App.Height / parseFloat(part.replace('height/', '')) * special_multiplier;

				else if (part.indexOf('scale/') === 0) result += App.Scale / parseFloat(part.replace('scale/', '')) * special_multiplier;

				else if (part.indexOf('scale*') === 0) result += App.Scale * parseFloat(part.replace('scale*', '')) * special_multiplier;

			} else {

				result += part * fixed_multiplier;

			}

		}, this);

		return result;

	},

	valueBySpeed: function(value_per_second) {

		return value_per_second * (this.updateTimeOffset / 1000);

	},

	enableEvents: function(sprite, name, event_params, button_params) {

		sprite.interactive = true;

		var on_down_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' down', [sprite, arguments[0], arguments[1]]);

		};

		var on_up_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' up', [sprite, arguments[0], arguments[1]]);
			Broadcast.call(this.Name + ' ' + name + ' click', [sprite, arguments[0], arguments[1]]);

		};

		var on_up_out_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' up outside', [sprite, arguments[0], arguments[1]]);

		};

		var on_over_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' over', [sprite, arguments[0], arguments[1]]);

		};

		var on_out_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' out', [sprite, arguments[0], arguments[1]]);

		};

		var on_move_call = function() {

			Broadcast.call(this.Name + ' ' + name + ' move', [sprite, arguments[0], arguments[1]]);

		};

		var on_down_change = function() {

			var down_sprite = _.result(this, event_params.down);

			if (down_sprite) {

				sprite.alpha = 0.01;
				down_sprite.visible = true;

			}

		};

		var on_up_change = function() {

			var down_sprite = _.result(this, event_params.down);

			if (down_sprite) {

				sprite.alpha = 1;
				down_sprite.visible = false;

			}

		};

		var on_over_change = function() {

			var over_sprite = _.result(this, event_params.over);

			if (over_sprite) {

				sprite.alpha = 0.01;
				over_sprite.visible = true;

			}

		};

		var on_out_change = function() {

			var over_sprite = _.result(this, event_params.over);

			if (over_sprite) {

				sprite.alpha = 1;
				over_sprite.visible = false;

			}

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

			if (button_params) {

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
				.on('mouseout', _.bind(on_out_call, this));

			if (event_params.move) {

				sprite
					.on('mousemove', _.bind(on_move_call, this))

			}

			if (button_params) {

				sprite
					.on('mousedown', _.bind(on_down_change, this))
					.on('mouseup', _.bind(on_up_change, this))
					.on('mouseupoutside', _.bind(on_up_change, this))
					.on('mouseover', _.bind(on_over_change, this))
					.on('mouseout', _.bind(on_out_change, this));

			}

		}

	},

	startAnimation: function(animation_name, delay, next) {

		if (!this._anims[animation_name]) this._anims[animation_name] = {_tweens: [], _delays: [], _duration: 0};

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

			var tween_vars = {overwrite: 'concurrent', ease: to_object[4] || Power0.easeNone},
				end_time = to_object[2] + (to_object[3] ? to_object[3] : 0) + (additional_delay || 0);

			if (to_object[0] == 'position') {

				tween_vars.x = this.calculate(to_object[1][0]);
				tween_vars.y = this.calculate(to_object[1][1]);

				this._animateProperty(animation_name, target.position, tween_vars, to_object[2] / 1000, (to_object[3] || 0) + (additional_delay || 0));

			} else if (to_object[0] == 'scale') {

				tween_vars.x = to_object[1];
				tween_vars.y = to_object[1];

				this._animateProperty(animation_name, target.scale, tween_vars, to_object[2] / 1000, (to_object[3] || 0) + (additional_delay || 0));

			} else if (to_object[0] == 'alpha') {

				tween_vars.alpha = to_object[1];

				this._animateProperty(animation_name, target, tween_vars, to_object[2] / 1000, (to_object[3] || 0) + (additional_delay || 0));

			}

			if (duration < end_time) duration = end_time;

		}, this);

		return {duration: duration};

	},

	_animateSet: function(props, target) {

		_.each(props, function(set_object) {

			if (set_object[0] == 'position') {

				target.position.set(this.calculate(set_object[1][0]), this.calculate(set_object[1][1]));

			} else if (set_object[0] == 'scale') {

				target.scale.set(this.calculate(set_object[1]), this.calculate(set_object[1]));

			} else if (set_object[0] == 'alpha') {

				target.alpha = this.calculate(set_object[1]);

			}

		}, this);

	},

	_animateProperty: function(animation_name, object, props, time, delay, ease) {

		if (this._anims[animation_name]) {

			var _this = this;

			this._anims[animation_name]._delays.push(setTimeout(function() {

				_this._anims[animation_name]._tweens.push(TweenLite.to(object, time, props));

			}, delay || 0));

		}

	},

	stopAnimation: function(animation_name, is_stop_tweens) {

		if (this._anims[animation_name]) {

			clearTimeout(this._anims[animation_name].endTimeout);

			if (is_stop_tweens !== false) {

			var tweens = this._anims[animation_name]._tweens;
			for (var i=0, l=tweens.length; i<l; i++) tweens[i].kill();

			}

			var delays = this._anims[animation_name]._delays;
			for (i=0, l=delays.length; i<l; i++) clearTimeout(delays[i]);

		}

	},

	show: function() {

		this.showed = true;

		for (var i=0; this._containers[i]; i++) this._containers[i].visible = true;

		_.each(this._dom_containers, function(dom_container) {

			document.body.appendChild(dom_container.el);

		});

		this.resize();

		Broadcast.on("Game Update", this.update, this);

		Broadcast.on("Game Resize", this.resize, this);

		Broadcast.call(this.Name + ' showed');

	},

	hide: function() {

		this.showed = false;

		for (var i=0; this._containers[i]; i++) this._containers[i].visible = false;

		_.each(this._dom_containers, function(dom_container) {

			if (dom_container.el.parentNode) dom_container.el.parentNode.removeChild(dom_container.el);

		});

		Broadcast.off("Game Update", this.update, this);

		Broadcast.off("Game Resize", this.resize, this);

		Broadcast.call(this.Name + ' hided');

	}

}); 

Screen.PressEndEvents = [];

Broadcast.on("Document Press Up", function(e) {

	Broadcast.call("Global Press End", [e, Screen.PressEndEvents]);

	Screen.PressEndEvents = [];

}, this);