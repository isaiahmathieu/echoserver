/**
 * New node file
8gpzmALgXCLoyd9yTKayNvg4wjLCvCrTVkCDrRr2
 */

var fs = require('fs');
var http = require('http');
var url = require('url');

var mv = require('mv');
// for the Parse REST API
var https = require('https');
var moment = require('moment');
var net = require('net');
var binary = require('binary');

const httpPort = 9876;
const tcp_port = 6969;
const matchAgainst = './matchAgainst/';
const eventRecordings = './eventRecordings/';
const serverName = 'klement';
const tcp_timeout = 10000;

var moveNextNoiseToMatchAgainst = false;
var nameForNextNoise;

fs.mkdir(matchAgainst, function(e) {});
fs.mkdir(eventRecordings, function(e) {});

http.createServer(function(req, res) {
	  // Parse req header
	  var header = url.parse(req.url, true);
	  console.log(header);
	  if (header.pathname === "/") {
	    res.writeHeader(200, {'Content-Type': 'text/plain'});
	    res.end(serverName + " is live");
	  } else if (header.pathname === "/upload") {
			  var newFile;
			  var pathToNewFile;
			  if (moveNextNoiseToMatchAgainst) {
				  // save the file in the folder containing samples to match against
				  pathToNewFile = matchAgainst + nameForNextNoise;
				  console.log("setting this noise as a match target: " + pathToNewFile);
				  
				  moveNextNoiseToMatchAgainst = false;
				  nameForNextNoise = null;
				  
				  // now tell parse about this new type of sound we may be listening for
				  // using the rest API
				  
			  } else {
				  // this is a sound the user is not intending to set as a match target
				  // so give it the standard date/time formatted name and save it in
				  // the event recordings directory. Then send a request to parse to 
				  // send a push notification.
				var filename = moment().format('YYYYMMDDHHmmss');
				  pathToNewFile = eventRecordings + filename;
				  console.log(pathToNewFile);
				// At this point we will run the audio matching tool to see if
				// the sample can be matched to anything. migth look like this:
				//var matchedFile = runAudioMatcher(filename);	
				matchAudioSendEvent(filename);
				
				// if runAudioMatcher returns a filename it found a match. it returns null
				// then it did not.
				//newEvent(matchedFile != null, matchedFile, filename);
			  }
			  newFile = fs.createWriteStream(pathToNewFile, {flags: 'w'}); 
			  newFile.on('error', function(e) {
				  req.emit('error', e);
			  });
			  req.pipe(newFile);
			  req.on('end', function() {
				res.writeHeader(200);
				res.end('success!');
				// we are done now
			  });
		} else if (header.pathname === "/deleteTarget") {
			// delete this file
			if ('filename' in header.query) {
				fs.unlink(matchAgainst + header.query.filename, function(e) {
					if (e) {
						res.writeHeader(418);
   				    	res.end('error ' + e.message);
					} else {
						res.writeHeader(200);
						res.end('success deleting file: ' + header.query.filename);	
					}
				
				});
			} else {
			  res.writeHeader(404);
			  res.end('no filename specified');
		  }
	  } else if (header.pathname === "/getEventRecording") {
		  if ('filename' in header.query) {
			  var path = eventRecordings + header.query.filename;
			  console.log("path to file: "+ path);
			  //var size = getFileSize(path);
			  fs.createReadStream(eventRecordings + header.query.filename)
			  .on('open', function(e) {
				  //res.writeHeader(200, {'Content-type' : 'audio/m4a', 'Content-Length': size});
					res.writeHeader(200);
				  this.pipe(res);
			  })
			  .on('error', function(e) {
				  console.log('error ' + e.message);
				  res.writeHeader(404);
				  res.end(header.query.filename + ' not found');
			  });
		  } else {
			  res.writeHeader(404);
			  res.end('no filename specified');
		  }
	  } else if (header.pathname === "/getMatchAgainst") {
		  if ('filename' in header.query) {
			  var path = matchAgainst + header.query.filename;
			  console.log("path to file: "+ path);
			  //var size = getFileSize(path);
			  fs.createReadStream(path)
			  .on('open', function(e) {
				  //res.writeHeader(200, {'Content-type' : 'text/plain', 'Content-Length': size});
					res.writeHeader(200);
				  this.pipe(res);
			  })
			  .on('error', function(e) {
				  console.log('error ' + e.message);
				  res.writeHeader(404);
				  res.end(header.query.filename + ' not found');
			  });
		  } else {
			  res.writeHeader(404);
			  res.end('no filename specified');
		  }
	  } else if (header.pathname === '/setNextNoiseAsTarget') {
		  // move 
		  if ('filename' in header.query) {
			  nameForNextNoise = header.query.filename;
				console.log("setting next loud noise as a match target with filename: " + nameForNextNoise);
			  moveNextNoiseToMatchAgainst = true;
			  res.writeHeader(200);
			  res.end('next loud noise heard will be used as a target to match against');
		  } else {
			  res.writeHeader(404);
			  res.end('no filename specified');
		  }
	  } else if (header.pathname === '/moveLastNoiseToTarget') {
		  if ('filename' in header.query) {
			  // move the file from eventRecordings/ to matchAgainst/
			  // filenames go by date/time created, so get the latest
			  // get list of files in the eventRecordings directory
			  var files = fs.readdirSync(eventRecordings);
			  // sort the array of filenames so that the file created most recently ('largest' filename because
			  // files are named by date/time) appears at files[0]
			  files.sort(function(a, b) {
			        return a > b ? -1 : 1;
			  });
			  // select the first file in the list
			  var fileToMove = eventRecordings + files[0];
			  console.log(fileToMove);
			  var newFilename = matchAgainst + header.query.filename;
			  console.log(newFilename);
			  mv(fileToMove, newFilename, function(err) {
				  if (err != null) {
					 console.log("could not move file"); 
				  }
			  });
			  res.writeHeader(200);
			  res.end('moving last noise heard and renaming it to: ' + newFilename);
		  } else {
			  res.writeHeader(404);
			  res.end('no filename specified');
		  } 
	  } else {
		  res.writeHeader(200);
		  res.end('not recognized');
	  }
}).listen(httpPort, function() {
  console.log("http server is up on port " + httpPort);
});

