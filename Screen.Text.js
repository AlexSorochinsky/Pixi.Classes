//-----------------------------------------------------------------------------
// Filename : Screen.Text.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 01.04.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of localization and text manipulation methods
//-----------------------------------------------------------------------------

Class.Mixin(Screen, {

	setText: function(sprite, codename, is_change_params) {

		if (_.isString(sprite)) sprite = this[sprite];

		if (_.isString(codename)) codename = codename; //TODO: Get value from localization file

		var styles = codename;

		if (_.isString(styles)) styles = {text: styles};

		sprite.text = styles.text;

		this.setTextStyles(sprite, styles, is_change_params);

	},

	setTextStyles: function(sprite, styles, is_change_params) {

		if (_.isString(sprite)) sprite = this[sprite];

		if (_.isString(styles)) styles = styles; //TODO: Get value from localization file

		if (sprite.params.type === 'text') {

			this.processOrientationProperties(styles);

			_.extend(sprite.style, styles);

		} else if (sprite.params.type === 'multistyle-text') {

			this.each(styles, function(styles) {

				this.processOrientationProperties(styles);

			});

			_.extend(sprite.styles, styles);

		}

		if (is_change_params !== false) _.extend(sprite.params.styles, styles);

		this.applyChildParams(sprite, styles);

	}

});