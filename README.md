PoC of AngularJS based i18n text resource tool
--------------

This PoC is for server side i18n text resource solution.
Focusing on proove feasibility of making a smart tool for Text parsing, fetching, replacing, translation at compilation time.

## In general

Written in javascript based on Node.js, it is better to be packed as a Grunt task along with other Grunt tasks like
urglify, run at compilation time or as a git hook.

This Poc only demostrates how server side can do text replacement job.

## Basic Idea

 * Run `the tool` to
 scan and fetch `i18n text` from HTML files ( including AngularJS template HTML files) and Javascript inline template in form as String literals, 
 save in `translate` folder along with other information like line number, file location, offset ...

 * Translate tool (Crowdin or TS 2.5 Translation App) picks up text information from `translate` folder, interpreter crew do translation job, deploy translated resource to `translate` folder.

 * Run `the tool` to read translated resource, then replace all `i18n text` in HTML and Javascript files with those translated strings, save to `dist` folder.

 `dist` folder could be regarded as locale based package.
	

For example,
 - Having HTML file
 
	```
	  <i class="ts-icon-edit end t">TEST LABEL</i>
	```
	
	or
	
	```
	 <div class="_textual t">
		<div>
				  <ul>
						<li>TEST
					</ul>
			</div>
	  </div>
	```
	Scanner use HTML parser to look for tags whose class name contain "t", generates translatable file.
	
	```js
	[
	{
		  "tag": "i",
		  "offset": 323,
		  "line": 9,
		  "end": 333,
		  "text": "TEST LABEL"
		},
		{
		  "tag": "div",
		  "offset": 477,
		  "end": 561,
		  "line": 15,
		  "text": "\n              \t\t<ul>\n              \t\t\t<li>TEST\n              \t\t</ul>\n              "
		}
	]
	```

	- Having Javascript file 
	
	```js
	directive('fittext', [ function($timeout) {
	  ...
	  return {
		scope: {
		  minFontSize: '@',
		  maxFontSize: '@',
		  text: '='
		},
		template: "<div ng-transclude class='textContainer t' ng-bind=\"text\">JUST \nFOR TEST 1 </div>" +
			"more string  "
			+ ' <span class="t">JUST FOR ' 
			+ 'TEST 2</span> '
			+ nothing + ' <span class="t">JUST FOR TEST 3</span> ',
			...
	```
	Scanner leverages Javascript parser (in PoC, I use PEGJS) to parse javascript file, filters out `String literal`,
	again, HTML parser will scan those `String literal` and looks for HTML-like string which contains special HTML elment,
	generates translatable json file:
	
	```js
	{
	  "file": "test/test.js",
	  "result": [
		{
		  "tag": "div",
		  "offset": 58,
		  "end": 75,
		  "line": 13,
		  "text": "JUST \nFOR TEST 1 ",
		  "jslit_idx": 0
		},
		{
		  "tag": "span",
		  "offset": 111,
		  "end": 126,
		  "line": 14,
		  "text": "JUST FOR TEST 2",
		  "jslit_idx": 0
		},
		{
		  "tag": "span",
		  "offset": 17,
		  "end": 32,
		  "line": 17,
		  "text": "JUST FOR TEST 3",
		  "jslit_idx": 1
		}
	  ],
	  "srcFile": "./temp/test-test.js-jslit.json"
	}
	```
	
 - Manually replace those "text" with different language, here we assume this is done by a Translation App.
  The final replaced files will be like:
```
<div class="actions">
          ...
            <span class="test0 t test">中文主页</span>
            <i class="ts-icon-edit end t">这是标签</i>
          </button>
          
          <form>
          <fieldset class="uniform">
            <p>
              <div class="_textual t">
              		<div><ul>
              			<li>测试
              		</div></ul>
              </div>
            </p>
          </fieldset>
        ...
```

And the replaced file will be:

```js
...
  return {
    scope: {
      minFontSize: '@',
      maxFontSize: '@',
      text: '='
    },
    restrict: 'C',
    transclude: true,
    template: "<div ng-transclude class='textContainer t' ng-bind=\"text\">测试一</div>more string   <span class=\"t\">测试二</span> "
    	+ nothing + " <span class=\"t\">测试三</span> ",
    ...
```
## How to run a demo
 * Step 1,  run `node bin.js scan test`
   Scanner will scan test files in `test` folder, generate folders `translate` and `temp`
   
 * Step 2, manully edit json files in `translate` folder, image you are acting an Translation App :)
 
 * Step 3, run `node bin.js replace`
   Now, check out the files in `dist` folder.
   
   Check out bin.js, a very simple configuration.
   

## This is just a small PoC,  I guess an ideal tools should have functionality likes
 * Integrate with Crowdin or TS 2.5 tranlation App, or exchange files with them.

 * If we don't use RequireJS, Replace html tag <script src="xxx.js"></script> and <link href="xxx.css"> with appending random query hash code to the URL,
   which can disable browser's cache everytime new js file released, like <script src="xxx.js?921039218"></script>
 
 * Supporting static text in html element attributes like what TS 2.5 does.
 
 * Replacing templateUrl value in AngluarJS directive definition.
 
 * Configuration, conditional scan javascript file, performance tuning for parser.
 
 * A summary report...
 
## What shouldn't be supported by a Server side i18n tool
 * Dynamic element creation, dynamic element class name adding, only client side knows when you add a a class name like "t".
 
 * Let us think ...
	
	
