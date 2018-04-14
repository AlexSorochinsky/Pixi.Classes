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

		this.tick = 0;

		this._update_ticks = null;

		this.state = 'idle';

		this.each(this.Events, function(func, name) {

			Broadcast.on(name, function screen_events_wrapper() {

				func.apply(this, arguments);

			}, this);

			if (name.indexOf(this.Name + ' update tick') === 0) {

				if (!this._update_ticks) this._update_ticks = {};

				var tick = name.replace(this.Name + ' update tick ', '');

				this._update_ticks[tick] = {
					tick: parseInt(tick),
					event: name
				};

			}

		});

	},

	build: function() {

		Broadcast.call(this.Name + ' before build');

		this.each(this.Containers, function(container_params) {

			if (!container_params.position) container_params.position = ['width/2', 'height/2'];
			if (!container_params.scale) container_params.scale = 'scale';
			if (!container_params.type) container_params.type = 'container';

			if (container_params.type === 'container') {

				var container = this.buildChild(App.Stage, container_params);

				this._containers.push(container);

				container.visible = false;

				if (container_params.childs) this.buildChilds(container_params.childs, container);

			}

		});

		this.updateTime = App.time;

		this.isBuild = true;

		Broadcast.call(this.Name + ' build');

	},

	buildChilds: function(childs, container, is_reposition) {

		var result = [];

		childs = _.sortBy(childs, "zIndex");

		this.each(childs, function(child_params) {

			var child = this.buildChild(container, child_params, is_reposition);

			this._childs.push(child);

			result.push(child);

			if (child_params.childs) this.buildChilds(child_params.childs, child, is_reposition);

		});

		return result;

	},

	update: function() {

		this.updateTimeOffset = App.time - this.updateTime;

		this.updateTime = App.time;

		Broadcast.call(this.Name + ' update');

		if (this._update_ticks) {

			this.each(this._update_ticks, function(params) {

				if (this.tick % params.tick === 0) {

					if (params.event) Broadcast.call(params.event);

				}

			});

		}

		this.tick++;

	},

	resize: function() {

		this.Scale = App.Scale;

		if (this.isBuild) Broadcast.call(this.Name + ' before resize');

		this.each(this.Containers, function(child_params) {

			if (child_params.type === 'container') {

				var child = this[child_params.name];

				if (child) this.applyChildParams(child, child.params);

				if (child_params.childs) this.resizeChilds(child_params.childs);

			}

		});

		if (this.isBuild) Broadcast.call(this.Name + ' resize');

	},

	resizeChilds: function(childs) {

		this.each(childs, function(child_params) {

			var child = this[child_params.name];

			if (child) this.applyChildParams(child, child.params);

				if (child_params.childs) this.resizeChilds(child_params.childs);

		});

	},

	processOrientationProperties: function(object) {

		this.each(object, function(value, key) {

			if (App.IsLandscape && key.indexOf('Landscape') > 0) object[key.replace('Landscape', '')] = object[key];

			else if (App.IsPortrait && key.indexOf('Portrait') > 0) object[key.replace('Portrait', '')] = object[key];

		});

	},

	getScaleByStrategy: function(scale_strategy) {

		var scale = 1,
			width = App.Width,
			height = App.Height,
			max_scale = 100000;

		if (!Array.isArray(scale_strategy)) scale_strategy = [scale_strategy];

		if (scale_strategy[0] === 'fit-to-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.min(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		} else if (scale_strategy[0] === 'cover-screen') {

			if (scale_strategy[1]) width = scale_strategy[1];
			if (scale_strategy[2]) height = scale_strategy[2];

			scale = Math.max(App.Width / width, App.Height / height);

			if (scale_strategy[3] === false) max_scale = 1;
			else if (scale_strategy[3] === 'pixel-ratio') max_scale = App.PixelRatio;

			if (scale > max_scale) scale = max_scale;

		}

		return scale;

	},

	calculate: function(value, fixed_multiplier, special_multiplier) {

		if (!value) value = 0;

		if (!fixed_multiplier) fixed_multiplier = 1;

		if (!special_multiplier) special_multiplier = 1;

		if (!Array.isArray(value)) value = [value];

		var result = 0;

		this.each(value, function(part) {

			if (typeof part === 'string') {

				var direction_multiplier = 1;

				if (part.indexOf('-') === 0) {

					part = part.substr(1);

					direction_multiplier = -1;

				}

				if (part === 'width') result += App.Width * special_multiplier * direction_multiplier;

				else if (part === 'height') result += App.Height * special_multiplier * direction_multiplier;

				else if (part === 'scale') result += App.Scale * special_multiplier * direction_multiplier;

				else if (part.indexOf('width/') === 0) result += App.Width / parseFloat(part.replace('width/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('height/') === 0) result += App.Height / parseFloat(part.replace('height/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('width*') === 0) result += App.Width * parseFloat(part.replace('width*', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('height*') === 0) result += App.Height * parseFloat(part.replace('height*', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('scale/') === 0) result += App.Scale / parseFloat(part.replace('scale/', '')) * special_multiplier * direction_multiplier;

				else if (part.indexOf('scale*') === 0) result += App.Scale * parseFloat(part.replace('scale*', '')) * special_multiplier * direction_multiplier;

				else result = part;

			} else if (typeof part === 'function') {

				var f_result = part.apply(this, []);

				if (typeof f_result === 'string') result = f_result;

				else result += f_result;

			} else {

				result += part * fixed_multiplier;

			}

		}, this);

		return result;

	},

	valueBySpeed: function(value_per_second) {

		return value_per_second * (this.updateTimeOffset / 1000);

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

		Broadcast.off("Game Update", this);

		Broadcast.off("Game Resize", this);

		Broadcast.call(this.Name + ' hided');

	},

	checkAssets: function() {

		if (this.assetsLoadOnShowChecked) return;

		var assets_for_loading = [];

		this.each(this.Assets, function(asset) {

			if (asset.loadStrategy === 'first show') assets_for_loading.push(asset.name);

		});

		this.assetsLoadOnShowChecked = true;

		var _this = this;

		if (assets_for_loading.length > 0) App.loadAssets(assets_for_loading, this.bind(function() {

			this.each(_this._childs, function(child) {

				var child_params = child.params;

				if (child_params.type === 'sprite') {

					if (child.texture === App.emptyTexture) child.texture = this.getTexture(child_params.frame || child_params.image);

				}

			});

		}), {strategy: 'first show'});

	},

	getChildParamsByName: function(name) {

		var child_params = null;

		var iterate = _.bind(function(childs_params) {

			for (var i=0, l=childs_params.length; i<l; i++) {

				if (childs_params[i].name === name) child_params = childs_params[i];

				if (child_params) break;

				if (childs_params[i].childs) iterate(childs_params[i].childs);

			}

		});

		iterate(this.Containers);

		return child_params;

	},

	updateChildParamsByName: function(new_child_params) {

		var iterate = this.bind(function(exist_childs_params) {

			for (var i=0, l=exist_childs_params.length; i<l; i++) {

				if (new_child_params[exist_childs_params[i].name]) {

					this.merge(exist_childs_params[i], new_child_params[exist_childs_params[i].name]);

				}

				if (exist_childs_params[i].childs) iterate(exist_childs_params[i].childs);

			}

		});

		iterate(this.Containers);

	},

	toHex: function(value) {

		if (typeof value === 'string') {

			value = value.replace('#', '');

			value = parseInt(value, 16);

		}

		return value;

	}

}); 
