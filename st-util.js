var fs = require("fs");
var util = require("util");

function readFile(filePath, callback){
	var inputStream = fs.createReadStream(filePath);
	inputStream.on("error", function() {
			throw new Error("Can't read from file \"" + filePath + "\".");
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

String.prototype.endsWith = function(s){
	if(this.length >= s.length){
		return this.substring(this.length - s.length) == s
	}
	return false;
}

module.exports = {
	readFile: readFile,
	unQuote:function(s){
		var r;
		eval("r = "+s);
		return r;
	},
	fileName: function (path){
		var p = path.lastIndexOf("/");
		if(p < 0 )
			p = path.lastIndexOf("\\");
		if(p < 0)
			return path;
		return path.substring(p + 1);
	}
	//readStream: readStream
};
