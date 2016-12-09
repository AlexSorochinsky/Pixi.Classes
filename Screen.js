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

		this._dom_object_pools = {};

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

			container._child_params = container_params;

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

	buildChild: function(container, child_params) {

		var child;

		if (child_params.type == 'sprite') {

			if (child_params.image) child = new PIXI.Sprite(App.resources[child_params.image].texture);

			else if (child_params.frame) {

				child = PIXI.Sprite.fromFrame(child_params.frame);

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

		}

		var event_params = child_params.event || child_params.button;

		if (event_params) this.enableEvents(child, _.isString(child_params.event) ? child_params.event : (_.isString(child_params.button) ? child_params.button : child_params.name), event_params, child_params.button);

		if (child_params.button) {
			child.defaultCursor = 'pointer';
			child.buttonMode = true;
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

				child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

				if (child_params.mask[5] === true) child.addChild(child.mask);

			} else if (child_params.mask[0] == 'sprite') {

				if (!child_params.mask[1].name) child_params.mask[1].name = child.name + ' mask';

				if (!child_params.mask[1].type) child_params.mask[1].type = 'sprite';

				child.mask = this.buildChild(child.parent, child_params.mask[1]);

			} else if (child_params.mask[0] == 'existing-sprite') {

				if (!this[child_params.mask[1]]) throw new Error('Sprite not found in sprite mask definition. ' + this.Name + ' > ' + child_params.name);

				child.mask = this[child_params.mask[1]];

			}

		}

		if (child.anchor) {
			if (child_params.anchor) child.anchor.set(child_params.anchor[0], child_params.anchor[1]);
			else child.anchor.set(0.5, 0.5);
		}

		child.name = child_params.name;
		child.type = child_params.type;

		this[child_params.name] = child;

		child._child_params = child_params;

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

				var dom_structure = this.createDOMStructure(params);

				dom_structure.name = params[1];

				dom_structure.params = params;

				this._dom_containers[container_name].el.appendChild(dom_structure.el);

				_.extend(this._dom_containers[container_name].els, dom_structure.els);

		}, this);

	},

	createDOMStructure: function(params, els) {

		if (!els) els = {};

		if (_.isString(params)) {

			var text = document.createTextNode(params);

			return {el: text, els: els};

		}

		if (_.isObject(params[2]) && params[2].template) return this.registerDOMObjectPool(params[1], params);

		var el = document.createElement(params[0]);

		el.className = params[1];

		if (!els[el.className]) els[el.className] = el;
		else if (_.isArray(els[el.className])) els[el.className].push(el);
		else els[el.className] = [els[el.className], el];

		if (_.isObject(params[2])) {

			if (params[2].scale) el._scaleStyles = params[2].scale;

			if (params[2].event) this.applyDOMEvents(el, params[2].event, params);

			if (params[2].attr) this.applyDOMAttributes(el, params[2].attr);

		}

		var last_param = params[params.length-1];

		if (_.isString(last_param) && params.length > 2) el.innerHTML = last_param;

		else if (_.isArray(last_param)) _.each(last_param, function(params) {

			var inner_dom_structure = this.createDOMStructure(params, els);

			if (inner_dom_structure) el.appendChild(inner_dom_structure.el);

		}, this);

		return {el: el, els: els};

	},

	applyDOMEvents: function (el, event_params, child_params) {

		if (_.isString(event_params)) event_params = {name: event_params};

		var code = event_params.name,
			name = this.Name,
			_this = this;

		if (App.IsTouchDevice) {

			el.addEventListener("touchstart", function (e) {

				var clickpos = Screen.prototype.getMousePositionDistance(e);

				this.setAttribute('clickpos', clickpos);

			}, false);

			el.addEventListener("touchend", function (e) {

				var clickpos = Screen.prototype.getMousePositionDistance(e);

				if (Math.abs(parseFloat(this.getAttribute('clickpos')) - clickpos) < 20) Broadcast.fireEvent(name + ' ' + code + ' click', [e, el]);

			}, false);

		} else {

			el.addEventListener("mouseover", function(e) {

				Broadcast.call(name + ' ' + code + ' over', [e, el, child_params]);

			}, false);

			el.addEventListener("mouseout", function(e) {

				Broadcast.call(name + ' ' + code + ' out', [e, el, child_params]);

			}, false);

			el.addEventListener("mousedown", function(e) {

				Broadcast.call(name + ' ' + code + ' down', [e, el, child_params]);

			}, false);

			el.addEventListener("mouseup", function(e) {

				Screen.PressEndEvents.push(code);

				Broadcast.call(name + ' ' + code + ' up', [e, el, child_params]);

			}, false);

			el.addEventListener("click", function(e) {

				Broadcast.call(name + ' ' + code + ' click', [e, el, child_params]);

			}, false);

		}

		el.addEventListener("change", function(e) {

			Broadcast.call(name + ' ' + code + ' change', [e, el, child_params]);

		}, false);

		el.addEventListener("keypress", function(e) {

			Broadcast.call(name + ' ' + code + ' keypress', [e, el, child_params]);

		}, false);

		el.addEventListener("keydown", function(e) {

			Broadcast.call(name + ' ' + code + ' keydown', [e, el, child_params]);

		}, false);

		el.addEventListener("keyup", function(e) {

			Broadcast.call(name + ' ' + code + ' keyup', [e, el, child_params]);

		}, false);

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

	applyDOMAttributes: function(el, attributes) {

		_.each(attributes, function(value, name) {

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

				var scale = App.Scale;

				if (child_params.scaleStrategy) scale = container.scale = this.getScaleByStrategy(child_params.scaleStrategy);

				if (child_params.position) {

					container.x = this.calculate(child_params.position[0]);
					container.y = this.calculate(child_params.position[1]);

				} else {

					container.x = (App.Width / App.PixelRatio) * 0.5;
					container.y = (App.Height / App.PixelRatio) * 0.5;

				}

				container.applyTransform();

				this.scaleStyles(container.el.getElementsByTagName('*'), scale);

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

				child.mask.clear();

				child.mask.beginFill(0x000000);

				child.mask.drawRect(this.calculate(child_params.mask[1]), this.calculate(child_params.mask[2]), this.calculate(child_params.mask[3]), this.calculate(child_params.mask[4]));

			} else if (child_params.mask[0] == 'sprite') {

				this.resizeChild(child_params.mask[1]);

			} else if (child_params.mask[0] == 'existing-sprite') {

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

	scaleStyles: function(els, scale) {

		_.each(els, function(inner_els) {

			if (!_.isArray(inner_els)) inner_els = [inner_els];

			_.each(inner_els, function(el) {

				el._scale = scale || el._scale;

				var styles = el._scaleStyles;

				_.each(styles, function(style_params, style) {

					this.scaleStyle(el, style, style_params, el._scale);

				}, this);

			}, this);

		}, this);

	},

	scaleStyle: function(el, style, style_params, scale) {

		if (!_.isArray(style_params)) style_params = [style_params];

		var values = _.map(style_params, function(style_param) {

			return this.calculate(style_param, scale, 1 / App.PixelRatio);

		}, this);

		values = _.map(values, function(value) {

			if (_.isNumber(value)) return ((value > 0) ? Math.ceil(value) : Math.floor(value)) + 'px';

			else return value;

		});

		el.style[style] = values.join(' ');

		//console.log(el, style, style_params, scale, values, values.join(' '));

	},

	setStyles: function(el, styles) {

		_.extend(el._scaleStyles, styles);

		this.scaleStyles([el]);

	},

	registerDOMObjectPool: function(pool_name, dom_objects_props) {

		dom_objects_props = _.clone(dom_objects_props);

		delete dom_objects_props[2].template;

		this._dom_object_pools[pool_name] = {
			name: pool_name,
			domObjectProps: dom_objects_props,
			domObjects: []
		};

	},

	getDOMObjectFromPool: function(pool_name) {

		var pool = this._dom_object_pools[pool_name];

		var objects = pool.domObjects,
			free_object = null;

		_.each(objects, function(object) {

			if (!object.el.parentNode) free_object = object;

		});

		if (free_object) {

			return free_object;

		}

		return this.createDOMObjectForPool(pool_name);

	},

	createDOMObjectForPool: function(pool_name) {

		var pool = this._dom_object_pools[pool_name];

		var dom_object = this.createDOMStructure(pool.domObjectProps);

		pool.domObjects.push(dom_object);

		return dom_object;

	},

	removePoolDOMObjects: function(pool_name, parent) {

		this.eachPoolDOMObjects(pool_name, parent, function(object) {

			object.el.parentNode.removeChild(object.el);

		});

	},

	eachPoolDOMObjects: function(pool_name, parent, next) {

		var pool = this._dom_object_pools[pool_name];

		var pool_objects = pool.domObjects;

		_.each(pool_objects, function(object) {

			if (object.el.parentNode && (parent === true || object.el.parentNode === parent)) next.apply(this, [object]);

		});

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