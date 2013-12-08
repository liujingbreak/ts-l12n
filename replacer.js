
module.exports = (function(){
	"use strict";
	var fs = require("fs");
	var util = require("util");
	var stutil = require("./st-util.js");
	var Promise = require('promise');
	
	function writeFile(path, data, callback){
		var out = fs.createWriteStream(path, {encoding:'UTF-8'});
		out.on("error", function() {
				console.trace("Can't write to file \"" + path + "\".");
				throw new Error("Can't write to file \"" + path + "\".");
		});
		var ok = out.write(data, 'UTF-8');
		if(! ok ){
			out.once("drain", function(){out.end(callback);});
		}else
			out.end(callback);
	}
	
	function _repText(sText, meta){
		var wOffset = 0, dist = "";
		//console.log("sorted :\n" + JSON.stringify(sorted, null, "  "));
		
		meta.forEach(function(el, i){
			dist += sText.substring(wOffset, el.offset);
			dist += el.text;
			wOffset = el.end;
		});
		//console.log(wOffset + "/"+ sText.length);
		if(wOffset < sText.length){
			//console.log(wOffset);
			//console.log("---------\n" + sText.substring(wOffset));
			dist += sText.substring(wOffset);
		}
		return dist;
	}
	
	function repFile(sFile, meta){
		return new Promise(function(resolve, rej){
			stutil.readFile(sFile, function(src){
				console.log("\n----------------------\n\t(/ - ,-)/ replacing "+ sFile);
				var dist = _repText(src, meta);
				resolve(dist);
			});
		});
	}
	
	function replaceHtml(distFolder, transFile){
		stutil.readFile(transFile, function(trans){
			var transdata = JSON.parse(trans);
			var dist = null;
			repFile(transdata.srcFile, transdata.result).then(
				function(disttext){
					writeFile(distFolder + "/"+ fileName(transdata.srcFile), disttext);
				});
		});
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
		
	var ret = {
		
		replace: function(distFolder, transFile){
			if(transFile.endsWith('.html.json')){
				replaceHtml(distFolder, transFile);
			}
		},
		
		_replace: function (tranData, distFolder){
			stutil.readFile(tranData.srcFile, function(src){
				console.log("\n----------------------\n\t(/ - ,-)/ replacing "+ tranData.srcFile);
				var dist = repText(src, tranData.result);
				/* var wOffset = 0, dist = "";
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
				} */
				console.log(dist);
				writeFile(distFolder + fileName( tranData.srcFile ), dist);
			});
		},
		fileName: fileName,
		writeFile: writeFile
	};
	return ret;
})();
