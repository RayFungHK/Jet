/*!
 * Jet JavaScript Library v1.0.0-Beta
 * http://js-jet.com/
 *
 * Copyright 2014 Ray Fung
 * Jet are released under the terms of the MIT license.
 * The MIT License is simple and easy to understand and it places almost no restrictions on what you can do with a Jet.
 * You are free to use any Jet in any other project (even commercial projects) as long as the copyright header is left intact.
 *
 * Date: 2014-03-21T16:54Z
 */

(function() {
	var jet = function () {
		var index, selector, jObj, elem;

		jObj = new jObject();

		for (index = 0; index < arguments.length; index++) {
			if (!arguments[index]) continue;
			if (jet.IsString(arguments[index])) {
				selector = jet.Trim(arguments[index]);
				if (selector[0] === '<' && selector[selector.length - 1] === '>' && selector.length > 3) {
					// Create Element
					jObj.Merge(jet.Shift(arguments[index]));
				} else {
					// CSS Selector
					jObj.Merge(jEngine.Get(arguments[index]));
				}
			} else if (jet.IsFunction(arguments[index])) {
				jet.Ready(arguments[index]);
			} else if (jet.IsCollection(arguments[index])) {
				jObj.Merge(jet.apply(this, arguments[index]));
			} else {
				elem = jCore.GetRoot(arguments[index]);
				if (jet.IsElement(elem)) {
					jObj.Add(elem);
				}
			}
		}

		jObj.Finalize();
		return jObj;
	},

	// Regular Expression
	selectorRegex = /(([\.#])?([a-z0-9_\-]+|\*)([#\.][^\s#,\.]+)*(\[[^:]*\]|(:[a-z\-]+(\([^\)]+\))?))*(\s*[+>~]\s*|\s*,?\s*))+?/gi,
	tagNameRegex = /^[^#\.]+/ig,
	attrRegex = /(((:[a-z\-]+)(\([^\)]+\))?)|(\[[^\]]*\]))/gi,
	attributeSelectorRegex = /\[([a-z_]+)(([~!\|\^$\*]?)=((\"(.*)\")|(\'(.*)\')|([\w\s]*)))?\]/gi,
	attributeRegex = /\[([a-z_]+)(([~!\|\^$\*]?)=((\"(.*)\")|(\'(.*)\')|([\w\s]*)))?\]/i,
	pseudoSelectorRegex = /:[a-z\-]+(\(([^\)]+)\))?/gi,
	pseudoRegex = /:([a-z\-]+)(\(([^\)]+)\))?/i,
	subAttrRegex = /([#\.])([^#\.]+)/gi,
	nthRegex = /nth(-(last))?-(child|of-type)/i,
	nthValueRegex = /(-)?((([0-9]*)n)|([0-9]+))(([+\-])([0-9]+))?/i,
	hexRegex = /([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?/i,
	unitRegex = /(-?[0-9\.]+)\s*([a-z%]*)/i,
	colorRegex = /rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)/i,
	eventNameRegex = /(\w+)(\.([\w_\-]+))?/i,
	submitTypeRegex = /^(submit|button|image|reset|file)$/i,
	submitNameRegex = /^(input|select|textarea|keygen)$/i,
	checkableRegex = /^(checkbox|radio)$/i,

	// Object Alias
	win = window,
	doc = win.document,
	nav = navigator,
	iframe = null,
	defaultStyles = {},

	// Define Browser
	isChrome = /Chrome/.test(nav.userAgent),
	isSafari = /Apple.*Safari/.test(nav.vendor),
	isOpera = !!win.opera || nav.userAgent.indexOf(' OPR/') >= 0,
	isFirefox = /Firefox/.test(nav.userAgent),
	isIE = /MSIE/.test(nav.userAgent),
	attrMapping = {
		'accesskey': 'accessKey',
		'class': 'className',
		'colspan': 'colSpan',
		'for': 'htmlFor',
		'maxlength': 'maxLength',
		'readonly': 'readOnly',
		'rowspan': 'rowSpan',
		'tabindex': 'tabIndex',
		'valign': 'vAlign',
		'cellspacing': 'cellSpacing',
		'cellpadding': 'cellPadding'
	},

	// Jet Object
	jCore, // Internal Module
	jEngine, // Controller
	jObject, // Jet Object
	jColor, // Jet Color Object
	jAnimate, // Jet Animate Object
	jUnit, // Jet Unit Object
	jEvent, // Jet Event Handler
	jCSSHooks = {}, // Jet CSS hook
	jValueHooks = {}, // Jet Value hook
	jPropHooks = {}, // Jet Prop hook
	jUnitHooks = {}, // Jet Unit hook

	// Binding
	propBinding = {'for': 'htmlFor', 'class': 'className'},

	objMethod = Object.prototype,
	container = doc.createElement('div');

	// Internal Use
	jCore = {
		isReady: false,
		OnLoadEvent: [],
		ReadyOnLoad: function () {
			var index = 0, callback;
			while (callback = jCore.OnLoadEvent[index++]) {
				callback.call(this);
			}
			jCore.OnLoadEvent = [];
		},

		Extend: function (objA, objB, inherit) {
			var name = '';

			if (objA && jCore.IsObject(objB)) {
				for (name in objB) {
					if (!inherit || !jCore.IsDefined(objA[name])) {
						objA[name] = objB[name];
					}
				}
			}
			return this;
		},

		DefaultStyle: function (tagName, styles) {
			var style = defaultStyles[tagName], elem, tDoc = doc;

			if (!style) {
				iframe = (iframe || jet('<iframe frameborder="0" width="0" height="0" />')).AppendTo(tDoc.documentElement);

				tDoc = iframe[0].contentDocument;
				tDoc.write();
				tDoc.close();
			
				elem = jet(tDoc.createElement(tagName)).AppendTo(tDoc.body),
				style = defaultStyles[tagName] = {
					display: elem.CSS('display'),
					overflow: elem.CSS('overflow')
				};

				elem.Detach();
				iframe.Detach();
			}

			return style;
		},

		GetRoot: function (elem) {
			if (elem) {
				if (elem.contentDocument) {
					return elem.contentDocument.body;
				} else if (elem.contentWindow) {
					return elem.contentWindow.document.body;
				} else if (elem.body) {
					return elem.body;
				}
			}
			return elem;
		},

		Match: function (element, selectorSetting) {
			if (!element || !this.IsElement(element)) {
				return false;
			}

			if (selectorSetting.type == '#') {
				if (element.id != selectorSetting.tag) {
					return false;
				}
			} else if (selectorSetting.type == '.') {
				if ((element.className + ' ').indexOf(selectorSetting.tag + ' ') == -1) {
					return false;
				}
			} else {
				if (jCore.NodeName(element, selectorSetting.tag)) {
					return false;
				}
			}

			if (selectorSetting.classes.length > 0) {
				if (!jet.HasClass(element, selectorSetting.classes)) {
					return false;
				}
			}

			return true;
		},

		// - jet.Detect(obj)
		// Return the type of object 
		// @param {Object} obj The object for detection.
		// @return {String} Returns the object type.
		// -
		Detect: function (obj) {
			var text = objMethod.toString.call(obj).split(' ')[1];
			return (text.substring(0, text.length - 1));
		},

		// - jet.IsWalkable(obj)
		// Check to see if an object can be Iterated. 
		// @param {Object} obj The object that will be checked to see if it can be Iterated.
		// @return {Boolean}
		// -
		IsWalkable: function (obj) {
			return (jCore.IsCollection(obj) || jCore.IsPlainObject(obj));
		},

		// - jet.IsJetObject(obj)
		// Check to see if an object is a jet object. 
		// @param {Object} obj The object that will be checked to see if it's a jet object.
		// @return {Boolean}
		// -
		IsJetObject: function (obj) {
			return (jCore.IsDefined(obj) && obj.constructor === jObject);
		},

		// - jet.IsCollection(obj)
		// Check to see if an object is a collection or an array. 
		// @param {Object} obj The object that will be checked to see if it's a collection or an array.
		// @return {Boolean}
		// -
		IsCollection: function (obj) {
			return (jCore.IsDefined(obj) && (jCore.IsArray(obj) || jCore.IsJetObject(obj) || (jCore.IsNumeric(obj.length) && jCore.IsFunction(obj.item))));
		},

		// - jet.IsDefined(obj)
		// Check to see if an object is defined. 
		// @param {Object} obj The object that will be checked to see if it's defined.
		// @return {Boolean}
		// - 
		IsDefined: function (obj) {
			return (typeof obj !== 'undefined');
		},

		// - jet.IsElement(obj)
		// Check to see if an object is an element object. 
		// @param {Object} obj The object that will be checked to see if it's an element object.
		// @return {Boolean}
		// - 
		IsElement: function (obj) {
			return (jCore.IsDefined(obj) && (obj.nodeType === 1 || obj.nodeType === 11 || obj.nodeType === 9));
		},

		// - jet.IsArray(obj)
		// Check to see if an object is an array. 
		// @param {Object} obj The object that will be checked to see if it's an array.
		// @return {Boolean}
		// - 
		IsArray: function (obj) {
			return (this.Detect(obj) === 'Array');
		},

		// - jet.IsObject(obj)
		// Check to see if an object is an object. 
		// @param {Object} obj The object that will be checked to see if it's an object.
		// @return {Boolean}
		// - 
		IsObject: function (obj) {
			return (this.Detect(obj) === 'Object');
		},

		// - jet.IsFunction(obj)
		// Check to see if an object is a callback function. 
		// @param {Object} obj The object that will be checked to see if it's a callback function.
		// @return {Boolean}
		// - 
		IsFunction: function (obj) {
			return (this.Detect(obj) === 'Function');
		},

		// - jet.IsString(obj)
		// Check to see if an object is a string. 
		// @param {Object} obj The object that will be checked to see if it's a string.
		// @return {Boolean}
		// - 
		IsString: function (obj) {
			return (this.Detect(obj) === 'String');
		},

		// - jet.IsNumeric(obj)
		// Check to see if an object is a number. 
		// @param {Object} obj The object that will be checked to see if it's a number.
		// @return {Boolean}
		// - 
		IsNumeric: function (obj) {
			return (this.Detect(obj) === 'Number');
		},

		// - jet.IsPlainObject(obj)
		// Check to see if an object is a plain object (created using "{}" or "new Object").
		// @param {Object} obj The object that will be checked to see if it's a plain object.
		// @return {Boolean}
		// - 
		IsPlainObject: function (obj) {
			if (!this.IsDefined(obj)) {
				return false;
			}
			if (!this.IsObject(obj) || (obj.constructor && !objMethod.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf'))) {
				return false;
			}
			return true;
		},

		// - jet.IsDocument(obj)
		// Check to see if an object is a document node.
		// @param {Object} obj The object that will be checked to see if it's a document node.
		// @return {Boolean}
		// - 
		IsDocument: function (obj) {
			return (this.IsDefined(obj) && obj.nodeType === 9);
		},

		// - jet.IsEmpty(obj)
		// Check to see if an object or array is empty.
		// @param {Object} obj The object that will be checked to see if it's empty.
		// @return {Boolean}
		// - 
		IsEmpty: function (obj) {
		    if (obj == null) return true;

		    if (obj.length > 0) return false;
		    if (obj.length === 0) return true;

		    for (var key in obj) {
		        if (objMethod.hasOwnProperty.call(obj, key)) return false;
		    }
		
		    return true;
		},

		// - jet.Each(obj, callback)
		// Seamlessly iterate each item of an array, array-like or object.
		// @param {Object} obj The object that will be checked to see if it's included in a specified array.
		// @param {Function} callback The callback function that to be executed for each item.
		// @return {jet}
		// - 
		Each: function (obj, callback) {
			var index, length;

			if (!this.IsFunction(callback)) {
				return this;
			}

			if (this.IsCollection(obj)) {
				index = 0;
				for (index = 0, length = obj.length; index < length; index++) {
					callback.call(obj[index], index, obj[index]);
				}
			} else if (this.IsObject(obj)) {
				for (index in obj) {
					callback.call(obj[index], index, obj[index]);
				}
			} else {
				callback.call(obj, 0, obj);
			}

			return this;
		},

		SelectorSpecialChar: function (selector) {
			selector = selector.replace(/#(\d)/, '#\\3$1 ');
			selector = selector.replace(/(\[\w+\s*=\s*)(\d)/i, '$1\\3$2 ');
			return selector.replace(/#(\d)/, '#\\3$1 ');
		},

		NodeName: function (obj, compare) {
			if (jCore.IsDefined(compare)) {
				return obj.nodeName && obj.nodeName.toLowerCase() === compare.toLowerCase();
			}
			return (obj.nodeName) ? obj.nodeName.toLowerCase() : '';
		},

		// - jet.InArray(obj)
		// Check to see if an object is included in a specified array.
		// @param {Object} obj The object that will be checked to see if it's included in a specified array.
		// @return {Boolean}
		// - 
		InArray: function (ary, value) {
			var index = 0, val;
			if (jet.IsCollection(ary)) {
				while (val = ary[index++]) {
					if (value === val) {
						return true;
					}
				}
			}
			return false;
		},

		DOMReady: function () {
			var top, isReady = false;

			// DOM Ready on post load
			if (doc.readyState === 'complete') {
				setTimeout(jCore.ReadyOnLoad);
			} else {
				// Setup DOM Ready Event
	        	if (win.addEventListener) {
					doc.addEventListener('DOMContentLoaded', function () {
						jCore.ReadyOnLoad();
					}, false);
				} else {
					top = null;
					
					try {
						top = win.frameElement === null && doc.documentElement;
					} catch(e) {
						
					}
	
					if (top && top.doScroll) {
						(function poll() {
							if (jCore.OnLoadEvent.length) {
								try {
									top.doScroll('left');
								} catch(e) {
									return setTimeout(poll, 50);
								}
	
								jCore.ReadyOnLoad();
							}
						})();
					}
	
					doc.onreadystatechange = function () {
						if (doc.readyState === 'complete') {
							doc.onreadystatechange = null;
							jCore.ReadyOnLoad();
						}
					};
				}
	
				win.onload = function () {
					if (jCore.OnLoadEvent.length) {
						jCore.ReadyOnLoad();
						win.onload = null;
					}
				};
			}
		}
	};

	// Jet Event Handler
	jEvent = function () {
		this.events = {};
	};

	jCore.Extend(jEvent.prototype, {
		events: {},
		element: null,

		Add: function (event, callback) {
			if (!event) {
				event = '_jEventBase';
			}

			this.events[event] = callback;
			return this;
		},

		Remove: function (event) {
			if (!event) {
				event = '_jEventBase';
			}

			delete this.events[event];
			return this;
		},

		Clear: function () {
			var index;
			for (index in this.events) {
				delete this.events[index];
			}

			return this;
		},

		GetHandler: function () {
			var events = this.events, element = this.element;
			return function (e) {
				var index;
				for (index in events) {
					events[index].call(element, e);
				}
			};
		}
	});

	// Clone Function
	jCore.Each(['Detect', 'IsDefined', 'IsElement', 'IsArray', 'IsObject', 'IsFunction', 'IsString', 'IsEmpty', 'IsNumeric', 'IsPlainObject', 'InArray', 'IsCollection', 'IsWalkable', 'IsDocument', 'Each'], function () {
		jet[this] = jCore[this];
	});

	function Adapter(name, isFullSet) {
		return function (value, args) {
			var elem = (isFullSet) ? this : this[0];
			return jet[name].call(this, elem, value, args);
		};
	}

	// Extend jet class, static function
	jCore.Extend(jet, {
		// - jet.NoConflict()
		// Release the jet control of the jet variable.
		// @return {jet}
		// - 
		NoConflict: function () {
			var _jet = win.jet;
			win.jet = null;
			return _jet;
		},

		// - jet.Extend(obj)
		// Merge the contents of the object into jet control prototype.
		// @param {Object} obj The object that will be merged into jet control.
		// @return {jet}
		// - 
		Extend: function (obj) {
			jCore.Extend(jet, obj, true);
			return this;
		},

		// - jet.ExtendObject(objA, objB, inherit)
		// Merge the contents of the object specified into the first object.
		// @param {Object} objA The object that would be extended.
		// @param {Object} objB The object that will be merged.
		// @param {Boolean} inherit Set to true for not allow overwrite any original content.
		// @return {jet}
		// - 
		ExtendObject: function (objA, objB, inherit) {
			jCore.Extend(objA, objB, inherit);
			return this;
		},

		// - jet.Install(obj, isFullSet)
		// Install a mirroring plugin to jet.
		// @param {PlainObject} obj The object that is a set of plugin to install.
		// @param {Boolean} isFullSet Set to true that would apply all matched element to plugin, else apply first element of the set of matched element.
		// @return {jet}
		// - 
		Install: function (obj, isFullSet) {
			var name, func, alias;

			for (name in obj) {
				if (jet.IsPlainObject(obj[name]) && jet.IsString(obj[name].alias)) {
					func = obj[name].callback;
					alias = obj[name].alias;
				} else {
					func = obj[name];
					alias = name;
				}
				
				if (jet.IsFunction(func)) {
					if (!jet.IsDefined(jet[name])) {
						jet[name] = func;
					}

					if (!jet.IsDefined(jObject.prototype[alias])) {
						jObject.prototype[alias] = Adapter(name, isFullSet);
					}
				}
			}
			return this;
		},

		// - jet.Ready(callback)
		// Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).
		// @param {Function} callback The object that is a set of plugin to install.
		// @return {jet}
		// - 
		Ready: function (callback) {
			var index, func;
			if (jet.IsArray(callback)) {
				index = 0;
				while (func = callback[index++]) {
					this.Ready(func);
				}
			} else {
				if (jet.IsFunction(callback)) {
					jCore.OnLoadEvent.push(callback);
				}
			}
			return this;
		},

		// - jet.Trim(text)
		// Strip whitespace from the beginning and end of a string
		// @param {String} text The string that for whitespace stripping.
		// @return {String}
		// - 
		Trim: function (text) {
			return text.replace(/^\s+|\s+$/g, '');
		},

		// - jet.ChildAt(obj, type)
		// Check to see the element is the first or the last node in current node set. Equivalent as jet.Is(obj, ':first-child') or jet.Is(obj, ':last-child').
		// @param {Object} obj The object that will be checked to see if it's the first or the last node in current node set.
		// @param {String} type The string of type in 'first' or 'last'.
		// @return {Boolean}
		// - 
		ChildAt: function (obj, type) {
			var direction = (type === 'first') ? 'next' : 'previous',
				child;
				
			if (!obj || !jet.IsElement(obj)) return null;

			if (obj[type + 'ElementChild']) {
				return obj[type + 'ElementChild'];
			} else {
				child = obj[type + 'Child'];
				if (jet.IsElement(child)) return child;
				return jet.Sibling(child, direction);
			}
		},

		// - jet.Shift(html)
		// Convert the string into jet object.
		// @param {String} html The string that will be converted to a set of elements.
		// @return {jObject}
		// - 
		Shift: function (html) {
			var jObj, elements;

			container.innerHTML = html;
			elements = container.getElementsByTagName('*');
			jObj = jet(elements);
			container.innerHTML = '';

			return jObj;
		},

		// - jet.ComparePosition(a, b)
		// Convert the string into jet object.
		// @param {DOMElement} a The dom element that for compare.
		// @param {DOMElement} b The dom element that will be compared with first dom element provided.
		// @return {Number}
		// - 
		ComparePosition: function (a, b) {
			return a.compareDocumentPosition ?
						a.compareDocumentPosition(b) :
							a.contains ?
							(a != b && a.contains(b) && 16) +
							(a != b && b.contains(a) && 8) +
							(a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
								(a.sourceIndex < b.sourceIndex && 4 ) + (a.sourceIndex > b.sourceIndex && 2) :
									1) :
										0;
		},

		// - jet.Capitalise(text)
		// Capital the first letter of a string.
		// @param {String} text The string for capital the first letter.
		// @return {String}
		// - 
		Capitalise: function (text) {
			if (!jet.IsString(text)) {
				return '';
			}
		    return text.charAt(0).toUpperCase() + text.slice(1);
		},

		// - jet.CamelCase(text)
		// Convert from Underscore text or Hyphen text to Camel Case one.
		// @param {String} text The string that will be converted from Underscore text or Hyphen text to Camel Case one.
		// @return {String}
		// - 
		CamelCase: function (text) {
			return text.replace(/[\-_]([\da-z])/gi, function (str, match) {
				return match.toUpperCase();
			});
		},

		// - jet.Ajax(obj)
		// Perform an Asynchronous JavaScript and XML (Ajax) request and apply the JSON or XML object into specified callback function.
		// @param {PlainObject} obj A set of setting for perform an Ajax request.
		// @item obj:{String} url The target url for Ajax request.
		// @item obj:{Number} timeout Setup a timeout option for request. Value in millisecond.
		// @item obj:{String} method The request method in POST or GET.
		// @item obj:{Function} success The callback function that will be executed when the request is completed.
		// @item obj:{Function} error The callback function that will be executed if the request returns error or timeout.
		// @item obj:{PlainObject} headers The plain object with headers that will be set for request.
		// @item obj:{PlainObject} data The plain object with POST data that will be sent.
		// @item obj:{String} dataType The string of data type in 'json' or 'xml'
		// @return {jet}
		// - 
		Ajax: function (obj) {
			var objExt = {}, data = {}, parser;

			jCore.Extend(objExt, obj);

			if (jet.IsFunction(obj.success)) {
				objExt.success = function () {
					if (obj.dataType === 'xml') {
						if (win.DOMParser) {
							parser = new DOMParser();
							data = parser.parseFromString(this, 'text/xml');
						} else {
							data = new ActiveXObject('Microsoft.XMLDOM');
							data.async = false;
							data.loadXML(this); 
						}
					} else {
						data = eval('(' + this + ')');
					}
					obj.success.call(data);
				};
			}

			jet.Request(objExt, objExt);

			return this;
		},

		// - jet.Request(obj)
		// Perform a web request with get / post method.
		// @param {PlainObject} obj A set of setting for perform an Ajax request.
		// @item obj:{String} url The target url for Ajax request.
		// @item obj:{Number} timeout Setup a timeout option for request. Value in millisecond.
		// @item obj:{String} method The request method in POST or GET.
		// @item obj:{Function} success The callback function that will be executed when the request is completed.
		// @item obj:{Function} error The callback function that will be executed if the request returns error or timeout.
		// @item obj:{PlainObject} headers The plain object with headers that will be set for request.
		// @item obj:{PlainObject} data The plain object with POST data that will be sent.
		// @return {jet}
		// - 
		Request: function (obj) {
			var xmlHttp = null, dataString = '', index;

			if (jet.IsPlainObject(obj) && obj.url.length > 0) {
				xmlHttp = new XMLHttpRequest();

				if (parseInt(obj.timeout) > 0) {
					xmlHttp.timeoutTimer = setTimeout(function() {
						xmlHttp.abort('timeout');
					}, parseInt(obj.timeout));
				}

				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState != 4) return;

				    if (xmlHttp.status == 200) {
				    	clearTimeout(xmlHttp.timeoutTimer);
						if (jet.IsFunction(obj.success)) {
							obj.success.call(xmlHttp.responseText);
						}
				    } else {
						if (jet.IsFunction(obj.error)) {
							obj.error.apply(xmlHttp.statusText, [xmlHttp.status, xmlHttp.statusText]);
						}
				    }
				};

				if (obj.method == 'post') {
					xmlHttp.open('POST', obj.url, true);

					if (jet.IsPlainObject(obj.headers)) {
						for (index in obj.headers) {
							xmlHttp.setRequestHeader(index, obj.headers[index]);
						}
					}

					if (jet.IsDefined(obj.data)) {
						xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
						if (jet.IsPlainObject(obj.data)) {
							for (index in obj.data) {
								dataString += (dataString.length) ? '&' + index + '=' + obj.data[index] : index + '=' + obj.data[index];
							}
							xmlHttp.send(dataString);
						} else {
							xmlHttp.send(obj.data);
						}
					}
				} else {
					xmlHttp.open('GET', obj.url, true);
					xmlHttp.send();
				}
			}
		},

		// - jet.RegisterCSSHook(name, callback)
		// Register a Hook for jet.CSS()
		// @param {String} name The name of style property that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		RegisterCSSHook: function (name, callback) {
			if (jet.IsString(name) && jet.Trim(name) && jet.IsFunction(callback)) {
				jCSSHooks[name] = callback;
			}
			return this;
		},

		// - jet.RegisterValueHook(name, callback)
		// Register a Hook for jet.Value()
		// @param {String} name The name of object type or name that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		RegisterValueHook: function (name, callback) {
			if (jet.IsString(name) && jet.Trim(name) && jet.IsFunction(callback)) {
				jValueHooks[name] = callback;
			}
			return this;
		},

		// - jet.RegisterPropHook(name, callback)
		// Register a Hook for jet.Prop()
		// @param {String} name The name of property that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		RegisterPropHook: function (name, callback) {
			if (jet.IsString(name) && jet.Trim(name) && jet.IsFunction(callback)) {
				jPropHooks[name] = callback;
			}
			return this;
		},

		// - jet.RegisterUnitHook(name, obj)
		// Register a Hook for jUnit calculation
		// @param {String} name The name of property that will be executed by user-defined callback function.
		// @param {PlainObject} obj A set of callback function.
		// @item obj:{Function} CalculateDiff(value) The callback function that for calculate the different between original and specified value.
		// @param {String} obj.CalculateDiff.value A specified value that to calculate the difference with original value.
		// @item obj:{Function} Take(percentage) Returns the original value plus the difference in percentage provided.
		// @param {Number} obj.Take.percentage A number of percentage, between 0 to 1 (0% to 100%).
		// @item obj:{Function} SetBase(value) The callback function that for setup and calculate the original value.
		// @param {String} obj.SetBase.value A string of the original value.
		// @return {jet}
		// - 
		RegisterUnitHook: function (name, obj) {
			if (jet.IsString(name) && jet.Trim(name) && jet.IsPlainObject(obj)) {
				jUnitHooks[name] = obj;
			}
			return this;
		},

		// - jet.Walk(obj, callback)
		// Execute the user-defined callback function to each item of the array, array-like object, plain object or object.
		// @param {Object} obj The array, array-like object, plain object or object that will be iterated.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		Walk: function (obj, callback) {
			var result = [];

			if ((jet.IsArray(obj) || jet.IsPlainObject(obj)) && jet.IsFunction(callback)) {
				jet.Each(obj, function (i, object) {
					var value = callback.call(object, i, object);
					if (jet.IsArray(value)) {
						result = result.concat(value);
					} else {
						result.push(value);
					}
				});
			}

			return result;
		},

		// - jet.BuildQueryString(obj)
		// Generates a URL-encoded query string from the array or plain object provided.
		// @param {Object} obj The array or plain object that will be converted to a URL-encoded query. If the object is an array, each item should included 'name' and 'value' properties.
		// @return {String}
		// - 
		BuildQueryString: function (obj) {
			var queryString = [], value;

			if (jet.IsArray(obj)) {
				jet.Each(obj, function () {
					if (jet.IsDefined(this.name) && jet.IsDefined(this.value)) {
						value = (jet.IsFunction(this.value)) ? this.value() : this.value;
						queryString.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(value));
					}
				});
			} else if (jet.IsPlainObject) {
				jet.Each(obj, function (i, val) {
					value = (jet.IsFunction(val)) ? val() : val;
					queryString.push(encodeURIComponent(i) + '=' + encodeURIComponent(value));
				});
			}
			return queryString.join('&');
		}
	});

	jObject = function () {
		
	};

	jObject.prototype = new Array;

	// Extend jObject class, Non-static function
	jCore.Extend(jObject.prototype, {
		constructor: jObject,
		animate: null,

		// - .Merge(obj)
		// Merge a set of elements into current set of matched elements that not be added or duplicate.
		// @param {Object} obj The array or array-like object that will be merged.
		// @return {jObject}
		// - 
		Merge: function (obj) {
			var index = 0, elem;

			if (jet.IsCollection(obj)) {
				while (elem = this[index++]) {
					elem.added = true;
				}
	
				index = 0;
				while (elem = obj[index++]) {
					if (jet.IsElement(elem)) {
						if (!jet.IsDefined(elem.added) || !elem.added) {
							elem.added = true;
							this.push(elem);
						}
					}
				}
			}

			return this;
		},

		// - .Add(element)
		// Add an element into current set of matched elements that not be added or duplicate.
		// @param {DOMElement} element The element that will be added.
		// @return {jObject}
		// - 
		Add: function (element) {
			if (jet.IsElement(element)) {
				if (!jet.IsDefined(element.added) || !element.added) {
					element.added = true;
					this.push(element);
				}
			}
			return this;
		},

		// - .Finalize()
		// Reset each of the set of matched elements 'added' frag.
		// @return {jObject}
		// - 
		Finalize: function () {
			var index = 0, elem;
			while ((elem = this[index++])) {
				elem.added = false;
			}
		},

		// - .Each(callback)
		// Iterate over a jet object, executing a function for each matched element.
		// @param {Function} callback The callback function that to be executed.
		// @return {jObject}
		// - 
		Each: function (callback) {
			jet.Each(this, callback);
			return this;
		},

		// - .Find(selector)
		// Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {DOMElement} selector The element that for filtering.
		// @return {jObject}
		// - 
		Find: function (selector) {
			var jObj;

			if (jet.IsElement(selector)) {
				selector = [selector];
			}

			if (jet.IsCollection(selector)) {
				jObj = jet();

				jet.Each(this, function (i, a) {
					jet.Each(selector, function (i, b) {
						if (jet.ComparePosition(a, b) === 20) {
							jObj.Add(b);
						}
					})
				});
				jObj.Finalize();
				return jObj;
			}
			return jEngine.Get(selector, this);
		},

		// Action
		// - .Hide(duration, callback)
		// Hide the matched elements.
		// @param {Number} duration The number of duration in millisecond.
		// @param {Function} callback The callback function that will be executed when the element has been hidden.
		// @return {jObject}
		// - 
		Hide: function (duration, callback) {
			jet.Each(this, function (i, elem) {
				var animateObj = {};
				if (jet.CSS(elem, 'display') !== 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						elem._cssStorage = {};
	
						elem._cssStorage.display = jet.CSS(elem, 'display');
						elem._cssStorage.overflow = jet.CSS(elem, 'overflow');
						jet.Each(['width', 'height', 'padding', 'margin', 'opacity'], function () {
							var val = jet.CSS(elem, this);
							if (parseFloat(val) > 0) {
								elem._cssStorage[this] = val;
								animateObj[this] = '0';
							}
						});

						jet.CSS(elem, 'display', 'block');
						jet.CSS(elem, 'overflow', 'hidden');
						if (animateObj) {
							jet(elem).Animate(animateObj, duration, 'Swing', {
								complete: function () {
									jet.CSS(elem, 'display', 'none');
									if (jet.IsFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jet.CSS(elem, 'display', 'none');
		
						if (jet.IsFunction(callback)) {
							callback.call(elem);
						}
					}
				}
			});

			return this;
		},

		// - .Show(duration, callback)
		// Show the matched elements.
		// @param {Number} duration The number of duration in millisecond.
		// @param {Function} callback The callback function that will be executed when the element has been shown.
		// @return {jObject}
		// - 
		Show: function (duration, callback) {
			jet.Each(this, function (i, elem) {
				var animateObj = {}, style;

				if (jet.CSS(elem, 'display') === 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						if (jet.IsDefined(elem._cssStorage)) {
							jet.Each(['width', 'height', 'padding', 'margin', 'opacity', 'display'], function () {
								var val = jet.CSS(elem, this);
								if (jet.IsDefined(elem._cssStorage[this])) {
									animateObj[this] = elem._cssStorage[this];
								}
							});
		
							jet.CSS(elem, 'display', elem._cssStorage.display);
							jet.CSS(elem, 'overflow', elem._cssStorage.overflow);
							elem._cssStorage = null;
						} else {
							style = jCore.DefaultStyle(jCore.NodeName(elem));
							jet.CSS(elem, 'display', style.display);
							jet.CSS(elem, 'overflow', style.overflow);
							jet.CSS(elem, 'opacity', '0');
							animateObj = {
								opacity: 1
							};
						}
		
						if (animateObj) {
							jet(elem).Animate(animateObj, duration, 'Swing', {
								complete: function () {
									if (jet.CSS(elem, 'opacity') === '1') {
										jet.CSS(elem, 'opacity', null);
									}

									if (jet.IsFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jet.CSS(obj, 'display', 'block');
		
						if (jet.IsFunction(callback)) {
							callback.call(this);
						}
					}
				}
			});

			return this;
		},

		// - .Prev()
		// Retuens the previous sibling element from the first element of the set of matched elements.
		// @return {jObject}
		// - 
		Prev: function () {
			var obj = this[0];
			return jet(jet.Sibling(obj, 'previous'));
		},

		// - .Next()
		// Retuens the previous sibling element from the first element of the set of matched elements.
		// @return {jObject}
		// - 
		Next: function () {
			var obj = this[0];
			return jet(jet.Sibling(obj, 'next'));
		},

		// - .Get(start[, length])
		// Returns the specified element or a number of elements with jet object.
		// @param {Number} start The returned element will start at the specified index in the set of matched elements.
		// @param {Number} length Returnes a number of elements from the specified index.
		// @return {jObject}
		// - 
		Get: function (start, length) {
			start = parseInt(start);
			length = parseInt(length);
			length = (this.length <= start + length) ? this.length : start + length;

			if (start == 'NaN' || !this[start]) {
				return jObj;
			}

			if (length - start > 1) {
				return jet(this.slice(start, length));
			} else {
				return jet(this[start]);
			}
		},

		// - .Filter(callback)
		// Reduce the set of matched elements to those that match the selector or pass the function’s test.
		// @param {Function} callback The callback function that used of filter, return true to keep the element.
		// @return {jObject}
		// - 
		Filter: function (callback) {
			var filtered = [];

			jet.Each(this, function () {
				if (callback.call(this)) {
					filtered.push(this);
				}
			});

			return jet(filtered);
		},

		// - .Walk(callback)
		// Execute the user-defined callback function to each element of the set of matched elements.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jObject}
		// - 
		Walk: function (callback) {
			return jet.Walk(this, callback);
		},

		// Event
		// - .OnEvent(event[, callback])
		// Apply or trigger event to each of the set of matched elements.
		// @param {String} event The string of event name.
		// @param {Function} callback The callback function thet will be applied to specified event.
		// @return {jObject}
		// - 
		OnEvent: function (event, callback) {
			if (jet.IsDefined(callback)) {
				if (jet.IsFunction(callback)) {
					jet.Bind(this, event, function () {
						callback.call(this);
					});
				}
			} else {
				jet.Trigger(this, event);
			}

			return this;
		},

		// - .Click(callback)
		// Apply or trigger OnClick event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Click: function (callback) {
			return this.OnEvent('click', callback);
		},

		// - .DblClick(callback)
		// Apply or trigger OnDblClick event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		DblClick: function (callback) {
			return this.OnEvent('dblclick', callback);
		},

		// - .Focus(callback)
		// Apply or trigger OnFocus event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Focus: function (callback) {
			return this.OnEvent('focus', callback);
		},

		// - .Blur(callback)
		// Apply or trigger OnBlur event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Blur: function (callback) {
			return this.OnEvent('blur', callback);
		},

		// - .Change(callback)
		// Apply or trigger OnChange event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Change: function (callback) {
			return this.OnEvent('change', callback);
		},

		// - .Select(callback)
		// Apply or trigger OnSelect event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Select: function (callback) {
			return this.OnEvent('select', callback);
		},

		// - .MouseOver(callback)
		// Apply or trigger OnMouseOver event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		MouseOver: function (callback) {
			return this.OnEvent('mouseover', callback);
		},

		// - .MouseOut(callback)
		// Apply or trigger OnMouseOut event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		MouseOut: function (callback) {
			return this.OnEvent('mouseout', callback);
		},

		// - .Ready(callback)
		// Apply or trigger OnLoad event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Ready: function (callback) {
			return this.OnEvent('load', callback);
		},

		// - .Unload(callback)
		// Apply or trigger Unload event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Unload: function (callback) {
			return this.OnEvent('unload', callback);
		},

		// - .Submit(callback)
		// Apply or trigger OnSubmit event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		Submit: function (callback) {
			return this.OnEvent('submit', callback);
		},

		// Animate
		// - .Animate(callback[, duration, easing, callback])
		// Perform a custom animation of a set of CSS properties.
		// @param {PlainObject} cssObj The plain object with CSS property and value.
		// @param {Number} duration The number of duration, in millisecond.
		// @param {String} easing The string of easing type, it can be 'Linear', 'Swing', 'EasingIn' or 'EasingOut'.
		// @param {PlainObject} callback The plain object of callback function.
		// @param {Function} obj.step The callback function that will be executed in each tick.
		// @param {Function} obj.complete The callback function that will be executed when the animate is completed.
		// @return {jObject}
		// - 
		Animate: function (cssObj, duration, easing, callback) {
			var element = this[0];
			duration = parseInt(duration) || 400;
			if (!jet.IsPlainObject(cssObj) || !jet.IsElement(element)) {
				return this;
			}

			if (duration < jAnimate.GetPitch()) {
				duration = jAnimate.GetPitch();
			}

			if (!element.jAnimate) {
				element.jAnimate = new jAnimate();
				element.jAnimate.Init(element);
			}

			element.jAnimate.Apply(cssObj, duration, easing, callback);
			element.jAnimate.Play();

			return this;
		},

		// Animate
		// - .Submit(callback)
		// Wait a specified period of time for next animation
		// @param {Number} duration The number of duration, in millisecond.
		// @param {Function} callback The callback function that will be executed when the wait timer is expired.
		// @return {jObject}
		// - 
		Wait: function (duration, callback) {
			var element = this[0];
			duration = parseInt(duration);
			if (duration <= 0 || !jet.IsElement(element)) {
				return this;
			}

			if (!element.jAnimate) {
				element.jAnimate = new jAnimate();
				element.jAnimate.Init(element);
			}

			element.jAnimate.Wait(duration, callback);
			element.jAnimate.Play();

			return this;
		}
	});

	// Install Mirroring Plugin (Full Set Element)
	// Append and Preppend function
	function AppendPrepend(obj, element, type) {
		var contents, length = (obj.length) ? obj.length - 1 : 0;

		if (element && jet.IsCollection(element) && element.length > 0) {
			contents = element;
		} else if (jet.IsString(element)) {
			contents = [doc.createTextNode(element)];
		} else if (jet.IsElement(element)) {
			contents = [element];
		}

		if (contents) {
			jet.Each(obj, function (i, target) {
				if (jet.IsElement(target)) {
					target = jCore.GetRoot(target);

					jet.Each(contents, function (j, elem) {
						var last = (length === i) ? true : false;
						if (type === 'Append') {
							target.appendChild((last) ? elem : elem.cloneNode(true));
						} else {
							target.insertBefore((last) ? elem : elem.cloneNode(true), target.childNodes[0]);
						}
					});
				}
			});
		}

		return this;
	}

	jet.Install({
		// - .Append(element) mirroring jet.Append(@obj, element)
		// Insert content to the end of each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jObject}
		// - 
		Append: function (obj, element) {
			AppendPrepend(obj, element, 'Append');

			return this;
		},

		// - .Prepend(element) mirroring jet.Prepend(@obj, element)
		// Insert content to the beginning of each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jObject}
		// - 
		Prepend: function (obj, element) {
			AppendPrepend(obj, element, 'Prepend');

			return this;
		},

		// - .AppendTo(element) mirroring jet.AppendTo(@obj, element)
		// Insert every element in the set of matched elements to the end of the target.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jObject}
		// - 
		AppendTo: function (obj, element) {
			jet.Append(element, obj);

			return this;
		},

		// - .PrependTo(element) mirroring jet.PrependTo(@obj, element)
		// Insert every element in the set of matched elements to the beginning of the target.
		// @param {Object} obj The set of elements, it can be array, array-like object or a specified DOM element.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jObject}
		// - 
		PrependTo: function (obj, element) {
			jet.Prepend(element, obj);

			return this;
		},

		// - .Prop(prop[, value]) mirroring jet.Prop(@obj, prop[, value])
		// Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the property to set.
		// @param {String} prop The name of the property to get.
		// @param {Array} prop A set of property name to get.
		// @param {Object} prop An object of property-value pairs to set.
		// @param {String|Number|Boolean} value The value of the property to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		Prop: function (obj, prop, value) {
			var returns = {}, elem;

			if (jet.IsPlainObject(prop)) {
				jet.Each(prop, function (pp, val) {
					jet.Prop(obj, pp, val);
				});
			} else if (jet.IsArray(prop)) {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					jet.Each(prop, function (i, pp) {
						returns[pp] = jet.Prop(elem, propBinding[pp] || pp);
					});
				}
				return returns;
			} else {
				if (jet.IsDefined(value)) {
					jet.Each(obj, function () {
						var setValue;

						if (jet.IsFunction(value)) {
							setValue = value.call(this, this[propBinding[prop] || prop]);
						} else {
							setValue = value;
						}
	
						if (setValue !== null && jet.IsDefined(this[propBinding[prop] || prop])) {
							this[propBinding[prop] || prop] = setValue;
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.IsElement(elem)) {
						return elem[propBinding[prop] || prop];
					}
					return null;
				}
			}
			return this;
		},

		// - .RemoveProp(prop) mirroring jet.RemoveProp(@obj, prop)
		// Remove the property for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the property that will be removed.
		// @return {jObject}
		// - 
		RemoveProp: function (obj, prop) {
			jet.Each(obj, function () {
				if (jet.IsElement(this)) {
					this[propBinding[prop] || prop] = undefined;
					this.removeAttribute(prop);
				}
			});
			return this;
		},

		// - .CSS(prop[, value]) mirroring jet.CSS(@obj, prop[, value])
		// Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the style to set.
		// @param {String} prop The name of the style to get.
		// @param {Array} prop A set of style to get.
		// @param {Object} prop An object of style-value pairs to set.
		// @param {String|Number|Boolean} value The value of the style to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		CSS: function (obj, prop, value) {
			var elem, ccProp, returns = {};

			if (jet.IsPlainObject(prop)) {
				jet.Each(prop, function (style, val) {
					jet.CSS(obj, style, val);
				});
			} else if (jet.IsArray(prop)) {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					jet.Each(prop, function (i, style) {
						returns[style] = jet.CSS(elem, style);
					});
				}
				return returns;
			} else {
				ccProp = jet.CamelCase(prop);
				if (jCSSHooks[ccProp]) {
					return jCSSHooks[ccProp](obj, ccProp, value);
				}

				if (jet.IsDefined(value)) {
					obj = (jet.IsElement(obj)) ? [obj] : obj;
					jet.Each(obj, function () {
						var setValue = '';
						if (jet.IsElement(this) && jet.IsDefined(this.style[ccProp])) {
							if (jet.IsFunction(value)) {
								setValue = value.call(this, this.style[ccProp]);
							} else {
								setValue = value;
							}
							this.style[ccProp] = setValue;
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.IsElement(elem)) {
						if (doc.defaultView && doc.defaultView.getComputedStyle) {
							return doc.defaultView.getComputedStyle(elem, '').getPropertyValue(prop);
						}
						if (elem.currentStyle) {
							return elem.currentStyle[ccProp];
						}
						return elem.style[ccProp];
					}
					return null;
				}
			}
			return this;
		},

		// - .ToggleClass(prop) mirroring jet.ToggleClass(@obj, prop)
		// Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be toggled for each element in the matched set.
		// @return {jObject}
		// - 
		ToggleClass: function (obj, prop) {
			var classList = [];

			jet.Each(obj, function (i, elem) {
				if (jet.IsElement(elem)) {
					if (jet.IsString(prop)) {
						classList = jet.Trim(prop).split(' ');
					}
	
					jet.Each(classList, function () {
						if (!jet.HasClass(elem, this)) {
							jet.AddClass(elem, this);
						} else {
							jet.RemoveClass(elem, this);
						}
					});

					if (!elem.className) {
						elem.removeAttribute('class');
					}
				}
			});
			return this;
		},

		// - .AddClass(prop) mirroring jet.AddClass(@obj, prop)
		// Add one or more classes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be added for each element in the matched set.
		// @return {jObject}
		// - 
		AddClass: function (obj, prop) {
			var classList = [];

			jet.Each(obj, function (i, elem) {
				var elemClass = [];
				if (jet.IsElement(elem)) {
					if (jet.IsString(prop)) {
						classList = jet.Trim(prop).split(' ');
					} else if (jet.IsArray(prop)) {
						classList = prop;
					}

					jet.Each(classList, function () {
						if (!jet.HasClass(elem, this)) {
							elem.className += (elem.className) ? ' ' + this : this;
						}
					});
				}
			});
			return this;
		},

		// - .RemoveClass(prop) mirroring jet.RemoveClass(@obj, prop)
		// Remove one or more classes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be removed for each element in the matched set.
		// @return {jObject}
		// - 
		RemoveClass: function (obj, prop) {
			var classList = [];

			jet.Each(obj, function (i, elem) {
				if (jet.IsElement(elem)) {
					if (jet.IsString(prop)) {
						classList = jet.Trim(prop).split(' ');
					} else if (jet.IsArray(prop)) {
						classList = prop;
					}
	
					if (classList.length > 0) {
						className = ' ' + jet.Trim(elem.className) + ' ';
						jet.Each(classList, function () {
							className = className.replace(new RegExp(' ' + this + ' '), ' ');
						});
						elem.className = jet.Trim(className);
						if (!elem.className) {
							elem.removeAttribute('class');
						}
					}
				}
			});
			return this;
		},

		// - .Attr(attr[, value]) mirroring jet.Attr(@obj, attr[, value])
		// Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} attr The name of the attribute to set.
		// @param {String} attr The name of the attribute to get.
		// @param {Array} attr A set of attribute to get.
		// @param {Object} attr An object of attribute-value pairs to set.
		// @param {String|Number|Boolean} value The value of the attribute to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		Attr: function (obj, attr, value) {
			var elem, returns = {};

			if (jet.IsPlainObject(attr)) {
				jet.Each(attr, function (attribute, val) {
					jet.Attr(obj, attribute, val);
				});
			} else if (jet.IsArray(attr)) {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					jet.Each(attr, function (i, attribute) {
						returns[attribute] = jet.Attr(elem, attribute);
					});
				}
				return returns;
			} else {
				if (jet.IsDefined(value)) {
					jet.Each(obj, function () {
						var setValue = '';
						if (jet.IsElement(this)) {
							if (jet.IsFunction(value)) {
								setValue = value.call(this, jet.Attr(this, attr));
							} else {
								setValue = value;
							}

							if (isIE) {
								this[attrMapping[attr.toLowerCase()] || attr] = setValue;
							} else {
								this.setAttribute(attr, setValue);
							}
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.IsElement(elem)) {
						return (isIE) ? elem[attrMapping[attr.toLowerCase()] || attr] : elem.getAttribute(attr, 2);
					}
				}
			}
			return this;
		},

		// - .RemoveAttr(attr) mirroring jet.RemoveAttr(@obj, attr)
		// Remove one or more attributes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} attr The name of the attribute that will be removed.
		// @return {jObject}
		// - 
		RemoveAttr: function (obj, attr) {
			jet.Each(obj, function () {
				if (jet.IsElement(this)) {
					this.removeAttribute(attr);
				}
			});
			return this;
			
		},

		// - .Html([value]) mirroring jet.Html(@obj[, value])
		// Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} value The content of the element to set.
		// @param {Function} value A function returning the value to set.
		// @return {jObject}
		// - 
		Html: function (obj, value) {
			var elem;
			if (jet.IsDefined(value)) {
				jet.Each(obj, function () {
					var setValue = '';
					if (jet.IsFunction(value)) {
						setValue = value.call(this, this.innerHTML);
					} else {
						setValue = value;
					}

					this.innerHTML = setValue;
				});
				return this;
			} else {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					return elem.innerHTML;
				}
				return '';
			}
		},

		// - .Bind(event, callback) mirroring jet.Bind(@obj, event, callback)
		// Bind the callback function to specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event.
		// @param {Function} callback The callback function that will be applied.
		// @return {jObject}
		// - 
		Bind: function (obj, event, callback) {
			var bindMapping = {'DOMContentLoaded': 'onload'},
				evtName,
				subName,
				matches;

			event = jet.Trim(event);
			if (matches = eventNameRegex.exec(event)) {
				evtName = matches[1];
				subName = matches[2];
	
				jet.Each(obj, function () {
					if (/^(DOMContentLoaded|onload|onload)$/i.test(evtName) && (this == doc || this == win)) {
						jet.Ready(callback);
					} else {
						if (jet.IsElement(this)) {
							if (!this.jEvent) {
								this.jEvent = {};
			
								if (!this.jEvent[evtName]) {
									this.jEvent[evtName] = new jEvent();
									this.jEvent[evtName].element = this;
					
									if (this.addEventListener) {
										this.addEventListener(evtName, this.jEvent[evtName].GetHandler(), false);
									} else if (obj.attachEvent) {
										this.attachEvent(bindMapping[evtName] || 'on' + evtName, this.jEvent[evtName].GetHandler());
									} else {
										this[bindMapping[evtName] || 'on' + evtName] = this.jEvent[evtName].GetHandler();
									}
								}
								this.jEvent[evtName].Add(subName, callback);
							}
						}
					}
				});
			}

			return this;
		},

		// - .Unbind(event) mirroring jet.Unbind(@obj, event)
		// Unbind the specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event to unbind.
		// @return {jObject}
		// - 
		Unbind: function (obj, event) {
			var evtName, subName;

			event = jet.Trim(event);
			if (matches = eventNameRegex.exec(event)) {
				evtName = matches[1];
				subName = matches[2];
				jet.Each(obj, function () {
					if (jet.IsElement(this)) {
						if (this.jEvent && this.jEvent[evtName]) {
							this.jEvent[evtName].Remove(subName);
						}
					}
				});
			}

			return this;
		},

		// - .Trigger(event) mirroring jet.Trigger(@obj, event)
		// Fire the specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event to fire.
		// @return {jObject}
		// - 
		Trigger: function (obj, event) {
			var bindMapping = {'DOMContentLoaded': 'onload'}, e;

			jet.Each(obj, function () {
				if (doc.createEvent) {
					e = doc.createEvent('HTMLEvents');
				    e.initEvent(event, true, true);
				} else if (this.createEventObject) {
					e = doc.createEventObject();
				}
	
				if (this.dispatchEvent) {
					this.dispatchEvent(e);
				} else if (this.fireEvent) {
					this.fireEvent(bindMapping[event] || 'on' + event, e);
				} else if (this[eventName]) {
					this[event]();
				} else if (this['on' + event]) {
					this['on' + event]();
				}
			});

			return this;
		},

		// - .Is(selector) mirroring jet.Is(@obj, selector)
		// Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {Boolean}
		// - 
		Is: function (obj, selector) {
			var result = true;

			if (jet.IsCollection(selector)) {
				jet.Each(obj, function () {
					if (jet.IsElement(this) && result) {
						if (!jet.InArray(selector, this)) {
							result = false;
						}
					}
				});
			} else if (jet.IsFunction(selector)) {
				jet.Each(obj, function () {
					if (result) {
						if (!selector.call(this)) {
							result = false;
						}
					}
				});
			} else {
				return !!jet(selector).Filter(function () {
					if (jet.InArray(obj, this)) {
						return true;
					}
					return false;
				}).length;
			}
			return result;
		},

		// - .Value(value) mirroring jet.Value(@obj, value)
		// Get the current value of the first element in the set of matched elements or set the value of every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The value to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jObject|String}
		// - 
		Value: function (obj, value) {
			var ref = this, elem;

			if (jet.IsDefined(value)) {
				jet.Each(obj, function () {
					var setValue, hook;
	
					hook = jValueHooks[this.type] || jValueHooks[jCore.NodeName(this)];
					if (hook) {
						hook.call(ref, this, value);
					} else {
						if (jCore.IsFunction(value)) {
							setValue = value.call(this.value);
						} else {
							setValue = value;
						}

						if (jet.IsDefined(this.value)) {
							this.value = setValue;
						}
					}
				});
				return this;
			} else {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					hook = jValueHooks[elem.type] || jValueHooks[jCore.NodeName(elem)];
					if (hook) {
						return hook.call(ref, elem, value);
					}
					return obj.value;
				}
				return '';
			}
		},

		// - .Text(value) mirroring jet.Text(@obj, value)
		// Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The string of content to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jObject|String}
		// - 
		Text: function (obj, value) {
			if (jet.IsDefined(value)) {
				jet.Each(obj, function () {
					var setValue;

					if (jCore.IsFunction(value)) {
						setValue = value.call(this.value);
					} else {
						setValue = value;
					}

					this.innerText = setValue;
				});
			} else {
				elem = obj[0] || obj;
				if (jet.IsElement(elem)) {
					return elem.innerText;
				}
				return '';
			}
		},

		// - .Detach() mirroring jet.Detach(@obj)
		// Remove the set of matched elements from the DOM.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @return {jObject}
		// - 
		Detach: function (obj) {
			jet.Each(obj, function () {
				if (this.parentNode) {
					this.parentNode.removeChild(this);
				}
			});
			return this;
		}
	}, true);

	// Install Mirroring Plugin (First Element)
	jet.Install({
		// - .Sibling(type) mirroring jet.Sibling(@obj, type)
		// Get the previous or next sibling element from the first element of the set of matched elements.
		// @param {DOMElement} obj The point of element to get the sibling element.
		// @param {String} type The string of the sibling type, in 'previous' or 'next'.
		// @return {jObject}
		// - 
		Sibling: function (obj, type) {
			var direction = type + 'Sibling',
				elementDirection = type + 'ElementSibling';

			if (!obj) return null;

			if (obj[elementDirection]) {
				return obj[elementDirection];
			} else if (obj[direction]) {
				while (obj = obj[direction]) {
					if (jCore.IsElement(obj)) {
						return obj;
					}
				}
			}
			
			return null;
		},

		// - .HasClass(classNameList) mirroring jet.HasClass(@obj, classNameList)
		// Check the first element of the set of matched elements has included one or more classes.
		// @param {DOMElement} obj The element to check the class.
		// @param {Array} classNameList A list of class.
		// @return {Boolean}
		// - 
		HasClass: function (obj, classNameList) {
			var elemClass, index = 0, className;
			if (jet.IsString(classNameList)) {
				classNameList = [classNameList];
			} else if (classNameList.length == 0) {
				return true;
			}

			if (!jet.IsElement(obj)) {
				return false;
			}
			
			className = ' ' + obj.className + ' ';

			while (elemClass = classNameList[index++]) {
				if (className.indexOf(' ' + elemClass + ' ') == -1) {
					return false;
				}
			}
			return true;
		},

		// - .IsActive() mirroring jet.IsActive(@obj)
		// Check the first element of the set of matched elements is active (focus) in current document.
		// @param {DOMElement} obj The element to check.
		// @return {Boolean}
		// - 
		IsActive: function (obj) {
			if (!obj || !jet.IsElement(obj)) return false;
			if (doc.activeElement == obj) {
				return true;
			}
			return false;
		},

		// - .GetUnit(prop) mirroring jet.GetUnit(@obj, prop)
		// Get the CSS value in jUnit object from the first element's position of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @param {String} prop The name of style to get.
		// @return {jUnit}
		// - 
		GetUnit: function (obj, prop) {
			var unitObj = new jUnit();
			if (!obj || !jet.IsElement(obj)) return unitObj;

			unitObj.SetBase(obj, prop);

			return unitObj;
		},

		// - .Offset() mirroring jet.Offset(@obj)
		// Get the first element's position of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @param {String} prop The name of style to get.
		// @return {PlainObject}
		// - 
		Offset: function (obj) {
			var offset = {left: 0, top: 0}, elem, bRect, eRect;

			if (jet.IsElement(obj)) {
				if (!obj.getBoundingClientRect) {
					bRect = doc.body.getBoundingClientRect();
					eRect = obj.getBoundingClientRect();
    				offset.top = eRect.top - bRect.top;
    				offset.left = eRect.left - bRect.left;
				} else {
					elem = obj;
					while (jet.IsDefined(elem.offsetLeft) && jet.IsDefined(elem.offsetTop)) {
					    offset.left += elem.offsetLeft;
					    offset.top += elem.offsetTop;
					    elem = elem.parentNode;
					}
				}
			}

			return offset;
		},

		// - .Height([value]) mirroring jet.Height(@obj[, value])
		// Get the first element's height of the set of matched elements or set the height for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of height to set.
		// @return {jObject|Number}
		// - 
		Height: function (obj, value) {
			var body = doc.getElementsByTagName('body')[0], returnValue = 0, setValue;
			if (!jet.IsDefined(obj) || !jet.IsElement(obj)) {
				obj = win;
			}

			if (jet.IsDefined(value)) {
				if (obj != win && obj != doc && obj != body) {
					if (jet.IsFunction(value)) {
						setValue = value.call(obj, jet.CSS(obj, 'height'));
					} else {
						setValue = value;
					}
					setValue += 'px';

					jet.CSS(obj, 'height', setValue);
				}
				return this;
			} else {
				if (obj == win) {
					return parseInt(win.innerHeight);
				} else if (obj == doc || obj == body) {
					returnValue = doc.documentElement.clientHeight || jet('body').CSS('clientHeight');
					returnValue = parseInt(value);
					return returnValue;
				} else {
					returnValue = parseInt(jet.CSS(obj, 'height'));
					return returnValue;
				}
			}
		},

		// - .InnerHeight() mirroring jet.InnerHeight(@obj)
		// Get the first element's height without border, padding and margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		InnerHeight: function (obj) {
			if (!jet.IsElement(obj)) {
				return 0;
			}

			return parseInt(jet.CSS(obj, 'height')) + parseInt(jet.CSS(obj, 'padding-top')) + parseInt(jet.CSS(obj, 'padding-bottom'));
		},

		// - .OuterHeight() mirroring jet.OuterHeight(@obj)
		// Get the first element's height with padding and border, even include the margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		OuterHeight: function (obj, includeMargin) {
			var value;
			if (!jet.IsElement(obj)) {
				return 0;
			}
			includeMargin = (includeMargin) ? true : false;

			value = parseInt(jet.CSS(obj, 'height')) + parseInt(jet.CSS(obj, 'padding-top')) + parseInt(jet.CSS(obj, 'padding-bottom')) + parseInt(jet.CSS(obj, 'border-top')) + parseInt(jet.CSS(obj, 'border-bottom'));
			if (includeMargin) {
				value += (parseInt(jet.CSS(obj, 'margin-top')) + parseInt(jet.CSS(obj, 'margin-bottom')));
			}
			return value;
		},

		// - .Width([value]) mirroring jet.Width(@obj[, value])
		// Get the first element's width of the set of matched elements or set the width for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of width to set.
		// @return {jObject|Number}
		// - 
		Width: function (obj, value) {
			var body = doc.getElementsByTagName('body')[0], returnValue = 0, setValue;
			if (!jet.IsDefined(obj) || !jet.IsElement(obj)) {
				obj = win;
			}

			if (jet.IsDefined(value)) {
				if (obj != win && obj != doc && obj != body) {
					if (jet.IsFunction(value)) {
						setValue = value.call(obj, jet.CSS(obj, 'width'));
					} else {
						setValue = value;
					}
					setValue += 'px';

					jet.CSS(obj, 'width', setValue);
				}
				return this;
			} else {
				if (obj == win) {
					return parseInt(win.innerWidth);
				} else if (obj == doc || obj == body) {
					returnValue = doc.documentElement.clientWidth || jet('body').CSS('clientWidth');
					returnValue = parseInt(value);
					return returnValue;
				} else {
					returnValue = parseInt(jet.CSS(obj, 'width'));
					return returnValue;
				}
			}
		},

		// - .InnerWidth() mirroring jet.InnerWidth(@obj)
		// Get the first element's width without border, padding and margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		InnerWidth: function (obj) {
			if (!jet.IsElement(obj)) {
				return 0;
			}

			return parseInt(jet.CSS(obj, 'width')) + parseInt(jet.CSS(obj, 'padding-left')) + parseInt(jet.CSS(obj, 'padding-right'));
		},

		// - .OuterWidth() mirroring jet.OuterWidth(@obj)
		// Get the first element's width with padding and border, even include the margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		OuterWidth: function (obj, includeMargin) {
			var value;
			if (!jet.IsElement(obj)) {
				return 0;
			}
			includeMargin = (includeMargin) ? true : false;

			value = parseInt(jet.CSS(obj, 'width')) + parseInt(jet.CSS(obj, 'padding-left')) + parseInt(jet.CSS(obj, 'padding-right')) + parseInt(jet.CSS(obj, 'border-left')) + parseInt(jet.CSS(obj, 'border-right'));
			if (includeMargin) {
				value += (parseInt(jet.CSS(obj, 'margin-left')) + parseInt(jet.CSS(obj, 'margin-right')));
			}
			return value;
		},

		// - .Parent([selector]) mirroring jet.Parent(@obj[, selector])
		// Get the parent element from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		Parent: function (obj, selector) {
			var parent = obj.parentNode;
			if (!obj) return null;

			return (parent && parent.nodeType !== 11 && (!selector || jet.Is(parent, selector))) ? jet(parent) : jet();
		},

		// - .Parents([selector]) mirroring jet.Parents(@obj[, selector])
		// Get the ancestors from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		Parents: function (obj, selector) {
			var elements = [], elem;
			if (!obj) return null;

			elem = obj;
			while (elem = elem.parentNode) {
				if (!parent && parent.nodeType == 11) {
					break;
				}
				if (!selector || jet.Is(elem, selector)) {
					elements.push(elem);
				}
			}
			return jet(elements);
		},

		// - .Childs([selector]) mirroring jet.Childs(@obj[, selector])
		// Get the child elements from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		Childs: function (obj, selector) {
			var elements = [], elem;
			if (!obj) return null;

			elem = obj.childNodes[0];
			while (elem = jet.Sibling(elem, 'next')) {
				if (!selector || jet.Is(elem, selector)) {
					elements.push(elem);
				}
			}

			return jet(elements);
		},

		// - .ScrollTop([value]) mirroring jet.ScrollTop(@obj[, value])
		// Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of scroll top to set.
		// @return {jObject|Number}
		// - 
		ScrollTop: function (obj, value) {
			var y = 0;

			if (jet.IsDefined(value)) {
				value = parseInt(value);
				win.scrollTo(jet.ScrollLeft(obj), value);
				return this;
			} else {
				if (jCore.NodeName(obj, 'body')) {
					y = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
				} else if (jet.IsElement(obj)) {
					y = obj.scrollTop || 0;
				}
	
				return y;
			}
		},

		// - .ScrollLeft([value]) mirroring jet.ScrollLeft(@obj[, value])
		// Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of scroll left to set.
		// @return {jObject|Number}
		// - 
		ScrollLeft: function (obj, value) {
			var x = 0;

			if (jet.IsDefined(value)) {
				value = parseInt(value);
				win.scrollTo(value, jet.ScrollTop(obj));
				return this;
			} else {
				if (jCore.NodeName(obj, 'body')) {
					x = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
				} else if (jet.IsElement(obj)) {
					x = obj.scrollLeft || 0;
				}

				return x;
			}
		},

		// - .ScrollTo(x, y) mirroring jet.ScrollTo(@obj, x, y)
		// Scroll every matched element to specified position.
		// @param {DOMElement} obj The element to get.
		// @param {Number} x The value of scroll left to set.
		// @param {Number} y The value of scroll top to set.
		// @return {jObject}
		// - 
		ScrollTo: function (obj, x, y) {
			var elem;

			if (!jet.IsElement(obj)) {
				return this;
			}

			if (x.constructor === jObject) {
				elem = x[0];
				x = jet.Offset(elem).x;
				y = jet.Offset(elem).y;
			} else if (jet.IsElement(x)) {
				elem = x;
				x = jet.Offset(elem).x;
				y = jet.Offset(elem).y;
			}

			x = parseInt(x);
			y = parseInt(y);

			if (jet.IsFunction(obj.scrollTo)) {
				obj.scrollTo(x, y);
			}
			return this;
		},

		// - .Handler(event) mirroring jet.Handler(@obj, event)
		// Get the first element's event callback function of the set of matched elements
		// @param {DOMElement} obj The element to get.
		// @param {String} event The name of event to get.
		// @return {Function}
		// - 
		Handler: function (obj, event) {
			var bindMapping = {'DOMContentLoaded': 'onload'};
			return obj[bindMapping[event] || 'on' + event] || obj[event];
		},

		// - .Serialize() mirroring jet.Serialize(@obj)
		// Encode a set of form elements as a string for submission.
		// @return {String}
		// - 
		Serialize: function (obj) {
			if (jCore.NodeName(obj, 'form') && obj.elements) {
				return jet.BuildQueryString(jet(obj.elements).Filter(function () {
					if (submitNameRegex.test(this.tagName) && !submitTypeRegex.test(this.type) && !jet.Is(this, ':disabled') && (!checkableRegex.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).Walk(function (i, elem) {
					var value = jet(this).Value();
					if (jet.IsArray(value)) {
						return jet.Walk(value, function () {
							return {name: elem.name, value: this};
						});
					} else {
						return {name: elem.name, value: elem.value};
					}
				}));
			}

			return '';
		}
	});

	jEngine = {
		_attributeCache: [],
		Get: function (selector, baseElements) {
			var selectorSetting,
				blocks,
				matches,
				elements = [doc],
				tempElements = [],
				elem,
				elemGroup = [],
				jObj = new jObject(),
				sibling = '',

				// Index and Length
				index, eIndex, length, eLength,

				// Attribute Varible
				attributeSetting,
				attr,
				validPass = true,
				
				// Pseudo Varible
				movementSettingting,
				movementSetting,
				pseudo,
				prevList = [],
				nodeName,
				movement,
				isType,
				movementSetting = {},
				nth,
				position = 0,
				next = 0;

			if (jet.IsDefined(baseElements)) {
				if (jet.IsElement(baseElements)) {
					elements = [baseElements];
				} else if (jet.IsArray(baseElements) || baseElements.constructor === jObject || jet.isNumeric(baseElements.length)) {
					elements = baseElements;
				}
			}
			selector = jCore.SelectorSpecialChar(selector);

			try {
				if (jet.Trim(selector) === 'body') {
					jObj.Add(doc.body);
				} else {
					if (elements.length > 0) {
						for (index = 0, length = elements.length; index < length; index++) {
							elem = elements[index].querySelectorAll(selector);
							for (eIndex = 0, eLength = elem.length; eIndex < eLength; eIndex++) {
								jObj.Add(elem[eIndex]);
							}
						}
					} else {
						elements = doc.querySelectorAll(selector);
						if (elements.length > 0) {
							for (index = 0, length = elements.length; index < length; index++) {
								jObj.Add(elements[index]);
							}
						}
					}
				}
			}
			catch (error) {
				while ((blocks = selectorRegex.exec(selector)) !== null) {
					/* START: Define selector type, attribute selector, pseudo and sibling */
					selectorSetting = {
						type: blocks[2],
						tag: (blocks[3]) ? blocks[3] : '*',
						classes: [],
						attribute: [],
						pseudo: []
					};
					
					tmpElements = elements;
					elements = [];
	
					while ((matches = subAttrRegex.exec(blocks[4])) !== null) {
						if (matches[1] === '.') {
							selectorSetting.classes.push(matches[2]);
						} else {
							selectorSetting.attribute.push('[id=' + matches[2] + ']');
						}
					}
	
					while ((matches = attributeSelectorRegex.exec(blocks[5])) !== null) {
						selectorSetting.attribute.push(matches[0]);
					}
	
					while ((matches = pseudoSelectorRegex.exec(blocks[5])) !== null) {
						selectorSetting.pseudo.push(matches[0]);
					}
					
					selectorSetting.tag = selectorSetting.tag.replace(/(\.|#).*/, '');
	
					/* END: Define selector type, attribute selector, pseudo and sibling */
	
					for (index = 0, length = tmpElements.length; index < length; index++) {
						// Sibling Selector
						if (sibling) {
							if (sibling === '~') {
								elem = tmpElements[index];
								while ((elem = jet.Sibling(elem, 'next'))) {
									if (elem.walked) break;
									if (jCore.Match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
								}
							} else if (sibling === '+') { 
								elem = tmpElements[index];
								while ((elem = jet.Sibling(elem, 'next'))) {
									if (elem.walked) break;
									if (jCore.Match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
		
									break;
								}
							} else if (sibling === '>') {
								elem = jet.ChildAt(tmpElements[index], 'first');
		
								do {
									if (!elem || elem.walked) break;
									if (jCore.Match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
								} while (elem && (elem = jet.Sibling(elem, 'next')));
							}
						} else {
							// Normal Element Finder
							if (selectorSetting.type == '#') {
								elem = doc.getElementById(selectorSetting.tag);
								if (elem && (tmpElements[index] === doc || jet.ComparePosition(tmpElements[index], elem) === 20)) {
									if (jet.HasClass(elem, selectorSetting.classes)) {
										elements.push(elem);
									}
								}
							} else {
								if (selectorSetting.type == '.') {
									if (doc.getElementsByClassName) {
										elem = tmpElements[index].getElementsByClassName(selectorSetting.tag);
									}
								} else {
									if (selectorSetting.tag == 'body') {
										if (tmpElements[index] == doc) {
											elem = [doc.body];
										} else {
											elements = [];
											break;
										}
									} else {
										elem = tmpElements[index].getElementsByTagName(selectorSetting.tag);
									}
								}
	
								for (eIndex = 0, eLength = elem.length; eIndex < eLength; eIndex++) {
									if (jet.HasClass(elem[eIndex], selectorSetting.classes)) {
										elements.push(elem[eIndex]);
									}
								}
							}
						}
					}
	
					index = 0;
					while (elem = elements[index++]) {
						elem.walked = false;
					}
	
					// Attribute Selector
					if (selectorSetting.attribute.length > 0) {
						tmpElements = elements;
						elements = [];
						for (index = 0, length = tmpElements.length; index < length; index++) {
							eIndex = 0;
							validPass = true;
							while ((attr = selectorSetting.attribute[eIndex++])) {
								if (jEngine._attributeCache[attr]) {
									matches = jEngine._attributeCache[attr];
								} else {
									matches = attr.match(attributeRegex);
									jEngine._attributeCache[attr] = matches;
								}
								
								attributeSetting = {
									attribute: matches[1],
									operation: matches[3],
									value: matches[6] || matches[8] || matches[9]
								};
				
								value = jet.Attr(tmpElements[index], attributeSetting.attribute);
								if (!attributeSetting.value) {
									if (!value) {
										validPass = false;
										break;
									}
								} else {
									if (attributeSetting.operation) {
										attrOperator = {
											'^': '^' + attributeSetting.value,
											'$': attributeSetting.value + '$',
											'*': attributeSetting.value,
											'|': '^' + attributeSetting.value + '(\\-\\w+)*$',
											'~': '\\b' + attributeSetting.value + '\\b'
										};
								
										if (!(new RegExp(attrOperator[attributeSetting.operation])).test(value)) {
											validPass = false;
											break;
										}
									} else {
										if (value !== attributeSetting.value) {
											validPass = false;
											break;
										}
									}
								}
							}
	
							if (validPass) {
								elements.push(tmpElements[index]);
							}
						}
					}
	
					// Pseudo Selector
					if (selectorSetting.pseudo.length > 0) {
						index = 0;
						while ((pseudo = selectorSetting.pseudo[index++])) {
							tmpElements = elements;
							elements = [];
							matches = pseudo.match(pseudoRegex);
							movementSettingting = {
								type: matches[1],
								value: matches[3]
							};
							eIndex = 0;
	
							if (movementSettingting.type === 'contains') {
								while ((elem = tmpElements[eIndex++])) {
									if ((elem.innerText || elem.textContent || '').indexOf(movementSettingting.value) > -1) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'only-child') {
								while ((elem = tmpElements[eIndex++])) {
									if (!jet.Sibling(elem, 'next') && !jet.Sibling(elem, 'previous')) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'first-child') {
								while ((elem = tmpElements[eIndex++])) {
									if (jet.ChildAt(elem.parentNode, 'first') === elem) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'last-child') {
								while ((elem = tmpElements[eIndex++])) {
									if (jet.ChildAt(elem.parentNode, 'last') === elem) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'not') {
								while ((elem = tmpElements[eIndex++])) {
									if (movementSettingting.value.substring(0, 1) === '.') {
										if (!jet.HasClass(elem, [movementSettingting.value.substring(1)])) {
											elements.push(elem);
										}
									} else if (movementSettingting.value.substring(0, 1) === '#') {
										if (elem.id !== movementSettingting.value.substring(1)) {
											elements.push(elem);
										}
									} else {
										if (jCore.NodeName(elem, movementSettingting.value)) {
											elements.push(elem);
										}
									}
								}
							} else if (movementSettingting.type.substring(0, 3) === 'nth') {
								if (movementSettingting.value) movementSettingting.value = movementSettingting.value.replace(/^2n\+1$/, 'odd').replace(/^2n$/, 'even');
	
								nth = nthRegex.exec(pseudo);
								movement = (nth[2] === 'last') ? ['last', 'previous'] : ['first', 'next'];
								isType = (nth[3] === 'of-type') ? true : false;
					
								movementSetting = {
									start: 0,
									step: 1,
									limit: -1
								};
	
								if (movementSettingting.value === 'n') {
									elements = tmpElements;
									continue;
								} else if (movementSettingting.value === 'even') {
									movementSetting.start = 1;
									movementSetting.step = 2;
								} else if (movementSettingting.value === 'odd') {
									movementSetting.start = 0;
									movementSetting.step = 2;
								} else {
									matches = movementSettingting.value.match(nthValueRegex);
									if (!matches[3]) {
										movementSetting.start = movementSetting.limit = parseInt(matches[2]) - 1;
									} else {
										movementSetting.step = (matches[4]) ? parseInt(matches[4]) : 1;
										if (matches[1] === '-') {
											movementSetting.limit = (matches[8]) ? parseInt(matches[8]) - 1 : 0;
											movementSetting.start = movementSetting.limit % movementSetting.step;
										} else {
											movementSetting.start = (matches[8]) ? parseInt(matches[8]) - 1 : 0;
										}
									}
								}
	
								while ((elem = tmpElements[eIndex++])) {
									prevEle = elem.parentNode;
									prevEle.childExists = prevEle.childExists || {};
									nodeName = elem.nodeName;
	
									if (!prevEle.childExists[nodeName]) {
										elem = jet.ChildAt(prevEle, movement[0]);
										next = movementSetting.start;
										while (elem && (movementSetting.limit === -1 || position <= movementSetting.limit)) {
											if (!isType || (elem.nodeName === nodeName)) {
												if (position === next) {
													if (elem.nodeName === nodeName) {
														elements[elements.length] = elem;
													}
				
													next += movementSetting.step;
												}
												position++;
											}
											elem = jet.Sibling(elem, movement[1]);
										}
										prevEle.childExists[nodeName] = true;
										prevList[prevList.length] = prevEle;
										position = 0;
									}
								}
							
								eIndex = 0;
								while ((elem = prevList[eIndex++])) {
									elem.childExists = {};
								}
							}
						}
					}
	
					sibling = (jet.Trim(blocks[8]) != ',') ? jet.Trim(blocks[8]) : '';
					if (blocks[8].indexOf(',') != -1) {
						for (index = 0, length = elements.length; index < length; index++) {
							if (!elements[index].added) {
								jObj.Add(elements[index]);
								elements[index].added = true;
							}
						}
						elements = [doc];
					}
				}
	
				if (elements.length > 0) {
					for (index = 0, length = elements.length; index < length; index++) {
						if (!jet.IsDefined(elements[index].added) || !elements[index].added) {
							jObj.Add(elements[index]);
						}
					}
				}
			}

			jObj.Finalize();
			return jObj;
		}
	};

	// jet Color Object
	jColor = function () {
		
	};

	jCore.Extend(jColor.prototype, {
		R: 0,
		G: 0,
		B: 0,
		A: 255,

		Set: function (value) {
			var matches;
			if (jet.IsString(value)) {
				if (matches = hexRegex.exec(jet.Trim(value))) {
					this.R = parseInt(matches[1], 16);
					this.G = parseInt(matches[2], 16);
					this.B = parseInt(matches[3], 16);
					if (matches[4]) {
						this.A = parseInt(matches[4], 16);
					}
				} else if (matches = colorRegex.exec(jet.Trim(value))) {
					this.R = parseInt(matches[1], 10);
					this.G = parseInt(matches[2], 10);
					this.B = parseInt(matches[3], 10);
				}
			}

			return this;
		},

		Subtract: function (value) {
			var color = new jColor();
			color.Set(value);
			this.R -= color.R;
			if (this.R <= 0) this.R = 0;
			this.G -= color.G;
			if (this.G <= 0) this.G = 0;
			this.B -= color.B;
			if (this.B <= 0) this.B = 0;
			this.A -= (255 - color.A);
			if (this.A <= 0) this.A = 0;

			return this;
		},

		Mix: function (value) {
			var color = new jColor();
			color.Set(value);
			this.R += color.R;
			if (this.R > 255) this.R = 255;
			this.G += color.G;
			if (this.G > 255) this.G = 255;
			this.B += color.B;
			if (this.B > 255) this.B = 255;
			this.A += (255 - color.A);
			if (this.A > 255) this.A = 255;

			return this;
		},

		Diff: function (value, percentage) {
			var color = new jColor();
			color.Set(value);

			percentage = parseFloat(percentage);
			percentage = (percentage > 1) ? 1 : percentage;

			if (this.R > color.R) {
				color.R = this.R - Math.ceil((this.R - color.R) * percentage);
			} else {
				color.R = this.R + Math.ceil((color.R - this.R) * percentage);
			}

			if (this.G > color.G) {
				color.G = this.G - Math.ceil((this.G - color.G) * percentage);
			} else {
				color.G = this.G + Math.ceil((color.G - this.G) * percentage);
			}
			
			if (this.B > color.B) {
				color.B = this.B - Math.ceil((this.B - color.B) * percentage);
			} else {
				color.B = this.B + Math.ceil((color.B - this.B) * percentage);
			}
			
			return color;
		},

		ToHex: function () {
			return '#' + (this.R < 16 ? '0' + this.R.toString(16) : this.R.toString(16)) +
			(this.G < 16 ? '0' + this.G.toString(16) : this.G.toString(16)) +
			(this.B < 16 ? '0' + this.B.toString(16) : this.B.toString(16));
		},

		ToFullHex: function () {
			return '#' + (this.R < 16 ? '0' + this.R.toString(16) : this.R.toString(16)) +
			(this.G < 16 ? '0' + this.G.toString(16) : this.G.toString(16)) +
			(this.B < 16 ? '0' + this.B.toString(16) : this.B.toString(16)) +
			(this.A < 16 ? '0' + this.A.toString(16) : this.A.toString(16));
		}
	});

	// jet Unit
	jUnit = function () {

	};

	jCore.Extend(jUnit.prototype, {
		isColor: false,
		colorObj: null,
		diff: null,
		pixel: null,
		prop: '',
		parentPx: null,
		hasUnit: false,

		ConvertToPx: function (value, unit, parent) {
			if (this.isColor) {
				return 0;
			}
			value = parseFloat(value);

			switch (unit) {
				case '%':
					if (!jet.IsDefined(parent)) return 0;
					return parent * (value / 100);
				case 'em':
					if (!jet.IsDefined(parent)) return 0;
					return parent * value;
				case 'px':
					return value;
				case 'in':
					return Math.round(parseFloat(value) * 96);
				case 'pt':
					return Math.round(parseFloat(value, 10) * 96 / 72);
				case 'pc':
					return Math.round(parseFloat(value, 10) * 96 / 6);
				case 'cm':
					return Math.round(parseFloat(value) * 96 / 2.54);
				case 'cm':
					return Math.round(parseFloat(value) * 96 / 25.4);
				default:
					return value;
			}
		},

		ConvertToUnit: function (unit) {
			if (this.isColor) {
				return 0;
			}

			switch (unit) {
				case '%':
					return (this.pixel / this.parentPx) * 100;
				case 'em': 
					return this.pixel / this.parentPx;
				case 'px': 
					return this.pixel;
				case 'in': 
					return this.pixel / 96;
				case 'pt': 
					return this.pixel / 96 * 72;
				case 'pc': 
					return this.pixel / 96 * 6;
				case 'cm': 
					return this.pixel / 96 * 2.54;
				case 'mm': 
					return this.pixel / 96 * 25.4;
				default:
					return this.pixel;
			}
		},

		SetBase: function (obj, prop) {
			var propValue, parentEle, matches, color;

			if (jet.IsElement(obj)) {
				this.prop = prop;
				propValue = jet.CSS(obj, prop);

				if (jUnitHooks[this.prop] && jUnitHooks[this.prop].SetBase) {
					return jUnitHooks[this.prop].SetBase.call(this, propValue, obj);
				}

				if (colorRegex.test(propValue) || hexRegex.test(propValue)) {
					// Is Color value
					this.isColor = true;
					color = new jColor();
					color.Set(propValue);
					this.colorObj = color;
				} else if (jet.IsDefined(propValue)) {
					// Obtain parent element's prop value in pixel
					parentEle = jet(obj).Parent();
					if (jet.IsDefined(parentEle)) {
						if ((matches = unitRegex.exec(parentEle.CSS(prop))) !== null) {
							this.parentPx = parseInt(matches[1]);
						}
					}

					if ((matches = unitRegex.exec(propValue)) !== null) {
						if (matches[2]) {
							this.hasUnit = true;
							this.pixel = this.ConvertToPx(matches[1], matches[2].toLowerCase(), this.parentPx);
						} else {
							this.pixel = parseFloat(matches[1]);
						}
					}
				}
			}

			return this;
		},

		CalculateDiff: function (value) {
			var val;
			if (jUnitHooks[this.prop] && jUnitHooks[this.prop].CalculateDiff) {
				return jUnitHooks[this.prop].CalculateDiff.call(this, value);
			}

			if (!this.isColor) {
				if ((matches = unitRegex.exec(value)) !== null) {
					if (matches[2]) {
						switch (matches[2].toLowerCase()) {
							case '%':
								this.diff = Math.round(this.pixel * ((parseFloat(matches[1]) / 100))) - this.pixel;
							break;
							case 'em':
								this.diff = Math.round(this.parentPx * parseFloat(matches[1])) - this.pixel;
							break;
							default:
								val = this.ConvertToUnit(matches[2]);
								this.diff = (val < 0) ? parseFloat(matches[1]) - (-val) : parseFloat(matches[1]) - val;
							break;
						}
					} else {
						this.diff = (this.pixel < 0) ? parseFloat(matches[1]) - (-this.pixel) : parseFloat(matches[1]) - this.pixel;
					}
				}
			}

			return this;
		},

		Take: function (percentage) {
			if (jUnitHooks[this.prop] && jUnitHooks[this.prop].Take) {
				return jUnitHooks[this.prop].Take.call(this, percentage);
			}

			return (this.pixel + (this.diff * percentage)) + (this.hasUnit ? 'px' : '');
		}
	});

	// Animation
	jAnimate = function () {
		// Reset reference object
		this.queue = [];
		this.unit = {};
		this.element = null;
	};

	jAnimate.Easing = {
		Linear: function(percent) {
			return percent;
		},

		Swing: function(percent) {
			return 0.5 - Math.cos(percent * Math.PI) / 2;
		},

		EasingIn: function (percent) {
			return (1 - (Math.cos((percent / 2) * Math.PI)));
		},

		EasingOut: function (percent) {
			return (Math.cos(((1 - percent) / 2) * Math.PI));
		}
	};

	jAnimate.EnvironmentFPS = 60;
	jAnimate.Speed = 1;
	jAnimate.AcceptedProp = /^scroll(Left|Top)|width|height|left|top|right|bottom|opacity|fontSize|color|backgroundColor|border((Left|Right|Top|Bottom)?Width)|lineHeight|padding(Left|Right|Top|Bottom)?|margin(Left|Right|Top|Bottom)?$/;
	jAnimate.GetPitch = function () {
		return Math.ceil(1000 / (jAnimate.EnvironmentFPS * jAnimate.Speed)) || 1;
	};
	jAnimate.GetFrames = function (duration) {
		return Math.ceil(duration / (1000 / jAnimate.EnvironmentFPS));
	};
	jAnimate.GetPercentage = function (max, frame) {
		if (max == 0) return 1;
		return frame / max;
	};
	jAnimate.SetSpeed = function (value) {
		jAnimate.Speed = parseFloat(value);
		if (jAnimate.Speed <= 0) {
			jAnimate.Speed = 1;
		}
		return this;
	};

	jCore.Extend(jAnimate.prototype, {
		queue: [],
		unit: {},
		onPlaying: false,
		element: null,

		Init: function (obj) {
			if (jet.IsElement(obj)) {
				this.element = obj;
				return true;
			}
			return false;
		},

		Apply: function (prop, duration, easing, callbackObj) {
			var index, propAllowed = {}, obj;

			if (jet.IsPlainObject(prop)) {
				for (index in prop) {
					if (jAnimate.AcceptedProp.test(jet.CamelCase(index))) {
						propAllowed[index] = prop[index];
					}
				}

				obj = {
					to: propAllowed,
					progress: 0,
					frames: jAnimate.GetFrames(duration),
					step: null,
					complete: null,
					easing: easing
				};
				
				if (jet.IsPlainObject(callbackObj)) {
					if (jet.IsFunction(callbackObj.step)) {
						obj.step = callbackObj.step;
					}

					if (jet.IsFunction(callbackObj.complete)) {
						obj.complete = callbackObj.complete;
					}
				}

				this.queue.push(obj);
			}
			return this;
		},

		Wait: function (duration, callbackObj) {
			this.Apply({}, duration, 'Linear', callbackObj);
			return this;
		},

		Play: function () {
			var that = this;
			if (!this.onPlaying) {
				this.onPlaying = true;
				setTimeout(function () {
					var index, unit, method;

					if (that.queue.length > 0) {
						if (that.queue[0].progress == that.queue[0].frames) {
							that.queue[0].progress = 0;
							for (index in that.queue[0].to) {
								jet.CSS(that.element, index, that.queue[0].to[index]);
							}
							that.unit = {};

							if (that.queue[0].complete) {
								that.queue[0].complete.call(that.element);
							}

							that.queue = that.queue.slice(1);
							if (that.queue.length == 0) {
								that.onPlaying = false;
								return;
							}
						} else {
							if (that.queue[0].progress == 0) {
								// Start new queue, and setup
								for (index in that.queue[0].to) {
									that.unit[index] = new jUnit();
									that.unit[index].SetBase(that.element, index);

									if (!that.unit[index].isColor) {
										that.unit[index].CalculateDiff(that.queue[0].to[index]);
									}
								}
							} else {
								if (!jet.IsEmpty(that.queue[0].to)) {
									for (index in that.queue[0].to) {
										if (that.unit[index].isColor) {
											jet.CSS(that.element, index, 
												that.diff[index].colorObj.Diff(that.queue[0].to[index], jAnimate.Easing[(jAnimate.Easing[that.queue[0].easing]) ? that.queue[0].easing : 'Linear'](
													jAnimate.GetPercentage(that.queue[0].frames, that.queue[0].progress)
												)).ToHex()
											);
										} else {
											jet.CSS(that.element, index, that.unit[index].Take(
												jAnimate.Easing[(jAnimate.Easing[that.queue[0].easing]) ? that.queue[0].easing : 'Linear'](
													jAnimate.GetPercentage(that.queue[0].frames, that.queue[0].progress)
												)
											));
										}
									}
								}
							}

							if (that.queue[0].step) {
								that.queue[0].step.call(that.element);
							}

							that.queue[0].progress++;
						}

						if (that.onPlaying) {
							setTimeout(arguments.callee, jAnimate.GetPitch());
						}
					} else {
						that.onPlaying = false;
					}
				}, 1);
			}
			return this;
		},

		Loop: function (value) {
			this.playback = parseInt(value);
			return this;
		},

		Pause: function () {
			this.onPlaying = false;
			return this;
		},

		Clear: function () {
			this.Pause();
			this.quene = [];
			this.diff = {};
		}
	});

	win.jet = jet;
	win.jColor = jColor;
	win.jUnit = jUnit;
	win.jAnimate = jAnimate;

	// Register CSS: Hooks
	jCore.Each(['scrollTop', 'scrollLeft'], function (i, css) {
		jet.RegisterCSSHook(css, function (obj, prop, value) {
			var setValue = 0, elem;
			if (jet.IsDefined(value)) {
				jet.Each(obj, function () {
					if (jet.IsElement(this)) {
						if (jet.IsFunction(value)) {
							setValue = value.call(this, jet.Prop(this, prop));
						} else {
							setValue = value;
						}
						jet.Prop(this, prop, setValue);
					}
				});
	
				return this;
			} else {
				elem = obj[0];
				if (jet.IsElement(elem)) {
					return jet[jet.Capitalise(prop)](elem);
				}
				return 0;
			}
		});
	});

	// Register Prop: Hooks

	// Register Value: Hooks
	jet.RegisterValueHook('select', function (element, value) {
		var returns = [], valueMap = {};
		if (jet.IsDefined(value)) {
			if (jet.IsString(value)) {
				value = [value];
			}

			if (jet.IsArray(value)) {
				jet.Each(value, function () {
					valueMap[this] = true;
				});

				jet.Each(element.options, function () {
					if (valueMap[this.value]) {
						this.selected = true;
					} else {
						this.selected = false;
					}
				});
			}
			return this;
		} else {
			if (element.multiple) {
				jet.Each(element.options, function () {
					if (this.selected && !this.disabled && (!jCore.NodeName(this.parentNode, 'optgroup') || !this.parentNode.disabled)) {
						returns.push(this.value);
					}
				});
				return returns;
			} else {
				return elementoptions[obj.selectedIndex].value;
			}
		}
	});

	jCore.Each(['checkbox', 'radio'], function () {
		jet.RegisterValueHook(this, function (element, value) {
			if (jet.IsDefined(value)) {
				if (jet.IsString(value)) {
					value = [value];
				}
	
				element.checked = jet.InArray(value, element.value);
				return this;
			} else {
				if (element.checked) {
					if (jet.IsDefined(element.getAttribute('value'))) {
						return element.value;
					} else {
						return 'on';
					}
				}
				return null;
			}
		});
	});

	// Register jUnit Hooks
	jCore.Each(['padding', 'margin'], function () {
		jet.RegisterUnitHook(this, {
			Take: function (percentage) {
				var ref = this, val = [];
				jet.Each(this.pixel, function (i, value) {
					val[i] = (ref.pixel[i] + (ref.diff[i] * percentage)) + 'px';
				});
				return val.join(' ');
			},

			SetBase: function (value, element) {
				var valueSet, ref = this;

				// IE Fix: No margin value
				if (!value) {
					valueSet = [jet.CSS(element, 'margin-top'), jet.CSS(element, 'margin-right'), jet.CSS(element, 'margin-bottom'), jet.CSS(element, 'margin-left')];
				} else {
					valueSet = value.split(' ');
				}

				this.pixel = [];
				jet.Each(valueSet, function (i, propValue) {
					if ((matches = unitRegex.exec(propValue)) !== null) {
						if (matches[2]) {
							ref.pixel[i] = ref.ConvertToPx(parseFloat(matches[1]), matches[2].toLowerCase(), ref.parentPx);
						} else {
							ref.pixel[i] = parseFloat(matches[1]);
						}
					}
				});

				return this;
			},

			CalculateDiff: function (value) {
				var valueSet = value.split(' '), val = [], target = [], ref = this;

				if (this.pixel.length < valueSet.length) {
					if (this.pixel.length === 1) {
						if (valueSet.length === 2) {
							val[0] = val[1] = this.pixel[0];
						} else if (valueSet.length === 4) {
							val[0] = val[1] = val[2] = val[3] = this.pixel[0];
						}
					} else if (this.pixel.length === 2) {
						val[0] = val[1] = this.pixel[0];
						val[2] = val[3] = this.pixel[1];
					}
					this.pixel = val;
					target = valueSet;
				} else if (this.pixel.length == valueSet.length) {
					target = valueSet;
				} else {
					if (valueSet.length === 1) {
						if (this.pixel.length === 2) {
							target[0] = target[1] = valueSet[0];
						} else if (this.pixel.length === 4) {
							target[0] = target[1] = target[2] = target[3] = valueSet[0];
						}
					} else if (valueSet.length === 2) {
						target[0] = target[1] = valueSet[0];
						target[2] = target[3] = valueSet[1];
					} else {
						target = valueSet;
					}
				}

				this.diff = [];
				jet.Each(this.pixel, function (i, propValue) {
					var targetVal = target[i];
					if ((matches = unitRegex.exec(targetVal)) !== null) {
						if (matches[2]) {
							ref.diff[i] = ref.ConvertToPx(parseFloat(matches[1]), matches[2].toLowerCase(), ref.parentPx) - propValue;
						} else {
							ref.diff[i] = parseFloat(matches[1]) - propValue;
						}
					}
				});

				return this;
			}
		});
	});

	// Setup Onload Event
	jCore.DOMReady();

	if (jCore.IsDefined(win.define) && jCore.IsFunction(define) && define.amd) {
		define('jet', [], function() {
			return jet;
		});
	}
})();
