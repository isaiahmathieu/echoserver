// Matlab stuff
var worker = require('child_process');

var fs = require('fs');

var resultsFilename = 'results.txt';

const matchAgainst = 'matchAgainst/';
const eventRecordings = 'eventRecordings/';
var matlabPath = process.env.MATLAB_BINARY;

runAudioMatcher('dedede.wav');

function runAudioMatcher(filename) {

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
		checkResults();
	});

function checkResults() {
		var result = fs.readFileSync(resultsFilename);
		if (result === 'NO_MATCH') {
			console.log('no match sorry');
		} else {
			console.log('match for: ' + result);
		}
	}
}




