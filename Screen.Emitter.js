//-----------------------------------------------------------------------------
// Filename : Screen.Emitter.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 01.04.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of Physics methods for Screen class
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function() {

		Broadcast.on(this.Name + ' build child', function(child, child_params) {

			if (child_params.type == 'emitter') this.buildChildEmitter(child);

		}, this, {index: this.Name + '-Emitter'});

	},

	buildChildEmitter: function(child) {

		child.emit = _.bind(function() {

			this.emit(child);

		}, this);

	},

	emit: function(child) {

		var child_params = child._child_params;

		var maximum_particles = child_params.limit || 20,
			interval = child_params.interval || 100,
			count_per_interval = child_params.count || 2;

		setTimeout(_.bind(function() {

			for (var i=0; i<count_per_interval; i++) {

				var images = child_params.images || [child_params.image],
					start_position = child_params.particlePosition || ['ellipse', 20, 20],
					particle_scale = child_params.particleScale || [1, 2, 1, 2],
					particle_rotation = child_params.particleRotation || [0, 0],
					particle_alpha = child_params.particleAlpha || [1, 1],
					particle_tweens = child_params.particleTween;

				var sprite = _.sample(images);

				if (_.isFunction(sprite)) sprite = sprite.apply(this, [child]);

				if (_.isString(sprite)) sprite = this.buildChild(child, {type: 'sprite', image: sprite}, true);

				if (particle_scale.length == 2) particle_scale = [particle_scale[0], particle_scale[1], particle_scale[0], particle_scale[1]];

				var position = [0, 0],
					scale_x = _.random(particle_scale[0] * 1000, particle_scale[1] * 1000) / 1000,
					scale_y = _.random(particle_scale[2] * 1000, particle_scale[3] * 1000) / 1000,
					rotation = _.random(particle_rotation[0] * 1000, particle_rotation[1] * 1000) / 1000,
					alpha = _.random(particle_alpha[0] * 1000, particle_alpha[1] * 1000) / 1000;

				if (start_position[0] == 'ellipse') position = this.getPointInsideEllipse(start_position[1], start_position[2]);

				sprite.position.set(position[0], position[1]);
				sprite.scale.set(scale_x, scale_y);
				sprite.rotation = rotation;
				sprite.alpha = alpha;

				if (_.isFunction(particle_tweens)) particle_tweens = particle_tweens.apply(this, [sprite]);

				this.tween(particle_tweens, sprite, function(tween_object) {

					tween_object.targets[0].destroy();

				}, {override: false});

				maximum_particles--;

				if (maximum_particles <= 0) break;

			}

			if (maximum_particles > 0) setTimeout(_.bind(arguments.callee, this), interval);

		}, this), interval);

	},

	getPointInsideEllipse: function(x_length, y_length) {

		var x = _.random(-x_length/2, x_length/2);

		var y = _.random(-y_length/2, y_length/2);

		if (((x*x)/((x_length/2)*(x_length/2)) + (y*y)/((y_length/2)*(y_length/2))) <= 1) return [x, y];

		else return this.getPointInsideEllipse(x_length, y_length);

	}

});