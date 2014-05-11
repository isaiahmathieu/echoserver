var serverHostname = 'klement.cs.washington.edu';
var serverPort = 9876;
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

// If this is a new sound, tell the nodejs server to use the next loud noise
// as a matching target. 
// If this an update of the state of an existing sound, change the channel
// subscription to reflect this
Parse.Cloud.afterSave("Sound", function(request) {
	console.log("Sound saved");
	var soundName = request.object.get("name");
	var Sound = Parse.Object.extend("Sound");
	var query = new Parse.Query(Sound);
	query.equalTo("name", soundName);
	query.find({
		success: function(results) {
			if (results.length == 0) {
				// this is a new sound, notify the nodejs server
				setNextAsTarget(request);
			}
			// now update the subscription status
			updateChannel(request);
		},
		error: function(error) {
			console.log("error: " + error.code + " " + error.message);
		}
	});
});

function updateChannel(request) {
	var query = new Parse.Query(Parse.Installation);
	query.equalTo("installationId", request.installationId);
	query.find({
		success: function(result) {
			// get the installation object
			var obj = result[0];
			// get the array of channels
			var channels = obj.get("channels");
			// get the new state of the subscription from the Sound object
			var subscribe = request.object.get("enabled");
			// channel names are the objectId of the Sound object prepended with
			// an 'x'
			var channelName = 'x' + request.object.id;
			if (subscribe) {
				// channelName should NOT be in the array already. May need to sanity
				// check this in the future. For now just append to the end
				channels.push(channelName);
			} else {
				// find the element to remove
				var index = -1;
				for (var i = 0; i < channels.length; i++) {
					if (channels[i] == channelName) {
						index =	i;
					}
				}
				// if it was found, remove it
				if (index != -1) {
					channels.splice(index, 1);
				}

			}
			obj.save();
		},
		error: function(error) {
			console.log("error: " + error.code + " " + error.message);
		}
	});
}

function setNextAsTarget(request) {
	var urlAndPath = serverHostname + ':' + serverPort + '/setNextNoiseAsTarget?filename=';
	urlAndPath += request.object.id; 
	console.log(urlAndPath);
	Parse.Cloud.httpRequest({
		method: 'GET',
		url: urlAndPath,
		success: function(httpResponse) {
			console.log('success back from the nodejs server');	
			console.log(httpResponse);
		},
		error: function(httpResponse) {
			console.log('error response from nodejs server');	
			console.log(httpResponse);
		}
	});
}

Parse.Cloud.afterSave("Event", function(request) {
	console.log("Event occurred");
	console.log(request);
	console.log(request.object);
	// request.object is a ParseObject, not a JSON object.
	// this means you have to access its data with the .get("key") method
	// however, if you want to acces the objectId field you do object.id
	// because object.get('objectId') doesn't work...confusing
	var matchFound = request.object.get("match");
	var filename = request.object.get("eventFilename");
	if (matchFound) {	
		var channel = 'x' + request.object.get("matchFilename");
		sendPushForMatch(filename, channel);
	} else {
		var filename = request.object.get("eventFilename");
		sendPushForNoMatch(filename);
	}
});

function sendPushForNoMatch(filename) {
	Parse.Push.send({
		channels: ['cat'],
		data: {
			alert: "sound no match :(",
			filename : filename,
			action: "org.cs.washington.cse477.SOUND_DATA_GETTER",
			match: false
		}
	}, {
  success: function() {
    // Push was successful
	console.log("push success");
  },
  error: function(error) {
    // Handle error
	console.log("push FAILED");
  }
});
}

function sendPushForMatch(eventRecordingFilename, channel) {
	console.log('sending push to channel: ' + channel + ' for match on event with filename: ' + eventRecordingFilename);
	Parse.Push.send({
		channels: [channel],
		data: {
			alert: "matched a noise!",
			filename : eventRecordingFilename,
			action: "org.cs.washington.cse477.SOUND_DATA_GETTER",
			match: true
		}
	}, {
  success: function() {
    // Push was successful
	console.log("push success");
  },
  error: function(error) {
    // Handle error
	console.log("push FAILED");
  }
});
}

Parse.Cloud.define("setupSuccess", function(request, response) {
	setupSuccess();
	response.success("ojifwejoiefwjoiewfoijewfoij");
});

function setupSuccess() {
	console.log('device setup success');
	Parse.Push.send({
		channels: ['cat'],
		data: {
			alert: "flyport set up"
		}
	}, {
  success: function() {
    // Push was successful
	console.log("setup success push success");
  },
  error: function(error) {
    // Handle error
	console.log("setup success push FAILED");
  }
});

}

