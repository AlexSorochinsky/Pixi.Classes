//-----------------------------------------------------------------------------
// Filename : Screen.Debug.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 28.02.2018
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of special methods for debug and simplify development
//-----------------------------------------------------------------------------

Class.Mixin(Game, {

	logClickCoordinates: function(relative_object) {

		Broadcast.on("Stage Press Up", function () {

			if (App.Engine === 'Pixi') console.log('-- Debug -- click coordinates: ', App.Renderer.plugins.interaction.mouse.global);

		}, 'Debug');

	}

});

Class.Mixin(Screen, {

	initialize: function() {

		if (Settings['debug']) {

			App.logClickCoordinates();

		}

		//TODO: Make sprites drag and save coords

	}

});