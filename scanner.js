module.exports = (function(){
"use strict";
var fs = require("fs");
var util = require("util");
var stutil = require("./st-util.js");
var hparser = require("./html-parser.js");
var jsparser = require("./javascript-parser.js");
var Promise = require('promise');
var replacer = require("./replacer.js");
var ph = require("path");


function _apply(dist, src){
	for( var f in src){
		dist[f] = src[f];
	}
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
	//console.log(JSON.stringify(jsonData, null, " "));
	return jsonData.sort(function(a, b){
			try{
			return a.offset - b.offset;
			}catch(e){
				//debugger;
				throw e;
			}
		});
}

function Reporter(){
	this.scanCount = 0;
	this.fileCount = 0;
	this.jsFileCount = 0;
	this.htmlFileCount = 0;
	this.textCntPerFile = 0;
	this.textCount = 0;
	this._js = false;
}
Reporter.prototype = {
	begin:function(){
		var d = new Date();
		this._reportFile = 
		"scan_report"+  "_" + d.getFullYear() +"-"+ (d.getMonth() + 1) + "-" + d.getDate() +
			" "+ d.getHours()+ ":"+ d.getMinutes() + ":" + d.getSeconds() + '.'+d.getMilliseconds() + ".txt";
		
	},
	fileScanStart:function(filepath){
		this.currFile = filepath;
		this.textCntPerFile = 0;
		this._txtfndPerFile = [];
		this.scanCount ++;
		this._js = ph.extname(filepath).toLowerCase() == ".js";
		
	},
	fileScanStop: function(bI18n, textEntries){
		var self = this;
		this.scanCount ++;
		if(! bI18n)
			return;
		this.fileCount ++;
		if(this._js)
			this.jsFileCount++;
		
		if(textEntries){
			this.textCntPerFile += textEntries.length;
			this.textCount += textEntries.length;
			this._txtfndPerFile = textEntries;
		}
		self._writeln("\n--------------------------\n");
		this._writeln("file: "+ this.currFile+ "\t Text label found: "+ this.textCntPerFile);
		
		this._txtfndPerFile.forEach(function(el, i){
				self._writeln("line:"+ el.line + "\t"+ el.text);
		});
		
		
	},
	text:function(entry){
		this.textCntPerFile ++;
		this.textCount ++;
		this._txtfndPerFile.push(entry);
		//console.log(entry);
	},
	jsInclude:function(file, srclink){
	},
	templateUrl: function(file, srclink){
	},
	end:function(){
		this._writeln("[ Total ] Scanned files:"+ this.scanCount + " Text labels: "+ this.textCount +
			"  HTML files: "+ this.htmlFileCount +"  JS files: "+this.jsFileCount);
	},
	_writeln:function(data){
		console.log(data);
		//fs.appendFile(this._reportFile, data+ "\n");
	}
};
var reporter = new Reporter();

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
		console.log("scanning "+ file);
		reporter.fileScanStart(file);
		var self = this; 
		//console.log(self._parse);
		//console.log(self._parseTree);
		return this._parse(file).then(function(r){
			//console.log(JSON.stringify(r, null, "  "));
			return self._parseTree(file, r.parsed, r.raw);
		})
		.then(function(r){
			self._trans(file, self.output);
		})
		.then(function(){
				
		}, function(e){
			console.log("Scanning failed with "+ e);
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
		reporter.fileScanStop(meta.result.length > 0, meta.result);
		if(meta.result.length <= 0){
			return;
		}
		var trans = new TransFileGenerator(this.cfg.trans);
		return trans.writeTranslable(ph.dirname(file).replace(new RegExp(ph.sep, 'g'), '_')  +"-" + stutil.fileName(file), meta);
	},
	/**@param pr parsed result
	*/
	findClassT: function (pr, rawText){
		var len = pr.length;
		var res = this.currFile.result;
		var self = this;
		//console.trace(self);
		pr.forEach(function(el, i){
			var entry;
			if(el.type == "element"){
				if(el.attrs){
					if( el.attrs.some(function(attr){
							//console.log(el.element);
						return (attr.name == 'class' && _containsStr(attr.value, 't'));
					}) ){
						if( el.value){
							// nested element, I take the whole inner area as text
							entry = {
								tag: el.element,
								offset: el.innerOffset, 
								end: el.innerEnd,
								line: el.line,
								text: rawText.substring(el.innerOffset, el.innerEnd)
							};
							res.push(entry);
							//reporter.text(entry);
						}else if(el.$ == "(T_T)"){
							// I take next text element as text
							var next = pr[i + 1];
							if(next && next.type == "text"){
								entry = {
									tag: el.element,
									offset: next.offset,
									line: next.line, 
									end: next.end,
									text: next.text
								};
								res.push(entry);
								//reporter.text(entry);
							}
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
}
JsScanner._super = HtmlScanner.prototype;
JsScanner.prototype = Object.create(HtmlScanner.prototype);
_apply(JsScanner.prototype, {
	_parseTree:function(file, langTree, raw){
		var transData = [], tempData = []; // filtered lang tree
		langTree.forEach(function(el, i){
				//console.log("******* " + JSON.stringify(el, null, "  "));
				var stringLit = el.text, parseFail = false;
				//console.log(stringLit);
				var htmlScan = new HtmlScanner();
				try{
					htmlScan._parseTree(file, hparser.parse(stringLit), stringLit);
				}catch(e){
					//todo: predicate if e.name is 'SyntaxError' and comes from parser
					parseFail = true;
				}
				//console.log(inScan.output);
				var res = htmlScan.output.result;
				var tempDataIdx = tempData.length;
				if(!parseFail && res && res.length > 0){
					res.forEach(function( el2, i){
						transData.push(el2);
						el2.jslit_idx = tempDataIdx;
						//el2.offset += el.offset+1 ; // +1 for counting quote symbol
						//el2.end += el.offset;
						el2.line += el.line -1;
						//reporter.text(el2);
					});
					tempData.push(el);
				}
		});
		if(tempData.length > 0){
			var trans = new TransFileGenerator(this.cfg.temp);
			trans.writeTranslable(this._tempFilename(file), {srcFile:file, result:tempData});
		}
		//reporter.fileScanStop(tempData.length > 0);
		this.currFile = {
				file: file,
				result:transData,
				srcFile: this.cfg.temp + '/'+ this._tempFilename(file) + ".json"
			};
		this.output = this.currFile;
	},
	_tempFilename: function(srcfile){
		return ph.dirname(srcfile).replace(new RegExp(ph.sep, 'g'), '_') +"-"+ ph.basename(srcfile) + "-jslit";
	}
});

function _containsStr(str, name){
	return str.split(' ').some(function(el){
		return el == name;
	});
}

function unescapeQuote(s){
	var ret = "";
	for(var i =0, l = s.length; i< l; i++){
		var c = s.charAt(i);
		var next, rep = null;
		if(c == '\\'){
			next = s.charAt(i+1);
			if( next == '"' || next == "'")
				rep = "\"";
			else if(next == "\\")
				ret += "\\";
			i ++;
		}else
			ret += c;
	}
	return ret;
}

/** @class TransFileGenerator */
function TransFileGenerator(transFolder){
	this.folder = transFolder;
}
_apply(TransFileGenerator.prototype,{
	
	writeTranslable: function(filename, jsonData){
		//jsonData.result = jsonData;
		replacer.writeFile(this.folder + '/'+ filename+".json" , JSON.stringify(jsonData, null, "  "),
			function(){
				
			});
		return jsonData;
	},
	/** useless */
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
function scanFolder(folder, config){
	var files = fs.readdirSync(folder);
	var promises = [], pr;
	files.forEach(function(fname, i){
		
		var path = folder + ph.sep + fname;
		var st = fs.statSync(path);
		
		if(fname.substring(0,1) == ".")
			return;
		
		if(st.isDirectory()){
			var sp = scanFolder(path, config);
			sp.forEach(function(p){
				promises.push(p);});
		}else{
			var scan;
			if(path.endsWith('.html')){
				scan = new HtmlScanner(config);
				pr = scan.scanSingle(path);
			}
			else if(path.endsWith('.js')){
				scan = new JsScanner(config);
				pr = scan.scanSingle(path);
			}
			promises.push(pr);
		}
	});
	return promises;
}

var exports = {
	scanSingle:function(filepath, config){
		Promise.from(setupConfig(config))
		.done(function(){
				var scan;
				if(filepath.endsWith('.html')){
					scan = new HtmlScanner(config);
					scan.scanSingle(filepath);
				}
				else if(filepath.endsWith('.js')){
					scan = new JsScanner(config);
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
		}, function(e){
			console.log(e);
		});
	},
	scan: function(srcdirs, config){
		Promise.from(setupConfig(config))
		.then(function(){
			var dirs = srcdirs instanceof Array ? srcdirs : [srcdirs];
			reporter.begin();
			var prs = [];
			srcdirs.forEach(function(folder){
				prs.push(scanFolder(folder, config));
			});
			return Promise.all(prs);
		}, function(e){
			console.log(e);
			throw e;
		}).done(function(){
		});
	},
	
	replace:function(config){
		Promise.from(setupConfig(config))
		.then(function(){
			var files = fs.readdirSync(config.trans);
			files.forEach(function(file){
					replacer.replace(config.dist, ph.join(config.trans, file));
			});
		}).done(null, function(e){
			console.log(e);
			throw e;
		});
	},
	
	setup: setupConfig
};

return exports;

})();


