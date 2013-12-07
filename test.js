var main = require('./index.js');

var arg = process.argv[2];

switch (arg){
case "scan":
	main.scan();
	break;
case "replace":
	main.replace();
	
}
