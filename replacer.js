
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
	
	function _repText(sText, meta, isStringLit){
		var wOffset = 0, dist = "";
		
		meta.forEach(function(el, i){
			dist += sText.substring(wOffset, el.offset);
			dist += isStringLit? JSON.stringify(el.text) : el.text;
			wOffset = el.end;
		});
		if(wOffset < sText.length){
			dist += sText.substring(wOffset);
		}
		return dist;
	}
	
	function repFile(sFile, meta, isStringLit){
		return new Promise(function(resolve, rej){
			stutil.readFile(sFile, function(src){
				console.log("  (/ - ,-)/ replacing "+ sFile);
				var dist = _repText(src, meta, isStringLit);
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
	
	function replaceJs(distFolder, transFile){
		stutil.readFile(transFile, function(trans){
			var transdata = JSON.parse(trans);
			stutil.readFile(transdata.srcFile, function(jsLitMetaStr){
				var jsLitMeta = JSON.parse(jsLitMetaStr);
				var _transdata = orgTranDataByJsIndex(transdata, jsLitMeta);
				jsLitMeta.result.forEach(function(el, i){
						el.text = _repText(el.text, _transdata[i]);
				});
				//console.log(JSON.stringify(jsLitMeta, null, "  "));
				var dist = null;
				repFile(jsLitMeta.srcFile, jsLitMeta.result, true).then(
					function(disttext){
						writeFile(distFolder + "/"+ fileName(jsLitMeta.srcFile), disttext);
					});
			});
			
			
		});
	}
	
	function orgTranDataByJsIndex(transdata, jsLitMeta){
//		debugger;
		var ret = new Array(jsLitMeta.length);
		transdata.result.forEach(function(el, i){
				var j = el.jslit_idx;
				if(!ret[j])
					ret[j] = [];
				ret[j].push(el);
		});
		return ret;
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
			}else if(transFile.endsWith('.js.json')){
				replaceJs(distFolder, transFile);
			}
		},
		
		_replace: function (tranData, distFolder){
			stutil.readFile(tranData.srcFile, function(src){
				//console.log("\n----------------------\n\t(/ - ,-)/ replacing "+ tranData.srcFile);
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
