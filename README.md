PoC of AngularJS based text resource Translation toolkit
--------------

This PoC is a PoC of server side i18n text resource solution

## In general

Written in javascript based on Node.js, it is better to be packed as a Grunt task along with other Grunt tasks like
urglify and less, run at compilation time or as a git hook.

## Basic Idea

 * Run `the tool` to
 scan and fetch `i18n text` from HTML files ( including AngularJS template HTML files) and Javascript inline template in form as String literals, save in `translate` folder.

 * Translate tool (Crowdin or TS 2.5 Translate App) picks up text information from `translate` folder, interpreter crew do translation job, deploy translated resource to `translate` folder.

 * Run `the tool` to read translated resource, then replace all `i18n text` in HTML and Javascript files with those translated strings, save to `dist` folder.

 `dist` folder could be regarded as locale based package.
	

For example,
 - Having HTML file:
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
Scanner use HTML parser to look for tags whose class name contain "t", generates translatable file
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
	again HTML parser wiil scan those `String literal` and looks for HTML like string which contains HTML elment,
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
	
 - Manually replace those "text" with different language, here we pretent this is done by a Tranlate App.
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

```
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


## PoC implementation
 * Parse

### Raw Source Code

* Raw HTML files: *.html (e.g. `index.html`, `XXX-template.html`)
* Raw Javascript file: *.js (e.g. `directive/*.js`)

### Intermediate Meta Data

* 
