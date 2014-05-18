//var serverHostname = 'klement.cs.washington.edu';
var serverHostname = '128.208.7.228'; 
var serverPort = 9876;
var defaultChannel = 'default';
var loudUnknownChannel = 'loudUnknown';


// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});

// If this is a new sound, tell the nodejs server to use the next loud noise
// as a matching target. Do nothing if this is an update.

Parse.Cloud.afterSave("Sound", function(request) {
	console.log(request);
	if (request.object.get("useNextAsTarget")) {
		setNextAsTarget(request);
		request.object.set("useNextAsTarget", false);
		request.object.save();
	}
});

// when a sound is deleted from parse, remove it from the node server
Parse.Cloud.afterDelete("Sound", function(request) {
	var filename = request.object.id;
	var urlAndPath = serverHostname + ':' + serverPort + '/deleteTarget?filename=';
	urlAndPath += filename;
	// right now the file name does not include the .wav extension, so add it
	// here
	urlAndPath += '.wav';
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
});


Parse.Cloud.afterDelete("Event", function(request) {
	var filename = request.object.get('eventFilename');
	var urlAndPath = serverHostname + ':' + serverPort + '/deleteEventRecording?filename=';
	urlAndPath += filename;
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
});


function setNextAsTarget(request) {
	var urlAndPath = serverHostname + ':' + serverPort + '/setNextNoiseAsTarget?filename=';
	urlAndPath += request.object.id; 
	console.log("URL and Path: " + urlAndPath);
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
/*
Parse.Cloud.beforeSave("Event", function(request, response) {
	var matched = request.object.get("match");
	console.log('before saving, found a match: ' + matched);	
	if (matched) {
		// get the filename of the match
		var query = new Parse
		request.object.set("matchSoundName", 	
	}
	response.success();
});
*/

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
		// matchFilename is actually a misnomer because it is not the whole
		// name of the file that the event sound was matched too, its the 
		// filename with the .wav extension removed. Thus it is just the objectId
		// of the Sound object
		var matchFilename = request.object.get("matchFilename");
		var query = new Parse.Query("Sound");
		console.log('looking for Sound object with id: ' + matchFilename);
		query.get(matchFilename, {
			success: function(result) {
				var matchSoundName = result.get("name");
				if (result.get("enabled")) {
					sendPushForMatch(matchSoundName, eventFilename);
				}
			}, 
			error: function() {
				console.log("No Sound object with objectId: " + matchFilename + " found");	
			}
		});
	} else {
		// first check to see if the user has notifications for loud unidentified
		// noises turned on
			sendPushForNoMatch(eventFilename);
	/*	
		if (false) {
			sendPushForNoMatch(eventFilename);
		} else {
			// delete this event from Parse 
			request.object.destroy({
				success : function() {
					console.log('successfully deleted event object');	
				},
				error : function(object, error) {
					console.log('failed to delete object: ' + object);
					console.log('error: ' + error);
				}

			});		
			// delete the recording from the nodejs server
		}
	*/
	}
});


function sendPushForNoMatch(filename) {
	Parse.Push.send({
		channels: [loudUnknownChannel],
		data: {
			alert: "Loud unidentified noise heard",
			filename : filename,
			//action: "org.cs.washington.cse477.SOUND_DATA_GETTER",
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
			//action: "org.cs.washington.cse477.SOUND_DATA_GETTER",
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
		channels: [defaultChannel],
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

