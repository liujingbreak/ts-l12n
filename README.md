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
 Having HTML file:
 ```
  <i class="ts-icon-edit end t">TEST LABEL</i>
 ```
or
 ```
<div class="_textual t">
                <div class="_textual t">
              		<ul>
              			<li>TEST
              		</ul>
              </div>
              </div>
```
Scanner looks for tags whose class name contains "t", generates translatable file
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

Having Javascript file 




## PoC implementation
 * Parse

### Raw Source Code

* Raw HTML files: *.html (e.g. `index.html`, `XXX-template.html`)
* Raw Javascript file: *.js (e.g. `directive/*.js`)

### Intermediate Meta Data

* 
