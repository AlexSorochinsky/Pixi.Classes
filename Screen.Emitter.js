//-----------------------------------------------------------------------------
// Filename : Screen.Emitter.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 01.04.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of particle emitter methods to Screen class
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function() {

		Broadcast.on(this.Name + ' build child', function(child, child_params) {

			if (child_params.type == 'emitter') this.buildChildEmitter(child);

		}, this, {index: this.Name + '-Emitter'});

		Broadcast.on(this.Name + ' update', function() {

			this.updateEmitters();

		}, this, {index: this.Name + '-Emitter'});

		this._emitters = [];

	},

	buildChildEmitter: function(child) {

		child.emit = _.bind(function() {

			child.isPaused = false;

			this.emit(child);

		}, this);

		child.pause = _.bind(function() {

			this.pauseEmitter(child);

		}, this);

	},

	emit: function(emitter) {

		var child_params = emitter._child_params;

		var maximum_particles = ('limit' in child_params) ? child_params.limit : 20,
			interval = child_params.interval || 100,
			count_per_interval = child_params.count || 2;

		setTimeout(_.bind(function() {

			if (emitter.isPaused) return;

			for (var i=0; i<count_per_interval; i++) {

				var images = child_params.images || [child_params.image],
					start_position = child_params.particlePosition || ['ellipse', 20, 20],
					particle_scale = child_params.particleScale || [1, 2, 1, 2],
					particle_rotation = child_params.particleRotation || [0, 0],
					particle_alpha = child_params.particleAlpha || [1, 1],
					particle_speed = child_params.particleSpeed || [0, 0],
					particle_acceleration = child_params.particleAcceleration || [0, 0],
					particle_tweens = child_params.particleTween;

				var sprite = _.sample(images);

				if (_.isFunction(sprite)) sprite = sprite.apply(this, [emitter]);

				if (_.isString(sprite)) sprite = this.buildChild(emitter, {type: 'sprite', image: sprite}, true);

				if (particle_scale.length === 2) particle_scale = [particle_scale[0], particle_scale[1], particle_scale[0], particle_scale[1]];

				var position = [0, 0],
					scale_x = _.random(particle_scale[0] * 1000, particle_scale[1] * 1000) / 1000,
					scale_y = _.random(particle_scale[2] * 1000, particle_scale[3] * 1000) / 1000,
					rotation = _.random(particle_rotation[0] * 1000, particle_rotation[1] * 1000) / 1000,
					alpha = _.random(particle_alpha[0] * 1000, particle_alpha[1] * 1000) / 1000;

				if (_.isFunction(start_position)) position = start_position.apply(this, [sprite]);

				else if (start_position[0] === 'ellipse') position = this.getPointInsideEllipse(start_position[1], start_position[2]);

				sprite.position.set(position[0], position[1]);
				sprite.scale.set(scale_x, scale_y);
				sprite.rotation = rotation;
				sprite.alpha = alpha;

				sprite.speedX = this.getParticleValue(particle_speed[0]) || 0;
				sprite.speedY = this.getParticleValue(particle_speed[1]) || 0;

				sprite.accelerationX = this.getParticleValue(particle_acceleration[0]) || 0;
				sprite.accelerationY = this.getParticleValue(particle_acceleration[1]) || 0;

				if (_.isFunction(particle_tweens)) particle_tweens = particle_tweens.apply(this, [sprite]);

				if (_.isObject(particle_tweens) || _.isArray(particle_tweens)) {

					this.tween(particle_tweens, sprite, function(tween_object) {

						tween_object.targets[0].destroy();

					}, {override: false});

				}

				if (maximum_particles !== null) {

					maximum_particles--;

					if (maximum_particles <= 0) break;

				}

			}

			if (maximum_particles === null || maximum_particles > 0) setTimeout(_.bind(arguments.callee, this), interval);

			if (!_.contains(this._emitters, emitter)) this._emitters.push(emitter);

		}, this), interval);

	},

	pauseEmitter: function(emitter) {

		emitter.isPaused = true;

	},

	updateEmitters: function() {

		_.each(this._emitters, function(container) {

			if (container.children.length > 0) {

				_.each(container.children, function(particle) {

					if (particle.speedX) particle.position.x += particle.speedX * (this.updateTimeOffset / 1000);
					if (particle.speedY) particle.position.y += particle.speedY * (this.updateTimeOffset / 1000);

					if (particle.accelerationX) particle.speedX += particle.accelerationX * (this.updateTimeOffset / 1000);
					if (particle.accelerationY) particle.speedY += particle.accelerationY * (this.updateTimeOffset / 1000);

				}, this);

			} else {

				this._emitters = _.without(this._emitters, container);

			}

		}, this);

	},

	getPointInsideEllipse: function(x_length, y_length) {

		var x = _.random(-x_length/2, x_length/2);

		var y = _.random(-y_length/2, y_length/2);

		if (((x*x)/((x_length/2)*(x_length/2)) + (y*y)/((y_length/2)*(y_length/2))) <= 1) return [x, y];

		else return this.getPointInsideEllipse(x_length, y_length);

	},

	getParticleValue: function(value, params) {

		if (_.isArray(value)) return _.random(value[0], value[1]);
		else if (_.isFunction(value)) return value.apply(this, params || []);
		return value;

	}

});