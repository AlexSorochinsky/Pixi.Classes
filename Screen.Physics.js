//-----------------------------------------------------------------------------
// Filename : Screen.Physics.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 10.03.2017
// Require: Class.js, PhysicsJS
//-----------------------------------------------------------------------------
// Set of Physics methods for Screen class
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	initialize: function() {

		Broadcast.on('Assets Loaded', function() {

			if (this.Physics) this.createPhysicsWorld();

		}, this, {index: this.Name + '-Physics'});

		Broadcast.on(this.Name + ' build', function() {

			if (this.Physics) this.buildChildsPhysics();

		}, this, {index: this.Name + '-Physics'});

		Broadcast.on(this.Name + ' update', function() {

			if (this.Physics) this.updatePhysics();

		}, this, {index: this.Name + '-Physics'});

	},

	createPhysicsWorld: function() {

		var world = this.World = Physics(this.Physics.World);

		this.World.add([
			Physics.behavior('constant-acceleration', this.Physics.Gravity),
			Physics.behavior('edge-collision-detection', this.Physics.Bounds),
			Physics.behavior('sweep-prune'),
			Physics.behavior('body-collision-detection'),
			Physics.behavior('body-impulse-response')
		]);

		// If you want to subscribe to collision pairs
		// emit an event for each collision pair
		this.World.on('collisions:detected', _.bind(function (data) {

			for (var i=0, l=data.collisions.length; i < l; i++) {

				var c = data.collisions[i];

				Broadcast.call(this.Name + ' ' + c.bodyA.name + ' + ' + c.bodyB.name + ' collision', [this[c.bodyA.name], this[c.bodyB.name], c]);

				Broadcast.call(this.Name + ' ' + c.bodyA.name + ' collision', [this[c.bodyA.name], c]);

				Broadcast.call(this.Name + ' ' + c.bodyB.name + ' collision', [this[c.bodyB.name], c]);

			}

			Broadcast.call(this.Name + ' collisions detected', [data]);

		}, this));

		// add some fun interaction
		var attractor = Physics.behavior('attractor', {
			order: 0,
			strength: 0.002
		});

		this.World.on({
			'interact:poke': function (pos) {
				world.wakeUpAll();
				attractor.position(pos);
				world.add(attractor);
			}, 'interact:move': function (pos) {
				attractor.position(pos);
			}, 'interact:release': function () {
				world.wakeUpAll();
				world.remove(attractor);
			}
		});


	},

	buildChildsPhysics: function() {

		_.each(this._childs, function(child) {

			if (child._child_params.physics) this.buildChildPhysics(child, child._child_params);

		}, this);

	},

	buildChildPhysics: function(child, child_params) {

		if (child_params.physics === true) {

			child_params.physics = ['rectangle', child.texture._frame.width, child.texture._frame.height];

		}

		if (_.isArray(child_params.physics)) child_params.physics = {body: child_params.physics};

		if (!('body' in child_params.physics)) child_params.physics.body = ['rectangle', child.texture._frame.width, child.texture._frame.height];
		if (!('restitution' in child_params.physics)) child_params.physics.restitution = 0.01;
		if (!('cof' in child_params.physics)) child_params.physics.cof = 0.99;
		if (!('mass' in child_params.physics)) child_params.physics.mass = 1;
		if (!('sleep' in child_params.physics)) child_params.physics.sleep = true;

		var body = child_params.physics.body;

		if (body) {

			if (body[0] == 'rectangle') {

				child.physics = Physics.body(body[0], {
					x: child_params.position[0],
					y: child_params.position[1],
					width: child.width,
					height: child.height,
					restitution: child_params.physics.restitution,
					cof: child_params.physics.cof,
					mass: child_params.physics.mass
				});

			} else if (body[0] == 'circle') {

				child.physics = Physics.body(body[0], {
					x: child_params.position[0],
					y: child_params.position[1],
					radius: body[1],
					restitution: child_params.physics.restitution,
					cof: child_params.physics.cof,
					mass: child_params.physics.mass
				});

			}
			else if (body[0] == 'triangle') {

				child.physics = Physics.body('convex-polygon', {
					x: child_params.position[0],
					y: child_params.position[1],
					vertices: body[1],
					restitution: child_params.physics.restitution,
					cof: child_params.physics.cof,
					mass: child_params.physics.mass
				});

			}

			if (child.physics) {

				var world = this.World;

				child.physics.pause = function() {

					child.isPhysicsPaused = true;

					world.remove(child.physics);

				};

				child.physics.resume = function() {

					child.isPhysicsPaused = false;

					child.physics.state.pos.set(child.position.x, child.position.y);

					world.add(child.physics);

					child.physics.sleep(false);

				};

				if (child_params.physics.velocity) child.physics.state.vel.set(child_params.physics.velocity[0], child_params.physics.velocity[1]);

				if (child_params.rotation) child.physics.state.angular.pos = child_params.rotation;

				child.physics.name = child.name;

				child.physics.child = child;

				if (child_params.physics.pause !== true) world.add(child.physics);

				child.physics.sleep(child_params.physics.sleep);

			}

		}

	},

	updatePhysics: function() {

		this.World.step(App.time);

		_.each(this.Containers, function(child_params) {

			if (child_params.type == 'container') {

				var child = this[child_params.name];

				if (child) this.updateChildPhysics(child);

				if (child_params.childs) this.updateChildsPhysics(child_params.childs);

			}

		}, this);

	},

	updateChildsPhysics: function(childs) {

		_.each(childs, function(child_params) {

			var child = this[child_params.name];

			if (child) this.updateChildPhysics(child);

				if (child_params.childs) this.updateChildsPhysics(child_params.childs);

		}, this);

	},

	updateChildPhysics: function(child) {

		if (child.physics && !child.isPhysicsPaused) {

			child.position.set(child.physics.state.pos.get(0), child.physics.state.pos.get(1));

			child.rotation = child.physics.state.angular.pos;

		}

	}

});