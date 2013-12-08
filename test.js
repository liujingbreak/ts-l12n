var main = require('./index.js');

var arg = process.argv.slice(2);


switch (arg[0]){
case "scan":
	main.scan();
	break;
case "replace":
	main.replace();
	break;
case "scan-1":
	main.scanSingle("./test/test.html", {
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	break;
case "replace-1":
	main.replaceSingle(arg[1], {
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	default:
		console.log("unknown argument "+ arg[0]);
}
