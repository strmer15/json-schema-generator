var fs = require('fs'),
	fetch = require('cross-fetch'),
	cliConsole = require('./console'),
	IOType = require('./io-type'),
	logger = cliConsole.logger,
	errorHandler = cliConsole.errorHandler;

var createErrorString = function (url, error) {
  var errorString = [
    "There was an error loading the requested resource",
    ">>> " + url,
  ];

  if (error) {
    errorString.push(error.toString("utf8"));
  }

  return errorString.join("\n");
};

/**
 * Fetches a remote JSON document and generate
 * the schema based on the contents of the remote
 * resource. If an output directory is specified,
 * the document will be saved locally.
 *
 * @param {String} url - The location of the remote resource
 * @param {Function} callback
 */
var fetchResource = function (url, callback) {
  logger("Fetching URL resource: " + url);

  fetch(url)
    .then(function (response) {
      if (response.status === 200) {
        response.text()
          .then(function (body) {
            callback(body);
          })
          .catch(function (error) {
            errorHandler(createErrorString(url, error));
          });
      } else {
        errorHandler(createErrorString(url));
      }
    })
    .catch(function (error) {
      errorHandler(createErrorString(url, error));
    });
};

/**
 * Reads the specified JSON file from the
 * filesystem which is used to generate
 * the schema.
 *
 * @param {String} filePath - Path to JSON document to load.
 * @param {Function} callback
 */
var readFile = function(filePath, callback) {
	if (!fs.existsSync(filePath)) {
		errorHandler("File " + filePath + " does not exist. Please specify a valid path.");
	}
	var body = '';
	var reader = fs.createReadStream(filePath);
	reader.on('data', function(chunks) {
		body += chunks;
	}).on('end', function() {
		callback(body);
	}).on('error', function(e) {
		throw e;
	});
};

function stdin(callback) {
	var stream = process.stdin,
		body = '';

	stream.setEncoding('utf8');

	stream.on('readable', function() {
		while ((chunk = stream.read()) !== null) {
			body += chunk;
		}
	});

	stream.on('end', function() {
		callback(body);
	});
}

function handleInput(sourceConfig, callback) {
	var type = sourceConfig.type,
		path = sourceConfig.path;
	switch (type) {
		case IOType.URL:
			fetchResource(path, callback);
			break;
		case IOType.FILE:
			readFile(path, callback);
			break;
		// stdin?
		case IOType.STDIN:
			stdin(callback);
			break;
	}
}

module.exports = handleInput;