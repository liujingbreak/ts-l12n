module.exports = (function(){
"use strict";
var fs = require("fs");
var util = require("util");
var stutil = require("./st-util.js");
var hparser = require("./html-parser.js");
var jsparser = require("./javascript-parser.js");
var Promise = require('promise');
var replacer = require("./replacer.js");


function _apply(dist, src){
	for( var f in src){
		dist[f] = src[f];
	}
}

function scanHtml(filepath){
	return new Promise(function(resolve, reject){
		stutil.readFile(filepath,
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
		stutil.readFile(filepath,
			function(input){
				try{
					var inScan = new Scanner();
					//console.log(" "+ input);
					var r = jsparser.parse(input);
					var rr = [], r0 = [];
					if(!fs.existsSync("./temp"))
						fs.mkdirSync("./temp");
					
					r.forEach(function(el, i){
							//console.log("******* " + JSON.stringify(el, null, "  "));
							var stringLit = el.text;
							//console.log(stringLit);
							inScan.scanHtmlTree(filepath, hparser.parse(stringLit), stringLit);
							//console.log(inScan.output);
							var res = inScan.output.result;
							if(res && res.length > 0){
								res.forEach(function( el2, i){
									rr.push(el2);
									//el2.offset += el.offset+1 ; // +1 for counting quote symbol
									//el2.end += el.offset;
									el2.line += el.line -1;
								});
								r0.push(el);
							}
					});
					var tmpfname = replacer.fileName(filepath);
					//replacer.writeFile("./temp/" + replacer.fileName(filepath) + ".strLiteral", 
					//		JSON.stringify(r0, null, "  " ));
					//console.log(rr);
					resolve({
							temp: { file: filepath, result: r0},
							translatable:{file: filepath, result:rr, tempFile: "./temp/"+ tmpfname}
					});
				}catch(e){
					reject(e);
				}
			}
		);
	});
}




/** @class Scanner */
function Scanner(){
	this.output = {};
	
}
_apply(Scanner.prototype, {
	/**@param pr parsed result
	*/
	findClassT: function (pr){
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
	},
	
	scanHtmlTree: function(filepath, pr, text){
		this.currFile = {};
		this.output = this.currFile;
		this.currFile.file = filepath;
		this.currFile.result = [];
		this.text = text;
		this.findClassT(pr);
		/*
			[
				{file: filepath, result: [ { text:, offset:, ...},... ] }
			]
		*/
	}
});

function _containsStr(str, name){
	return str.split(' ').some(function(el){
		return el == name;
	});
}

/** @class TransFileGenerator */
function TransFileGenerator(transFolder){
	this.folder = transFolder;
}
_apply(TransFileGenerator.prototype,{
	_sort:function(jsonData){
		var sorted = jsonData.result.sort(function(a, b){
			return a.offset - b.offset;
		});
		return sorted;
	},
	
	writeTranslable: function(filename, jsonData){
		var d = this._sort(jsonData);
		jsonData.result = d;
		replacer.writeFile(this.folder + '/'+ filename+".json" , JSON.stringify(jsonData, null, "  "));
	},
	
	readTranslated: function(filepath){
		return new Promise(function(resolve, reject){
			readFile(filepath, function(input){
					resolve(input);
			});
		});
	}
});

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

function mkdir(path){
	return new Promise(function(resolve, reject){
			fs.mkdir(path, function(){
					resolve();
			});
		});
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
	
	scan: function(){
		var jsfile = 'test.js';
		var htmlfile = 'test.html';
		var srcFolder = "./test/";
		var scan = new Scanner();
		var trans = new TransFileGenerator("./translatable");
		var transTemp = new TransFileGenerator("./temp");
		mkdir("./translatable").then(function(){
			return mkdir("./dist");
		})
		.then(function(){
			return scanHtml( srcFolder + htmlfile );
		})
		.then(function(r){
				//console.log(JSON.stringify(r.parsed, null, '  '));
				//console.log(" --------------------- ");
				scan.scanHtmlTree(srcFolder +htmlfile, r.parsed, r.raw);
				var psHtml = JSON.stringify(scan.output, null, '  ');
				//replacer.writeFile("./scan-result/"+ htmlfile +"-replace.json", psHtml);
				console.log(psHtml);
				//replacer.replace(scan.output, r.raw, "./dist/");
				trans.writeTranslable(htmlfile, scan.output);
				return scanJs(srcFolder +jsfile);
			} , handleError
		)
		.done(function(r){
			var psJs = JSON.stringify(r.translatable, null, '  ');
			transTemp.writeTranslable(jsfile, r.temp);
			console.log("-----JS file meta data: -----\n"+ psJs);
			trans.writeTranslable(jsfile, r.translatable);
			console.log("----- end of test ------");
		}, handleError);
	},
	
	replace:function(folder){
		if(!folder)
			folder = "./translatable";
		mkdir("./dist").then(function(){
			return mkdir("./dist");
		}).then(function(){
			var files = fs.readdirSync(folder);
			console.log("   "+ files);
			files.forEach(function(filename, i){
				if(filename.substring(filename.length - ".js.json".length) ==  ".js.json"){
					return;
				}
				var tranDataFile = folder + "/" + filename;
				console.log(filename);
				stutil.readFile(tranDataFile, function(tstr){
						
						//console.log(tstr); 
						var tranData = JSON.parse(tstr);
						//eval("tranData="+ tstr);
					replacer.replace(tranData, "./dist/");
				});
			});
		}).done(function(){}, function(e){
			console.log(e);
			throw e;
		});
		
	}
};

})();


