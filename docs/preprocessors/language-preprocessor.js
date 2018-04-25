module.exports = function(data, options) {

	console.log('data', data, 'options', options);

	for (let class_name in data.classes) if (data.classes.hasOwnProperty(class_name)) {

		var class_ = data.classes[class_name];

		class_.description = filter_text(class_.description, options);

		if (class_.params) for (let i=0; class_.params[i]; i++) {

			const param = class_.params[i];

			param.description = filter_text(param.description, options);

		}

	}

	for (let i=0; data.classitems[i]; i++) {

		var classitem = data.classitems[i];

		classitem.description = filter_text(classitem.description, options);

		if (classitem.params) for (let j=0; classitem.params[j]; j++) {

			const param = classitem.params[j];

			param.description = filter_text(param.description, options);

		}

		if (classitem.return) classitem.return.description = filter_text(classitem.return.description, options);

	}

};

function filter_text(text, options) {

	const lines = text.split('\n');
	const new_lines = [];

	for (let i=0, l=lines.length; i<l; i++) {

		let line_trim = lines[i].trim();

		let is_lang_string = false;

		options.languages.forEach(function(lang) {

			if (line_trim.indexOf(lang+':') === 0) is_lang_string = lang;

		});

		if (is_lang_string) {

			if (is_lang_string === options.language) {

				new_lines.push(lines[i].replace(options.language+':', ''));

			}

		} else {

			new_lines.push(lines[i]);

		}

	}

	return new_lines.join('\n');

}
