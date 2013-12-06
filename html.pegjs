{
	var closableTags = {'div':true, 'span':true, 'script':true, 'section':true};
	var c_pass = false;
	var lsName, openedName = [];
	function testInElement(name){
		lsName = name;
		var p = closableTags[name.toLowerCase()] == true;
		c_pass = p;
		return p;
	}
	function testOutElement(name){
		return openedName.length >0 && openedName[openedName.length - 1]  == name ;
	}
	
	function findClassT(attr){
		if(attr.name.toLowerCase() == 'class'){
			var v = attr.value.split(' ');
			return v.some(function(name){
				return name == 't';
			});
		}
		return false;
	}
}
start
	= m:mess* {return m;}
	
mess =
	c:Comment	{ return {type: "comment", line: line()}; }
	/ e:element	
	/ text
	
element
	= o:openTag  m:mess* c:closeTag 
	{
		o.offset = offset();
		o.innerOffset = o.end,
		delete o.end;
		o.innerEnd = c;
		o.value = m; 
		openedName.pop();
		return o;
	}
	/ completeTag	
	/ quirkTag		
	/ quirkCloseTag
	
	
openTag
	= '<' name:name &{ return testInElement(name) }  attrs:attr* _  '>' 

	{ 
		openedName.push(name);
		//console.log(line() + ' -> '+ name);
		
		return {
			type: "element",
			element : name,
			attrs: attrs,
			line: line(),
			end: peg$currPos,
			$:"(^.^)"
		};
	}
	
completeTag
	= '<' name:name attrs:attr* _ '/>' 
	{	return { type:"element", element: name, attrs: attrs, $:"(-,-)", value: null }; }
	
quirkTag
	=  '<' name:name  !{  return testInElement(name);  } attrs:attr* _ '/'? '>' 
	{
		return { type:"element", element: name, attrs: attrs, $:"(T_T)" };
	}

closeTag
	= '</' name:name 
	&{ return testOutElement(name) }
	'>' 
	{	return offset(); }
	
quirkCloseTag
	= '</' name:name !{  return testInElement(name);  } '>' { return {closetag: name}; }
attr
	= _? name:name a:(_ '=' _ attrValue )?
	{
		var r = {
			name: name
		};
		if(a !== null){
			r.value = a[3].value;
			r.vOffset = a[3].offset;
			r.vEnd = a[3].end;
		}
		return r;
	}
	
name = c: [^ \t\n\r>/=]+
	{ return text(); }


attrValue = 
	q:Quote	{ return {value: q, offset: offset() +1, end: peg$currPos - 1}; }
	/ c:[^ ]+	{ return {value: text(), offset: offset(), end:  peg$currPos} }

text
	= c: [^<]+
	{
		return {
			type: 'text',
			text: text(),
			line: line(),
			column: column(),
			offset: offset(),
			end:  peg$currPos
		}; 
	}
	
_ "skip"
	= (WS / Comment )*
	
WS "white space"
	= [\n\r\t\v\f \u00A0\uFEFF]  {return '';}
	/ Zs	{return '';}
	
Zs
	= [\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]

Comment
	= '<!--' c:(!'-->' .)* '-->'	
	{
		var ret = ''
		c.forEach(function(e){
			ret += e[1];
		});
		return ret;
	}
	
Quote "StringLiteral"
	=  '"'  content: ([^"\\] / '\\' .)*   '"'			{ return content.join("");}
	/ "'" content: ([^'\\] / '\\' .)* "'"			{ return content.join("");}
