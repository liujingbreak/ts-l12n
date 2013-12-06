module.exports = (function(){
"use strict";
var fs = require("fs");
var util = require("util");
var hparser = require("./html-parser.js");
var jsparser = require("./javascript-parser.js");
var Promise = require('promise');

function scanHtml(filepath){
	return new Promise(function(resolve, reject){
		readFile(filepath,
			function(input){
				try{
					var r = hparser.parse(input);
					resolve({parsed: r, raw: input});
				}catch(e){
					reject(e);
				}
			}
		);
	});
}


function scanJs(filepath){
	return new Promise(function(resolve, reject){
		readFile(filepath,
			function(input){
				try{
					//console.log(" "+ input);
					var r = jsparser.parse(input);
					resolve(r);
				}catch(e){
					reject(e);
				}
			}
		);
	});
}


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

function Scanner(){
	this.output = [];
	
}
Scanner.prototype.scanHtmlTree = function(filepath, pr, text){
	this.currFile = {};
	this.output.push(this.currFile);
	this.currFile.file = filepath;
	this.currFile.result = [];
	this.text = text;
	this.findClassT(pr);
	
}
/**@param pr parsed result
*/
Scanner.prototype.findClassT= function (pr){
	var len = pr.length;
	var res = this.currFile.result;
	var self = this;
	//console.trace(self);
	pr.forEach(function(el, i){
		if(el.type == "element"){
			if(el.attrs){
				if( el.attrs.some(function(attr){
						//console.log(el.element);
					return (attr.name == 'class' && _containsStr(attr.value, 't'));
				}) ){
					if( el.value){
						// nested element, I take the whole inner area as text
						res.push({
							tag: el.element,
							offset: el.innerOffset, 
							end: el.innerEnd,
							line: el.line,
							text: self.text.substring(el.innerOffset, el.innerEnd)
						});
					}else if(el.$ == "(T_T)"){
						// I take next text element as text
						var next = pr[i + 1];
						if(next && next.type == "text")
							res.push({
								tag: el.element,
								offset: next.offset,
								line: next.line, 
								end: next.end,
								text: next.text
							});
					}
					
				}
			}
			if(el.value){
				self.findClassT(el.value);
			}
		}
		
	});
}

function _containsStr(str, name){
	return str.split(' ').some(function(el){
		return el == name;
	});
}

function exitSuccess() {
  process.exit(0);
}

function exitFailure() {
  process.exit(1);
}

function abort(message) {
  util.error(message);
  exitFailure();
}

function handleError(e){
			console.trace("LJ says parse failed: "+ e );
			console.dir(e);
			//for(var f in e){
			//	console.log(f + ":" + e[f]);
			//}
			throw e;
		}
return {
	scanHtml: scanHtml,
	
	testParse: function(){
		var scan = new Scanner();
		scanHtml('./test/test.html').
		then(function(r){
				//console.log(JSON.stringify(r.parsed, null, '  '));
				//console.log(" --------------------- ");
				scan.scanHtmlTree("./test/test.html", r.parsed, r.raw);
				console.log(JSON.stringify(scan.output, null, '  '));
				return scanJs('./test/test.js');
			} , handleError
			
		).done(function(r){
			console.log(JSON.stringify(r, null, '  '));
			console.log("----- end of test ------");
		}, handleError);
	}
};

})();


