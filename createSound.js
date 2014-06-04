const hostname = "klement.cs.washington.edu";
//const hostname = "128.208.7.228";

var fs = require('fs');
var http = require('http');

var options = {
		  hostname: 'localhost',
		  port: 9876,
		  path: '/upload',
		  method: 'POST'
		};

var req = http.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	fs.readFile(process.argv[2], function(err, data) {
		req.write(data);
		req.end();
	});