function getFileSize(filepath) {
	var stats = fs.statSync(filepath);
	return stats["size"];
}


function newOptions(method, url) {
  return {
		method: method,
		hostname: 'api.parse.com',
		path: url,
		headers: {
			"X-Parse-Application-Id" : "t1oV8LeSRZsCFmBSe0yudiZv17eHIJdaHtytj0ZP",
			"X-Parse-REST-API-Key" : "FHupaGg5ApaCkfX8Djl5lr47x7b1MyDMKqMofhXs",
			"Content-Type" : "application/json"
		}
	};
}

function newEvent(matchFound, matchFilename, eventRecordingFilename) {
	var req = https.request(newOptions('POST', '/1/classes/Event'), function(res) {
	console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	});


	var body = {
		"match" : matchFound,
		// set the appropriate fields to the filename or null depending on if a match 
		// was found
		"matchFilename" : matchFound ? matchFilename : null,
		"eventFilename" : eventRecordingFilename,
		"matchSoundName" : "not set yet" 
	};
	req.write(JSON.stringify(body));
	req.end();
}

var matlabPath = process.env.MATLAB_BINARY;

function matchAudioSendEvent(filename) {

	// build up command starting with the path to the matlab binary
	var cmd = matlabPath + 'matlab -nojvm -nodisplay -nosplash -r \"matchSounds ';
	// now add arguments. first the path to the event recordings folder 
	cmd += '\"' +  __dirname + '/' + eventRecordings + filename + '\" ';
	// add the second argument which is the folder with the sounds to match against
	cmd += '\"' + __dirname + '/' + matchAgainst + '\" ';
	// add the last argument which is the path+name of the file to write the results to
	cmd += '\"' + __dirname + '/' + resultsFilename;
	// add the exit command to exit matlab
	cmd += '\";exit;\"';
	console.log(cmd);

	worker.exec(cmd, function(err, out, stderr) {
		//console.log(out);
		createEventBasedOnResults();
	});

function createEventBasedOnResults() {
		var result = fs.readFileSync(resultsFilename);
		if (result === 'NO_MATCH') {
			console.log('no match sorry');
			newEvent(false, null, filename);
		} else {
			console.log('match for: ' + result);
			newEvent(true, result, filename);
		}
	}
}


net.createServer(function(sock) {
  sock.pipe(binary()
    .word32bu('id')
	.word8bu('type')
	.tap(function(vars) {
	  if (vars.type == 1) {
            console.log("Sample Upload");
            this.word32bu('sample_rate')
 	    .word8bu('bit_depth')
	    .word8bu('channels')
	    .tap(function(vars) {
              console.log("id: " + vars.id);
              console.log("type: " + vars.type);
              console.log("sample_rate: " + vars.sample_rate);
              console.log("bit_depth: " + vars.bit_depth);
              console.log("channels: " + vars.channels);

	      sock.unpipe();
	      var sample = sample_dir + 'd'+vars.id + "_" + moment().format('MMDDYY_hhmmss') + ".pcm";
             sock.pipe(fs.createWriteStream(sample));
             /*
	      sock.pipe(wav.FileWriter(sample, {
                format: 1,
	        channels: vars.channels,
	        sampleRate: vars.sample_rate,
	        bitDepth: vars.bit_depth
              }));
              */
              sock.on('end', function() {
                sock.emit('file_written', vars.id, sample);
              });
	    });
	  } 
	  else if (vars.type == 2) {
	    // Status Message
            console.log("Setup Success: " + vars.id);
            var req = https.request(newOptions('POST', '/1/functions/setupSuccess'));
            req.write('{}');              
            req.end();
          }
	  else {
	    //bad message type
            sock.emit('error', new Error("InvalidMessageFormat"));
	  }
	})
  );
  sock.on('file_written', function(id, sample) {
    var db = catal_dir+id;
    fs.exists(db, function(exists) {
      if(exists) {
	var cmd = './audfprint -dbase '+catal_dir+id+' -match '+sample;
        worker.exe(cmd, function(err, out, stderr) {
          // Results of matching
          console.log(out);
        });    
      }
      else {
        // Edge case of no db for device
        // Wat do?
        console.log('device: '+id+' has no db');
      }
    });
  });
  sock.setTimeout(tcp_timeout, function() {
    sock.end('Connection Closed', 'utf8');
    console.log("timeout" + sock.remoteAddress);	
  });
  sock.on('error', function(e) {
    console.log("error: " + e.message);
    sock.destroy();
  });
})
.listen(tcp_port, function() {
  console.log("tcp server is live on port " + tcp_port);
});

/*

	    // Status Message
            var ss = https.request(newOptions('POST', '/1/functions/setupSuccess'), function(res) {
	console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
            })
            ss.write('{}');
            ss.end();
*/
