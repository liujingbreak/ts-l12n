var main = require('./scanner.js');

var arg = process.argv.slice(2);


switch (arg[0]){
case "scan":
	main.scan(arg.slice(1), {
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	break;
case "replace":
	main.replace({
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	break;
case "scan1":
	main.scanSingle(arg[1], {
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	break;
case "replace1":
	main.replaceSingle(arg[1], {
		temp: "./temp",
		dist: "./dist",
		trans: "./translate"
	});
	break;
	default:
		console.log("unknown argument "+ arg[0]);
}
