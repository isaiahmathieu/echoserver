var serverHostname = 'klement.cs.washington.edu';
var serverPort = 9876;
var defaultChannel = 'default';

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
	var query = new Parse.Query("Sound");
	query.equalTo("name", soundName);
	query.find({
		success: function(results) {
			if (results.length == 0) {
				// this is a new sound, notify the nodejs server
				setNextAsTarget(request);
			}
		},
		error: function(error) {
			console.log("error: " + error.code + " " + error.message);
		}
	});
});

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
	var eventFilename = request.object.get("eventFilename");
	if (matchFound) {	
		var sound = getSoundObject("matchFilename");
		if (sound.get("enabled")) {
			sendPushForMatch(sound.get("name"), eventFilename);
		}
	} else {
		sendPushForNoMatch(eventFilename);
	}
});

function getSoundObject(objectId) {
	var query = new Parse.Query("Sound");
	query.equalTo("objectId", objectId);
	query.find({
		success: function(results) {
			if (results.length == 1) {
				return results[0];
			} else {
				console.log("expected only one result, got: " + results.length);	
			}
		},
		error: function() {
			console.log("No Sound object with objectId: " + objectId + " found");	
		}
	});
}

function sendPushForNoMatch(filename) {
	Parse.Push.send({
		channels: [defaultChannel],
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

function sendPushForMatch(soundName, eventRecordingFilename) {
	console.log("sending push for match of sound: " + soundName);
	Parse.Push.send({
		channels: [defaultChannel],
		data: {
			alert: "noise detected: " + soundName,
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

