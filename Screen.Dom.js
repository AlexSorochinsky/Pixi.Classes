//-----------------------------------------------------------------------------
// Filename : Screen.Dom.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 15.12.2016
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of DOM methods for Screen class
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function(target, properties) {

		Broadcast.on(target.Name + ' build', function() {

			//'this' here == instance of Screen class

			_.each(this.Containers, function(container_params) {

				if (container_params.type == 'dom-container') this.buildDOMContainer(container_params);

			}, this);

		}, properties);

		Broadcast.on(target.Name + ' resize', function() {

			//'this' here == instance of Screen class

			_.each(this.Containers, function(child_params) {

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

				}

			}, this);

		}, properties);

		Broadcast.on(target.Name + ' showed', function() {

			_.each(this._dom_containers, function(dom_container) {

				document.body.appendChild(dom_container.el);

			});

		}, properties);

		Broadcast.on(target.Name + ' hided', function() {

			_.each(this._dom_containers, function(dom_container) {

				if (dom_container.el.parentNode) dom_container.el.parentNode.removeChild(dom_container.el);

			});

		}, properties);

	},

	buildDOMContainer: function(container_params, z_index) {

		if (!this._dom_containers) this._dom_containers = {};

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

			el.addEventListener("touchmove", function (e) {

				Broadcast.call(name + ' ' + code + ' move', [e, el, child_params]);

			}, false);

		} else {

			el.addEventListener("mouseover", function(e) {

				Broadcast.call(name + ' ' + code + ' over', [e, el, child_params]);

			}, false);

			el.addEventListener("mouseout", function(e) {

				Broadcast.call(name + ' ' + code + ' out', [e, el, child_params]);

			}, false);

			el.addEventListener("mousemove", function(e) {

				Broadcast.call(name + ' ' + code + ' move', [e, el, child_params]);

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

		if (!this._dom_object_pools) this._dom_object_pools = {};

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

	}

}); 

Screen.PressEndEvents = [];

Broadcast.on("Document Press Up", function(e) {

	Broadcast.call("Global Press End", [e, Screen.PressEndEvents]);

	Screen.PressEndEvents = [];

}, this);