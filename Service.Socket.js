//-----------------------------------------------------------------------------
// Filename : Service.Socket.js
//-----------------------------------------------------------------------------
// Language : Javascript
// Date of creation : 28.04.2017
// Require: Class.js
//-----------------------------------------------------------------------------
// Set of Service methods for socket connection and real-time data transfer
//-----------------------------------------------------------------------------

Class.Mixin(Service, {

	initialize: function() {

		this.socketOnCloseRepeat = 5000;

	},

	connectSocket: function(url) {

		this.socketUrl = url;

		if (this.Socket && this.Socket.readyState !== this.Socket.CLOSED) return;

		clearTimeout(this.reconnectTimeout);

		this.Socket = new WebSocket(url);

		this.Socket.onopen = _.bind(function() {

			console.log("Socket connection established. Remote address: " + url);

			this.Connected = true;

			Broadcast.call('Socket Connection Established', [this.Socket, url]);

		}, this);

		this.Socket.onclose = _.bind(function(event) {

			if (this.socketOnCloseRepeat) {

				var timeout = this.socketOnCloseRepeat < 1000 ? 1000 : this.socketOnCloseRepeat;

				console.log("Socket connection closed. Remote address: " + url);

				this.reconnectTimeout = setTimeout(_.bind(function () {

					this.connectSocket(url);

				}, this), timeout);

			}

			this.Connected = false;

			Broadcast.call('Socket Connection Closed', [this.Socket]);

		}, this);

		this.Socket.onmessage = function(event) {

			var data = JSON.parse(event.data);
			if (!data) throw new Error('Socket server data error:', event.data);

			Broadcast.call("Server Data Received", [data]);

		};

		this.Socket.onerror = function (error) {};

	},

	disconnectSocket: function() {

		clearTimeout(this.reconnectTimeout);

		if (this.Socket) this.Socket.close();

		this.Connected = false;

	},

	sendToSocket: function (object) {

		if (this.Socket && this.Connected) {

			if (_.isString(object)) {

				var o = {};

				o[object] = true;

				object = o;

			}

			this.Socket.send(JSON.stringify(object));

		} else {

			console.warn("Socket not connected in .sendToSocket();", object);

		}

	},

	reconnectSocket: function() {

		if (this.Socket && this.Connected) {

			this.Socket.close();

		}

		Broadcast.on('Socket Connection Closed', function() {

			this.connectSocket(this.socketUrl);

			Broadcast.off('Socket Connection Closed', this);

		}, this);

	}

});