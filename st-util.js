var fs = require("fs");
var util = require("util");

function readFile(filePath, callback){
	var inputStream = fs.createReadStream(filePath);
	inputStream.on("error", function() {
	abort("Can't read from file \"" + filePath + "\".");
	});
	readStream(inputStream, function(input){
			callback(input);
	});
}

function readStream(inputStream, callback) {
	var input = "";
	inputStream.on("data", function(data) { input += data; });
	inputStream.on("end", function() { callback(input); });
}

module.exports = {
	readFile: readFile,
	unQuote:function(s){
		var r;
		eval("r = "+s);
		return r;
	}
	//readStream: readStream
};
