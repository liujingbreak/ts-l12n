
module.exports = (function(){
	"use strict";
	var fs = require("fs");
	var util = require("util");
	var stutil = require("./st-util.js");
	
	function writeFile(path, data, callback){
		var out = fs.createWriteStream(path, {encoding:'UTF-8'});
		out.on("error", function() {
				abort("Can't read from file \"" + path + "\".");
		});
		var ok = out.write(data, 'UTF-8');
		if(! ok ){
			out.once("drain", function(){out.end(callback);});
		}else
			out.end(callback);
	}
	
	function abort(message) {
		util.error(message);
		process.exit(1);
	}
	
	function fileName(path){
		var p = path.lastIndexOf("/");
		if(p < 0 )
			p = path.lastIndexOf("\\");
		if(p < 0)
			return path;
		return path.substring(p + 1);
	}
		
	return {
		replace: function (tranData, distFolder){
			stutil.readFile(tranData.file, function(src){
				console.log("\n----------------------\n\t(/ - ,-)/ replacing "+ tranData.file);
				var wOffset = 0, dist = "";
				//console.log("sorted :\n" + JSON.stringify(sorted, null, "  "));
				
				tranData.result.forEach(function(el, i){
					dist += src.substring(wOffset, el.offset);
					dist += el.text;
					wOffset = el.end;
				});
				console.log(wOffset + "/"+ src.length);
				if(wOffset < src.length){
					//console.log(wOffset);
					//console.log("---------\n" + src.substring(wOffset));
					dist += src.substring(wOffset);
				}
				console.log(dist);
				writeFile(distFolder + fileName( tranData.file ), dist);
			});
		},
		fileName: fileName,
		writeFile: writeFile
	};
})();
