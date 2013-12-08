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
							inScan.parseHtmlTree(filepath, hparser.parse(stringLit), stringLit);
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
							trans:{file: filepath, result:rr, tempFile: "./temp/"+ tmpfname}
					});
				}catch(e){
					reject(e);
				}
			}
		);
	});
}


function setupConfig(config){
	if(config.trans && !fs.existsSync(config.trans))
		fs.mkdirSync(config.trans);
	if(config.temp && !fs.existsSync(config.temp))
		fs.mkdirSync(config.temp);
	if(config.dist && !fs.existsSync(config.dist))
		fs.mkdirSync(config.dist);
	
}

function sortParsedData(jsonData){
	return jsonData.sort(function(a, b){
			return a.offset - b.offset;
		});
}

/** @class Scanner */
function HtmlScanner(config){
	this.output = {};
	this.cfg = config; // folder setting
	this.parser = hparser;
	//console.trace(config);
}
HtmlScanner.prototype.constructor = HtmlScanner;
_apply(HtmlScanner.prototype, {
	scanSingle:function(file){
		var self = this; 
		//console.log(self._parse);
		//console.log(self._parseTree);
		this._parse(file).then(function(r){
			//console.log(JSON.stringify(r, null, "  "));
			return self._parseTree(file, r.parsed, r.raw);
		})
		.then(function(r){
			return self._trans(file, self.output);
		})
		.done(null, function(e){
			console.log(e);
			throw e;
		});
	},
	_parse:function(filepath){
		var self = this;
		return new Promise(function(resolve, reject){
		stutil.readFile(filepath,
			function(input){
				try{
					//console.log(input);
					var r = sortParsedData(self.parser.parse(input));
					resolve({parsed: r, raw: input});
				}catch(e){
					reject(e);
				}
			}
		);
		});
	},
	_parseTree:function(filepath, pr, text){
		this.currFile = {};
		this.output = this.currFile;
		this.currFile.file = this.currFile.srcFile = filepath;
		this.currFile.result = [];
		this.findClassT(pr, text);
	},
	_trans:function(file, meta){
		var trans = new TransFileGenerator(this.cfg.trans);
		return trans.writeTranslable(stutil.fileName(file), meta);
	},
	/**@param pr parsed result
	*/
	findClassT: function (pr, rawText){
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
								text: rawText.substring(el.innerOffset, el.innerEnd)
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
					self.findClassT(el.value, rawText);
				}
			}
			
		});
	}
	
});

function JsScanner(config){
	JsScanner._super.constructor.call(this, config);
	this.parser = jsparser;
};
JsScanner._super = HtmlScanner.prototype;
JsScanner.prototype = Object.create(HtmlScanner.prototype);
_apply(JsScanner.prototype, {
	_parseTree:function(file, langTree, raw){
		var transData = [], tempData = []; // filtered lang tree
		langTree.forEach(function(el, i){
				//console.log("******* " + JSON.stringify(el, null, "  "));
				var stringLit = el.text;
				//console.log(stringLit);
				var htmlScan = new HtmlScanner();
				 htmlScan._parseTree(file, hparser.parse(stringLit), stringLit);
				//console.log(inScan.output);
				var res = htmlScan.output.result;
				if(res && res.length > 0){
					res.forEach(function( el2, i){
						transData.push(el2);
						//el2.offset += el.offset+1 ; // +1 for counting quote symbol
						//el2.end += el.offset;
						el2.line += el.line -1;
					});
					tempData.push(el);
				}
		});
		
		var trans = new TransFileGenerator(this.cfg.temp);
		trans.writeTranslable(this._tempFilename(file), {srcFile:file, result:tempData});
		
		this.currFile = {
				file: file,
				result:transData,
				srcFile: this.cfg.temp + '/'+ this._tempFilename(file) + ".json"
			};
		this.output = this.currFile;
	},
	_tempFilename: function(srcfile){
		return replacer.fileName(srcfile) + "-jslit";
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
	
	writeTranslable: function(filename, jsonData){
		//jsonData.result = jsonData;
		replacer.writeFile(this.folder + '/'+ filename+".json" , JSON.stringify(jsonData, null, "  "));
		return jsonData;
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
	scanSingle:function(filepath, config){
		Promise.from(setupConfig(config))
		.done(function(){
				
				if(filepath.endsWith('.html')){
					var scan = new HtmlScanner(config);
					scan.scanSingle(filepath);
				}
				else if(filepath.endsWith('.js')){
					var scan = new JsScanner(config);
					scan.scanSingle(filepath);
				}
				
		}, function(e){
			console.log(e);
			throw e;
		});
		
	},
	replaceSingle:function(filepath, config){
		Promise.from(setupConfig(config)).done(function(){
		replacer.replace(config.dist, filepath);
		});
	},
	scan: function(file){
		var jsfile = 'test.js';
		var htmlfile = 'test.html';
		var srcFolder = "./test/";
		var scan = new Scanner();
		var trans = new TransFileGenerator("./trans");
		var transTemp = new TransFileGenerator("./temp");
		mkdir("./trans").then(function(){
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
			var psJs = JSON.stringify(r.trans, null, '  ');
			transTemp.writeTranslable(jsfile, r.temp);
			console.log("-----JS file meta data: -----\n"+ psJs);
			trans.writeTranslable(jsfile, r.trans);
			console.log("----- end of test ------");
		}, handleError);
	},
	
	replace:function(folder){
		if(!folder)
			folder = "./trans";
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
		
	},
	
	setup: setupConfig
};

})();


