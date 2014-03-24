/*!
 * Jet JavaScript Library v1.0.2-Beta
 * http://js-jet.com/
 *
 * Copyright 2014 Ray Fung
 * Jet are released under the terms of the MIT license.
 * The MIT License is simple and easy to understand and it places almost no restrictions on what you can do with a Jet.
 * You are free to use any Jet in any other project (even commercial projects) as long as the copyright header is left intact.
 *
 *	Date: 2014-03-24T15:39Z
 */

(function() {
	var jet = function () {
		var index, selector, jObj, elem;

		jObj = new jObject();

		for (index = 0; index < arguments.length; index++) {
			if (!arguments[index]) continue;
			if (jet.isString(arguments[index])) {
				selector = jet.trim(arguments[index]);
				if (selector[0] === '<' && selector[selector.length - 1] === '>' && selector.length > 3) {
					// Create Element
					jObj.merge(jet.shift(arguments[index]));
				} else {
					// CSS Selector
					jObj.merge(jEngine.get(arguments[index]));
				}
			} else if (jet.isFunction(arguments[index])) {
				jet.ready(arguments[index]);
			} else if (jet.isCollection(arguments[index])) {
				jObj.merge(jet.apply(this, arguments[index]));
			} else {
				elem = jCore.getRoot(arguments[index]);
				if (jCore.isElement(elem) || jCore.isWindow(elem)) {
					jObj.add(elem);
				}
			}
		}

		jObj.finalize();
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
		onLoadEvent: [],
		readyOnLoad: function () {
			var index = 0, callback;
			while (callback = jCore.onLoadEvent[index++]) {
				callback.call(this);
			}
			jCore.onLoadEvent = [];
		},

		extend: function (objA, objB, inherit) {
			var name = '';

			if (objA && jCore.isObject(objB)) {
				for (name in objB) {
					if (!inherit || !jCore.isDefined(objA[name])) {
						objA[name] = objB[name];
					}
				}
			}
			return this;
		},

		defaultStyle: function (tagName, styles) {
			var style = defaultStyles[tagName], elem, tDoc = doc;

			if (!style) {
				iframe = (iframe || jet('<iframe frameborder="0" width="0" height="0" />')).appendTo(tDoc.documentElement);

				tDoc = iframe[0].contentDocument;
				tDoc.write();
				tDoc.close();
			
				elem = jet(tDoc.createElement(tagName)).appendTo(tDoc.body),
				style = defaultStyles[tagName] = {
					display: elem.css('display'),
					overflow: elem.css('overflow')
				};

				elem.detach();
				iframe.detach();
			}

			return style;
		},

		getRoot: function (elem) {
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

		match: function (element, selectorSetting) {
			if (!element || !this.isElement(element)) {
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
				if (jCore.nodeName(element, selectorSetting.tag)) {
					return false;
				}
			}

			if (selectorSetting.classes.length > 0) {
				if (!jet.hasClass(element, selectorSetting.classes)) {
					return false;
				}
			}

			return true;
		},

		// - jet.detect(obj)
		// Return the type of object 
		// @param {Object} obj The object for detection.
		// @return {String} Returns the object type.
		// -
		detect: function (obj) {
			var text = objMethod.toString.call(obj).split(' ')[1];
			return (text.substring(0, text.length - 1));
		},

		// - jet.isWalkable(obj)
		// Check to see if an object can be Iterated. 
		// @param {Object} obj The object that will be checked to see if it can be Iterated.
		// @return {Boolean}
		// -
		isWalkable: function (obj) {
			return (jCore.isCollection(obj) || jCore.isPlainObject(obj));
		},

		// - jet.isJetObject(obj)
		// Check to see if an object is a jet object. 
		// @param {Object} obj The object that will be checked to see if it's a jet object.
		// @return {Boolean}
		// -
		isJetObject: function (obj) {
			return (jCore.isDefined(obj) && obj.constructor === jObject);
		},

		// - jet.isCollection(obj)
		// Check to see if an object is a collection or an array. 
		// @param {Object} obj The object that will be checked to see if it's a collection or an array.
		// @return {Boolean}
		// -
		isCollection: function (obj) {
			return (jCore.isDefined(obj) && (jCore.isArray(obj) || jCore.isJetObject(obj) || (jCore.isNumeric(obj.length) && jCore.isFunction(obj.item))));
		},

		// - jet.isDefined(obj)
		// Check to see if an object is defined. 
		// @param {Object} obj The object that will be checked to see if it's defined.
		// @return {Boolean}
		// - 
		isDefined: function (obj) {
			return (typeof obj !== 'undefined');
		},

		// - jet.isElement(obj)
		// Check to see if an object is an element object. 
		// @param {Object} obj The object that will be checked to see if it's an element object.
		// @return {Boolean}
		// - 
		isElement: function (obj) {
			return (jCore.isDefined(obj) && (obj.nodeType === 1 || obj.nodeType === 11 || obj.nodeType === 9));
		},

		// - jet.isArray(obj)
		// Check to see if an object is an array. 
		// @param {Object} obj The object that will be checked to see if it's an array.
		// @return {Boolean}
		// - 
		isArray: function (obj) {
			return (this.detect(obj) === 'Array');
		},

		// - jet.isObject(obj)
		// Check to see if an object is an object. 
		// @param {Object} obj The object that will be checked to see if it's an object.
		// @return {Boolean}
		// - 
		isObject: function (obj) {
			return (this.detect(obj) === 'Object');
		},

		// - jet.isFunction(obj)
		// Check to see if an object is a callback function. 
		// @param {Object} obj The object that will be checked to see if it's a callback function.
		// @return {Boolean}
		// - 
		isFunction: function (obj) {
			return (this.detect(obj) === 'Function');
		},

		// - jet.isString(obj)
		// Check to see if an object is a string. 
		// @param {Object} obj The object that will be checked to see if it's a string.
		// @return {Boolean}
		// - 
		isString: function (obj) {
			return (this.detect(obj) === 'String');
		},

		// - jet.isNumeric(obj)
		// Check to see if an object is a number. 
		// @param {Object} obj The object that will be checked to see if it's a number.
		// @return {Boolean}
		// - 
		isNumeric: function (obj) {
			return (this.detect(obj) === 'Number');
		},

		// - jet.isPlainObject(obj)
		// Check to see if an object is a plain object (created using "{}" or "new Object").
		// @param {Object} obj The object that will be checked to see if it's a plain object.
		// @return {Boolean}
		// - 
		isPlainObject: function (obj) {
			if (!this.isDefined(obj)) {
				return false;
			}
			if (!this.isObject(obj) || (obj.constructor && !objMethod.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf'))) {
				return false;
			}
			return true;
		},

		// - jet.isDocument(obj)
		// Check to see if an object is a document node.
		// @param {Object} obj The object that will be checked to see if it's a document node.
		// @return {Boolean}
		// - 
		isDocument: function (obj) {
			return (this.isDefined(obj) && obj.nodeType === 9);
		},

		// - jet.isEmpty(obj)
		// Check to see if an object or array is empty.
		// @param {Object} obj The object that will be checked to see if it's empty.
		// @return {Boolean}
		// - 
		isEmpty: function (obj) {
		    if (obj == null) return true;

		    if (obj.length > 0) return false;
		    if (obj.length === 0) return true;

		    for (var key in obj) {
		        if (objMethod.hasOwnProperty.call(obj, key)) return false;
		    }
		
		    return true;
		},

		// - jet.isWindow(obj)
		// Check to see if the object is a window object.
		// @param {Object} obj The object that will be checked to see if a window object.
		// @return {Boolean}
		// @added 1.0.2-Beta
		// - 
		isWindow: function (obj) {
			return this.isDefined(obj) && (obj.self === obj || (obj.contentWindow.self && obj.contentWindow.self === obj.contentWindow));
		},

		// - jet.each(obj, callback)
		// Seamlessly iterate each item of an array, array-like or object.
		// @param {Object} obj The object that will be checked to see if it's included in a specified array.
		// @param {Function} callback The callback function that to be executed for each item.
		// @return {jet}
		// - 
		each: function (obj, callback) {
			var index, length;

			if (!this.isFunction(callback)) {
				return this;
			}

			if (this.isCollection(obj)) {
				index = 0;
				for (index = 0, length = obj.length; index < length; index++) {
					callback.call(obj[index], index, obj[index]);
				}
			} else if (this.isObject(obj)) {
				for (index in obj) {
					callback.call(obj[index], index, obj[index]);
				}
			} else {
				callback.call(obj, 0, obj);
			}

			return this;
		},

		selectorSpecialChar: function (selector) {
			selector = selector.replace(/#(\d)/, '#\\3$1 ');
			selector = selector.replace(/(\[\w+\s*=\s*)(\d)/i, '$1\\3$2 ');
			return selector.replace(/#(\d)/, '#\\3$1 ');
		},

		nodeName: function (obj, compare) {
			if (jCore.isDefined(compare)) {
				return obj.nodeName && obj.nodeName.toLowerCase() === compare.toLowerCase();
			}
			return (obj.nodeName) ? obj.nodeName.toLowerCase() : '';
		},

		// - jet.inArray(obj)
		// Check to see if an object is included in a specified array.
		// @param {Object} obj The object that will be checked to see if it's included in a specified array.
		// @return {Boolean}
		// - 
		inArray: function (ary, value) {
			var index = 0, val;
			if (jet.isCollection(ary)) {
				while (val = ary[index++]) {
					if (value === val) {
						return true;
					}
				}
			}
			return false;
		},

		domReady: function () {
			var top;

			// DOM Ready on post load
			if (doc.readyState === 'complete') {
				setTimeout(jCore.readyOnLoad);
			} else {
				// Setup DOM Ready Event
	        	if (win.addEventListener) {
					doc.addEventListener('DOMContentLoaded', function () {
						jCore.readyOnLoad();
					}, false);
				} else {
					top = null;
					
					try {
						top = win.frameElement === null && doc.documentElement;
					} catch(e) {
						
					}
	
					if (top && top.doScroll) {
						(function poll() {
							if (jCore.onLoadEvent.length) {
								try {
									top.doScroll('left');
								} catch(e) {
									return setTimeout(poll, 50);
								}
	
								jCore.readyOnLoad();
							}
						})();
					}
	
					doc.onreadystatechange = function () {
						if (doc.readyState === 'complete') {
							doc.onreadystatechange = null;
							jCore.readyOnLoad();
						}
					};
				}
	
				win.onload = function () {
					jCore.readyOnLoad();
					win.onload = null;
				};
			}
		}
	};

	// Jet Event Handler
	jEvent = function () {
		this.events = {};
	};

	jCore.extend(jEvent.prototype, {
		events: {},
		element: null,

		add: function (event, callback) {
			if (!event) {
				event = '_jEventBase';
			}

			this.events[event] = callback;
			return this;
		},

		remove: function (event) {
			if (!event) {
				event = '_jEventBase';
			}

			delete this.events[event];
			return this;
		},

		clear: function () {
			var index;
			for (index in this.events) {
				delete this.events[index];
			}

			return this;
		},

		getHandler: function () {
			var events = this.events, element = this.element;
			return function (e) {
				var index;
				// Fixed below IE8
				e = e || win.event;

				for (index in events) {
					events[index].call(element, e);
				}
			};
		}
	});

	// Clone Function
	jCore.each(['detect', 'isDefined', 'isElement', 'isArray', 'isObject', 'isFunction', 'isString', 'isEmpty', 'isNumeric', 'isPlainObject', 'inArray', 'isCollection', 'isWalkable', 'isDocument', 'isWindow', 'each'], function () {
		jet[this] = jCore[this];
	});

	function adapter(name, isFullSet) {
		return function (value, args) {
			var elem = (isFullSet) ? this : this[0];
			return jet[name].call(this, elem, value, args);
		};
	}

	// Extend jet class, static function
	jCore.extend(jet, {
		// @added 1.0.2-Beta
		version: '1.0.2-Beta',
		// - jet.noConflict()
		// Release the jet control of the jet variable.
		// @return {jet}
		// - 
		noConflict: function () {
			var _jet = win.jet;
			win.jet = null;
			return _jet;
		},

		// - jet.extend(obj)
		// Merge the contents of the object into jet control prototype.
		// @param {Object} obj The object that will be merged into jet control.
		// @return {jet}
		// - 
		extend: function (obj) {
			jCore.extend(jet, obj, true);
			return this;
		},

		// - jet.extendObject(objA, objB, inherit)
		// Merge the contents of the object specified into the first object.
		// @param {Object} objA The object that would be extended.
		// @param {Object} objB The object that will be merged.
		// @param {Boolean} inherit Set to true for not allow overwrite any original content.
		// @return {jet}
		// - 
		extendObject: function (objA, objB, inherit) {
			jCore.extend(objA, objB, inherit);
			return this;
		},

		// - jet.install(obj, isFullSet)
		// Install a mirroring plugin to jet.
		// @param {PlainObject} obj The object that is a set of plugin to install.
		// @param {Boolean} isFullSet Set to true that would apply all matched element to plugin, else apply first element of the set of matched element.
		// @return {jet}
		// - 
		install: function (obj, isFullSet) {
			var name, func, alias;

			for (name in obj) {
				if (jet.isPlainObject(obj[name]) && jet.isString(obj[name].alias)) {
					func = obj[name].callback;
					alias = obj[name].alias;
				} else {
					func = obj[name];
					alias = name;
				}

				if (jet.isFunction(func)) {
					if (!jet.isDefined(jet[name])) {
						jet[name] = func;
					}

					if (!jet.isDefined(jObject.prototype[alias])) {
						jObject.prototype[alias] = adapter(name, isFullSet);
					}
				}
			}
			return this;
		},

		// - jet.ready(callback)
		// Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).
		// @param {Function} callback The object that is a set of plugin to install.
		// @return {jet}
		// - 
		ready: function (callback) {
			var index, func;
			if (jet.isArray(callback)) {
				index = 0;
				while (func = callback[index++]) {
					this.ready(func);
				}
			} else {
				if (jet.isFunction(callback)) {
					jCore.onLoadEvent.push(callback);
				}
			}
			return this;
		},

		// - jet.trim(text)
		// Strip whitespace from the beginning and end of a string
		// @param {String} text The string that for whitespace stripping.
		// @return {String}
		// - 
		trim: function (text) {
			return text.replace(/^\s+|\s+$/g, '');
		},

		// - jet.childAt(obj, type)
		// Check to see the element is the first or the last node in current node set. Equivalent as jet.is(obj, ':first-child') or jet.is(obj, ':last-child').
		// @param {Object} obj The object that will be checked to see if it's the first or the last node in current node set.
		// @param {String} type The string of type in 'first' or 'last'.
		// @return {Boolean}
		// - 
		childAt: function (obj, type) {
			var direction = (type === 'first') ? 'next' : 'previous',
				child;
				
			if (!obj || !jet.isElement(obj)) return null;

			if (obj[type + 'ElementChild']) {
				return obj[type + 'ElementChild'];
			} else {
				child = obj[type + 'Child'];
				if (jet.isElement(child)) return child;
				return jet.sibling(child, direction);
			}
		},

		// - jet.shift(html)
		// Convert the string into jet object.
		// @param {String} html The string that will be converted to a set of elements.
		// @return {jObject}
		// - 
		shift: function (html) {
			var jObj, elements;

			container.innerHTML = html;
			elements = container.getElementsByTagName('*');
			jObj = jet(elements);
			container.innerHTML = '';

			return jObj;
		},

		// - jet.comparePosition(a, b)
		// Convert the string into jet object.
		// @param {DOMElement} a The dom element that for compare.
		// @param {DOMElement} b The dom element that will be compared with first dom element provided.
		// @return {Number}
		// - 
		comparePosition: function (a, b) {
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

		// - jet.capitalise(text)
		// Capital the first letter of a string.
		// @param {String} text The string for capital the first letter.
		// @return {String}
		// - 
		capitalise: function (text) {
			if (!jet.isString(text)) {
				return '';
			}
		    return text.charAt(0).toUpperCase() + text.slice(1);
		},

		// - jet.camelCase(text)
		// Convert from Underscore text or Hyphen text to Camel Case one.
		// @param {String} text The string that will be converted from Underscore text or Hyphen text to Camel Case one.
		// @return {String}
		// - 
		camelCase: function (text) {
			return text.replace(/[\-_]([\da-z])/gi, function (str, match) {
				return match.toUpperCase();
			});
		},

		// - jet.ajax(obj)
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
		ajax: function (obj) {
			var objExt = {}, data = {}, parser;

			jCore.extend(objExt, obj);

			if (jet.isFunction(obj.success)) {
				objExt.success = function () {
					if (obj.dataType === 'xml') {
						if (win.dOMParser) {
							parser = new DOMParser();
							data = parser.parseFromString(this, 'text/xml');
						} else {
							data = new ActiveXObject('Microsoft.xMLDOM');
							data.async = false;
							data.loadXML(this); 
						}
					} else {
						data = eval('(' + this + ')');
					}
					obj.success.call(data);
				};
			}

			jet.request(objExt, objExt);

			return this;
		},

		// - jet.request(obj)
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
		request: function (obj) {
			var xmlHttp = null, dataString = '', index;

			if (jet.isPlainObject(obj) && obj.url.length > 0) {
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
						if (jet.isFunction(obj.success)) {
							obj.success.call(xmlHttp.responseText);
						}
				    } else {
						if (jet.isFunction(obj.error)) {
							obj.error.apply(xmlHttp.statusText, [xmlHttp.status, xmlHttp.statusText]);
						}
				    }
				};

				if (obj.method == 'post') {
					xmlHttp.open('POST', obj.url, true);

					if (jet.isPlainObject(obj.headers)) {
						for (index in obj.headers) {
							xmlHttp.setRequestHeader(index, obj.headers[index]);
						}
					}

					if (jet.isDefined(obj.data)) {
						xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
						if (jet.isPlainObject(obj.data)) {
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

		// - jet.registerCSSHook(name, callback)
		// Register a Hook for jet.css()
		// @param {String} name The name of style property that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		registerCSSHook: function (name, callback) {
			if (jet.isString(name) && jet.trim(name) && jet.isFunction(callback)) {
				jCSSHooks[name] = callback;
			}
			return this;
		},

		// - jet.registerValueHook(name, callback)
		// Register a Hook for jet.value()
		// @param {String} name The name of object type or name that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		registerValueHook: function (name, callback) {
			if (jet.isString(name) && jet.trim(name) && jet.isFunction(callback)) {
				jValueHooks[name] = callback;
			}
			return this;
		},

		// - jet.registerPropHook(name, callback)
		// Register a Hook for jet.prop()
		// @param {String} name The name of property that will be executed by user-defined callback function.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		registerPropHook: function (name, callback) {
			if (jet.isString(name) && jet.trim(name) && jet.isFunction(callback)) {
				jPropHooks[name] = callback;
			}
			return this;
		},

		// - jet.registerUnitHook(name, obj)
		// Register a Hook for jUnit calculation
		// @param {String} name The name of property that will be executed by user-defined callback function.
		// @param {PlainObject} obj A set of callback function.
		// @item obj:{Function} CalculateDiff(value) The callback function that for calculate the different between original and specified value.
		// @param {String} obj.calculateDiff.value A specified value that to calculate the difference with original value.
		// @item obj:{Function} Take(percentage) Returns the original value plus the difference in percentage provided.
		// @param {Number} obj.take.percentage A number of percentage, between 0 to 1 (0% to 100%).
		// @item obj:{Function} SetBase(value) The callback function that for setup and calculate the original value.
		// @param {String} obj.setBase.value A string of the original value.
		// @return {jet}
		// - 
		registerUnitHook: function (name, obj) {
			if (jet.isString(name) && jet.trim(name) && jet.isPlainObject(obj)) {
				jUnitHooks[name] = obj;
			}
			return this;
		},

		// - jet.walk(obj, callback)
		// Execute the user-defined callback function to each item of the array, array-like object, plain object or object.
		// @param {Object} obj The array, array-like object, plain object or object that will be iterated.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		walk: function (obj, callback) {
			var result = [];

			if ((jet.isArray(obj) || jet.isPlainObject(obj)) && jet.isFunction(callback)) {
				jet.each(obj, function (i, object) {
					var value = callback.call(object, i, object);
					if (jet.isArray(value)) {
						result = result.concat(value);
					} else {
						result.push(value);
					}
				});
			}

			return result;
		},

		// - jet.buildQueryString(obj)
		// Generates a URL-encoded query string from the array or plain object provided.
		// @param {Object} obj The array or plain object that will be converted to a URL-encoded query. If the object is an array, each item should included 'name' and 'value' properties.
		// @return {String}
		// - 
		buildQueryString: function (obj) {
			var queryString = [], value;

			if (jet.isArray(obj)) {
				jet.each(obj, function () {
					if (jet.isDefined(this.name) && jet.isDefined(this.value)) {
						value = (jet.isFunction(this.value)) ? this.value() : this.value;
						queryString.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(value));
					}
				});
			} else if (jet.isPlainObject) {
				jet.each(obj, function (i, val) {
					value = (jet.isFunction(val)) ? val() : val;
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
	jCore.extend(jObject.prototype, {
		constructor: jObject,
		animate: null,

		// - .merge(obj)
		// Merge a set of elements into current set of matched elements that not be added or duplicate.
		// @param {Object} obj The array or array-like object that will be merged.
		// @return {jObject}
		// - 
		merge: function (obj) {
			var index = 0, elem;

			if (jet.isCollection(obj)) {
				while (elem = this[index++]) {
					elem.added = true;
				}
	
				index = 0;
				while (elem = obj[index++]) {
					if (jet.isElement(elem)) {
						if (!jet.isDefined(elem.added) || !elem.added) {
							elem.added = true;
							this.push(elem);
						}
					}
				}
			}

			return this;
		},

		// - .add(element)
		// Add an element into current set of matched elements that not be added or duplicate.
		// @param {DOMElement} element The element that will be added.
		// @return {jObject}
		// - 
		add: function (element) {
			if (jet.isElement(element) || jet.isWindow(element)) {
				if (!jet.isDefined(element.added) || !element.added) {
					element.added = true;
					this.push(element);
				}
			}
			return this;
		},

		// - .finalize()
		// Reset each of the set of matched elements 'added' frag.
		// @return {jObject}
		// - 
		finalize: function () {
			var index = 0, elem;
			while ((elem = this[index++])) {
				elem.added = false;
			}
		},

		// - .each(callback)
		// Iterate over a jet object, executing a function for each matched element.
		// @param {Function} callback The callback function that to be executed.
		// @return {jObject}
		// - 
		each: function (callback) {
			jet.each(this, callback);
			return this;
		},

		// - .find(selector)
		// Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {DOMElement} selector The element that for filtering.
		// @return {jObject}
		// - 
		find: function (selector) {
			var jObj;

			if (jet.isElement(selector)) {
				selector = [selector];
			}

			if (jet.isCollection(selector)) {
				jObj = jet();

				jet.each(this, function (i, a) {
					jet.each(selector, function (i, b) {
						if (jet.comparePosition(a, b) === 20) {
							jObj.add(b);
						}
					});
				});
				jObj.finalize();
				return jObj;
			}
			return jEngine.get(selector, this);
		},

		// Action
		// - .hide(duration, callback)
		// Hide the matched elements.
		// @param {Number} duration The number of duration in millisecond.
		// @param {Function} callback The callback function that will be executed when the element has been hidden.
		// @return {jObject}
		// - 
		hide: function (duration, callback) {
			jet.each(this, function (i, elem) {
				var animateObj = {};
				if (jet.css(elem, 'display') !== 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						elem._cssStorage = {};
	
						elem._cssStorage.display = jet.css(elem, 'display');
						elem._cssStorage.overflow = jet.css(elem, 'overflow');
						jet.each(['width', 'height', 'padding', 'margin', 'opacity'], function () {
							var val = jet.css(elem, this);
							if (parseFloat(val) > 0) {
								elem._cssStorage[this] = val;
								animateObj[this] = '0';
							}
						});

						jet.css(elem, 'display', 'block');
						jet.css(elem, 'overflow', 'hidden');
						if (animateObj) {
							jet(elem).animate(animateObj, duration, 'onswing', {
								complete: function () {
									jet.css(elem, 'display', 'none');
									if (jet.isFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jet.css(elem, 'display', 'none');
		
						if (jet.isFunction(callback)) {
							callback.call(elem);
						}
					}
				}
			});

			return this;
		},

		// - .show(duration, callback)
		// Show the matched elements.
		// @param {Number} duration The number of duration in millisecond.
		// @param {Function} callback The callback function that will be executed when the element has been shown.
		// @return {jObject}
		// - 
		show: function (duration, callback) {
			jet.each(this, function (i, elem) {
				var animateObj = {}, style;

				if (jet.css(elem, 'display') === 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						if (jet.isDefined(elem._cssStorage)) {
							jet.each(['width', 'height', 'padding', 'margin', 'opacity', 'display'], function () {
								var val = jet.css(elem, this);
								if (jet.isDefined(elem._cssStorage[this])) {
									animateObj[this] = elem._cssStorage[this];
								}
							});
		
							jet.css(elem, 'display', elem._cssStorage.display);
							jet.css(elem, 'overflow', elem._cssStorage.overflow);
							elem._cssStorage = null;
						} else {
							style = jCore.defaultStyle(jCore.nodeName(elem));
							jet.css(elem, 'display', style.display);
							jet.css(elem, 'overflow', style.overflow);
							jet.css(elem, 'opacity', '0');
							animateObj = {
								opacity: 1
							};
						}
		
						if (animateObj) {
							jet(elem).animate(animateObj, duration, 'onswing', {
								complete: function () {
									if (jet.css(elem, 'opacity') === '1') {
										jet.css(elem, 'opacity', null);
									}

									if (jet.isFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jet.css(obj, 'display', 'block');
		
						if (jet.isFunction(callback)) {
							callback.call(this);
						}
					}
				}
			});

			return this;
		},

		// - .prev()
		// Retuens the previous sibling element from the first element of the set of matched elements.
		// @return {jObject}
		// - 
		prev: function () {
			var obj = this[0];
			return jet(jet.sibling(obj, 'previous'));
		},

		// - .next()
		// Retuens the previous sibling element from the first element of the set of matched elements.
		// @return {jObject}
		// - 
		next: function () {
			var obj = this[0];
			return jet(jet.sibling(obj, 'next'));
		},

		// - .get(start[, length])
		// Returns the specified element or a number of elements with jet object.
		// @param {Number} start The returned element will start at the specified index in the set of matched elements.
		// @param {Number} length Returnes a number of elements from the specified index.
		// @return {jObject}
		// - 
		get: function (start, length) {
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

		// - .filter(callback)
		// Reduce the set of matched elements to those that match the selector or pass the function’s test.
		// @param {Function} callback The callback function that used of filter, return true to keep the element.
		// @return {jObject}
		// - 
		filter: function (callback) {
			var filtered = [];

			jet.each(this, function () {
				if (callback.call(this)) {
					filtered.push(this);
				}
			});

			return jet(filtered);
		},

		// - .walk(callback)
		// Execute the user-defined callback function to each element of the set of matched elements.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jObject}
		// - 
		walk: function (callback) {
			return jet.walk(this, callback);
		},

		// Event
		// - .on(event[, callback])
		// Apply or trigger event to each of the set of matched elements.
		// @param {String} event The string of event name.
		// @param {Function} callback The callback function thet will be applied to specified event.
		// @return {jObject}
		// - 
		on: function (event, callback) {
			if (jet.isDefined(callback)) {
				if (jet.isFunction(callback)) {
					jet.bindEvent(this, event, function (e) {
						callback.call(this, e);
					});
				}
			} else {
				jet.trigger(this, event);
			}

			return this;
		},

		// - .click(callback)
		// Apply or trigger OnClick event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		click: function (callback) {
			return this.on('click', callback);
		},

		// - .dblClick(callback)
		// Apply or trigger OnDblClick event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		dblClick: function (callback) {
			return this.on('dblclick', callback);
		},

		// - .focus(callback)
		// Apply or trigger OnFocus event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		focus: function (callback) {
			return this.on('focus', callback);
		},

		// - .blur(callback)
		// Apply or trigger OnBlur event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		blur: function (callback) {
			return this.on('blur', callback);
		},

		// - .change(callback)
		// Apply or trigger OnChange event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		change: function (callback) {
			return this.on('change', callback);
		},

		// - .select(callback)
		// Apply or trigger OnSelect event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		select: function (callback) {
			return this.on('select', callback);
		},

		// - .mouseOver(callback)
		// Apply or trigger OnMouseOver event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		mouseOver: function (callback) {
			return this.on('mouseover', callback);
		},

		// - .mouseOut(callback)
		// Apply or trigger OnMouseOut event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		mouseOut: function (callback) {
			return this.on('mouseout', callback);
		},

		// - .ready(callback)
		// Apply or trigger OnLoad event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		ready: function (callback) {
			return this.on('load', callback);
		},

		// - .unload(callback)
		// Apply or trigger Unload event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		unload: function (callback) {
			return this.on('unload', callback);
		},

		// - .submit(callback)
		// Apply or trigger OnSubmit event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// - 
		submit: function (callback) {
			return this.on('submit', callback);
		},

		// - .mouseDown(callback)
		// Apply or trigger OnMouseDown event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// @added 1.0.2-Beta
		// - 
		mouseDown: function (callback) {
			return this.on('mousedown', callback);
		},

		// - .mouseUp(callback)
		// Apply or trigger OnMouseUp event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// @added 1.0.2-Beta
		// - 
		mouseUp: function (callback) {
			return this.on('mouseup', callback);
		},

		// - .mouseMove(callback)
		// Apply or trigger OnMouseMove event to each of the set of matched elements.
		// @param {Function} callback The callback function thet will be applied.
		// @return {jObject}
		// @added 1.0.2-Beta
		// - 
		mouseMove: function (callback) {
			return this.on('mousemove', callback);
		},

		// - .dragDrop(params, selector)
		// Apply Drag n Drop to each of the set of matched elements.
		// @param {PlainObject} params The setting for drag n drop event.
		// @param {Function} params.mousedown(e) The callback function on mouse down.
		// @param {Function} params.mousemove(e, preventDefault) The callback function on mouse move, preventDefault is the default callback of drag n drop mouse move, used to update elements top and left.
		// @param {Function} params.mouseup(e, parent) The callback function on mouse up, apply parent element to callback if exists.
		// @param {String} selector The first parent element that matched with selector, which is use to drag and drop.
		// @return {jObject}
		// @added 1.0.2-Beta
		// - 
		dragDrop: function(params, selector) {
			jet.each(this, function (i, elem) {
				var elMove = elem;

				if (jet.isElement(elem)) {
					if (jet.isDefined(selector)){
						elMove = jet.parents(elem, selector)[0];
						if (elMove.nodeType !== 1) {
							elMove = elem;
						}
					}

					jet(elem).attr('draggable', true);

					// Display href onclick event
					jet(elem).click(function () {
						return false;
					});

					jet(elem).bindEvent('dragstart', function (e) {
						var point = {
							x: (e.clientX) - jet.offset(elem).left,
							y: (e.clientY) - jet.offset(elem).top
						}, func = function (e) {
							jet.css(elMove, {
								top: (e.clientY - point.y) + 'px', left: (e.clientX - point.x) + 'px'
							});
						};

						jet.css(elMove, 'position', 'absolute');

						// IE8 and below, stop propagation and cancel action
						if (e.stopPropagation) {
							e.stopPropagation();
						}
						e.cancelBubble = true;
						e.returnValue = false;

						if (e.preventDefault) {
							e.preventDefault();
						}

						if (jet.isDefined(params) && params.drag) {
							params.drag.call(elem, e);
						}

						jet(doc).mouseMove(function (e) {
							if (jet.isDefined(params) && params.move) {
								params.move.call(elMove, e, func);
							} else {
								func.call(elMove, e);
							}
						});

						jet(doc).mouseUp(function (e) {
							if (e.preventDefault) {
								e.preventDefault();
							}

							if (jet.isDefined(params) && params.drop) {
								params.drop.call(elem, e, elMove);
							}

							jet(doc).unbindEvent('mousemove');
							jet(doc).unbindEvent('mouseup');
						});
					});
				}
			});
			return this;
		},

		// Animate
		// - .animate(callback[, duration, easing, callback])
		// Perform a custom animation of a set of CSS properties.
		// @param {PlainObject} cssObj The plain object with CSS property and value.
		// @param {Number} duration The number of duration, in millisecond.
		// @param {String} easing The string of easing type, it can be 'Linear', 'onswing', 'EasingIn' or 'EasingOut'.
		// @param {PlainObject} callback The plain object of callback function.
		// @param {Function} obj.step The callback function that will be executed in each tick.
		// @param {Function} obj.complete The callback function that will be executed when the animate is completed.
		// @return {jObject}
		// - 
		animate: function (cssObj, duration, easing, callback) {
			var element = this[0];
			duration = parseInt(duration) || 400;
			if (!jet.isPlainObject(cssObj) || !jet.isElement(element)) {
				return this;
			}

			if (duration < jAnimate.getPitch()) {
				duration = jAnimate.getPitch();
			}

			if (!element.jAnimate) {
				element.jAnimate = new jAnimate();
				element.jAnimate.init(element);
			}

			element.jAnimate.apply(cssObj, duration, easing, callback);
			element.jAnimate.play();

			return this;
		},

		// - .wait(callback)
		// Wait a specified period of time for next animation
		// @param {Number} duration The number of duration, in millisecond.
		// @param {Function} callback The callback function that will be executed when the wait timer is expired.
		// @return {jObject}
		// - 
		wait: function (duration, callback) {
			var element = this[0];
			duration = parseInt(duration);
			if (duration <= 0 || !jet.isElement(element)) {
				return this;
			}

			if (!element.jAnimate) {
				element.jAnimate = new jAnimate();
				element.jAnimate.init(element);
			}

			element.jAnimate.wait(duration, callback);
			element.jAnimate.play();

			return this;
		}
	});

	// Append and Preppend function
	function insertTo(obj, element, type) {
		var contents, length = (obj.length) ? obj.length - 1 : 0;

		if (element && jet.isCollection(element) && element.length > 0) {
			contents = element;
		} else if (jet.isString(element)) {
			contents = [doc.createTextNode(element)];
		} else if (jet.isElement(element)) {
			contents = [element];
		}

		if (contents) {
			jet.each(obj, function (i, target) {
				if (jet.isElement(target)) {
					target = jCore.getRoot(target);

					jet.each(contents, function (j, elem) {
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

	// Install Mirroring Plugin (Full Set Element)
	jet.install({
		// - .append(element) mirroring jet.append(@obj, element)
		// Insert content to the end of each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jObject}
		// - 
		append: function (obj, element) {
			insertTo(obj, element, 'Append');

			return this;
		},

		// - .prepend(element) mirroring jet.prepend(@obj, element)
		// Insert content to the beginning of each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jObject}
		// - 
		prepend: function (obj, element) {
			insertTo(obj, element, 'Prepend');

			return this;
		},

		// - .appendTo(element) mirroring jet.appendTo(@obj, element)
		// Insert every element in the set of matched elements to the end of the target.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jObject}
		// - 
		appendTo: function (obj, element) {
			jet.append(element, obj);

			return this;
		},

		// - .prependTo(element) mirroring jet.prependTo(@obj, element)
		// Insert every element in the set of matched elements to the beginning of the target.
		// @param {Object} obj The set of elements, it can be array, array-like object or a specified DOM element.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jObject}
		// - 
		prependTo: function (obj, element) {
			jet.prepend(element, obj);

			return this;
		},

		// - .prop(prop[, value]) mirroring jet.prop(@obj, prop[, value])
		// Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the property to set.
		// @param {String} prop The name of the property to get.
		// @param {Array} prop A set of property name to get.
		// @param {Object} prop An object of property-value pairs to set.
		// @param {String|Number|Boolean} value The value of the property to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		prop: function (obj, prop, value) {
			var returns = {}, elem;

			if (jet.isPlainObject(prop)) {
				jet.each(prop, function (pp, val) {
					jet.prop(obj, pp, val);
				});
			} else if (jet.isArray(prop)) {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					jet.each(prop, function (i, pp) {
						returns[pp] = jet.prop(elem, propBinding[pp] || pp);
					});
				}
				return returns;
			} else {
				if (jet.isDefined(value)) {
					jet.each(obj, function () {
						var setValue;

						if (jet.isFunction(value)) {
							setValue = value.call(this, this[propBinding[prop] || prop]);
						} else {
							setValue = value;
						}
	
						if (setValue !== null && jet.isDefined(this[propBinding[prop] || prop])) {
							this[propBinding[prop] || prop] = setValue;
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.isElement(elem)) {
						return elem[propBinding[prop] || prop];
					}
					return null;
				}
			}
			return this;
		},

		// - .removeProp(prop) mirroring jet.removeProp(@obj, prop)
		// Remove the property for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the property that will be removed.
		// @return {jObject}
		// - 
		removeProp: function (obj, prop) {
			jet.each(obj, function () {
				if (jet.isElement(this)) {
					this[propBinding[prop] || prop] = undefined;
					this.removeAttribute(prop);
				}
			});
			return this;
		},

		// - .css(prop[, value]) mirroring jet.css(@obj, prop[, value])
		// Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop The name of the style to set.
		// @param {String} prop The name of the style to get.
		// @param {Array} prop A set of style to get.
		// @param {Object} prop An object of style-value pairs to set.
		// @param {String|Number|Boolean} value The value of the style to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		css: function (obj, prop, value) {
			var elem, ccProp, returns = {};

			if (jet.isPlainObject(prop)) {
				jet.each(prop, function (style, val) {
					jet.css(obj, style, val);
				});
			} else if (jet.isArray(prop)) {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					jet.each(prop, function (i, style) {
						returns[style] = jet.css(elem, style);
					});
				}
				return returns;
			} else {
				ccProp = jet.camelCase(prop);
				if (jCSSHooks[ccProp]) {
					return jCSSHooks[ccProp](obj, ccProp, value);
				}

				if (jet.isDefined(value)) {
					obj = (jet.isElement(obj)) ? [obj] : obj;
					jet.each(obj, function () {
						var setValue = '';
						if (jet.isElement(this) && jet.isDefined(this.style[ccProp])) {
							if (jet.isFunction(value)) {
								setValue = value.call(this, this.style[ccProp]);
							} else {
								setValue = value;
							}
							this.style[ccProp] = setValue;
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.isElement(elem)) {
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

		// - .toggleClass(prop) mirroring jet.toggleClass(@obj, prop)
		// Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be toggled for each element in the matched set.
		// @return {jObject}
		// - 
		toggleClass: function (obj, prop) {
			var classList = [];

			jet.each(obj, function (i, elem) {
				if (jet.isElement(elem)) {
					if (jet.isString(prop)) {
						classList = jet.trim(prop).split(' ');
					}
	
					jet.each(classList, function () {
						if (!jet.hasClass(elem, this)) {
							jet.addClass(elem, this);
						} else {
							jet.removeClass(elem, this);
						}
					});

					if (!elem.className) {
						elem.removeAttribute('class');
					}
				}
			});
			return this;
		},

		// - .addClass(prop) mirroring jet.addClass(@obj, prop)
		// Add one or more classes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be added for each element in the matched set.
		// @return {jObject}
		// - 
		addClass: function (obj, prop) {
			var classList = [];

			jet.each(obj, function (i, elem) {
				var elemClass = [];
				if (jet.isElement(elem)) {
					if (jet.isString(prop)) {
						classList = jet.trim(prop).split(' ');
					} else if (jet.isArray(prop)) {
						classList = prop;
					}

					jet.each(classList, function () {
						if (!jet.hasClass(elem, this)) {
							elem.className += (elem.className) ? ' ' + this : this;
						}
					});
				}
			});
			return this;
		},

		// - .removeClass(prop) mirroring jet.removeClass(@obj, prop)
		// Remove one or more classes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} prop One or more class names (separated by spaces) to be removed for each element in the matched set.
		// @return {jObject}
		// - 
		removeClass: function (obj, prop) {
			var classList = [];

			jet.each(obj, function (i, elem) {
				if (jet.isElement(elem)) {
					if (jet.isString(prop)) {
						classList = jet.trim(prop).split(' ');
					} else if (jet.isArray(prop)) {
						classList = prop;
					}
	
					if (classList.length > 0) {
						className = ' ' + jet.trim(elem.className) + ' ';
						jet.each(classList, function () {
							className = className.replace(new RegExp(' ' + this + ' '), ' ');
						});
						elem.className = jet.trim(className);
						if (!elem.className) {
							elem.removeAttribute('class');
						}
					}
				}
			});
			return this;
		},

		// - .attr(attr[, value]) mirroring jet.attr(@obj, attr[, value])
		// Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} attr The name of the attribute to set.
		// @param {String} attr The name of the attribute to get.
		// @param {Array} attr A set of attribute to get.
		// @param {Object} attr An object of attribute-value pairs to set.
		// @param {String|Number|Boolean} value The value of the attribute to set.
		// @return {jObject|String|Boolean|PlainObject}
		// - 
		attr: function (obj, attr, value) {
			var elem, returns = {};

			if (jet.isPlainObject(attr)) {
				jet.each(attr, function (attribute, val) {
					jet.attr(obj, attribute, val);
				});
			} else if (jet.isArray(attr)) {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					jet.each(attr, function (i, attribute) {
						returns[attribute] = jet.attr(elem, attribute);
					});
				}
				return returns;
			} else {
				if (jet.isDefined(value)) {
					jet.each(obj, function () {
						var setValue = '';
						if (jet.isElement(this)) {
							if (jet.isFunction(value)) {
								setValue = value.call(this, jet.attr(this, attr));
							} else {
								setValue = value;
							}

							if (this.setAttribute) {
								this.setAttribute(attr, setValue);
							} else {
								this[attrMapping[attr.toLowerCase()] || attr] = setValue;
							}
						}
					});
				} else {
					elem = obj[0] || obj;
					if (jet.isElement(elem)) {
						return (isIE) ? elem[attrMapping[attr.toLowerCase()] || attr] : elem.getAttribute(attr, 2);
					}
				}
			}
			return this;
		},

		// - .removeAttr(attr) mirroring jet.removeAttr(@obj, attr)
		// Remove one or more attributes from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} attr The name of the attribute that will be removed.
		// @return {jObject}
		// - 
		removeAttr: function (obj, attr) {
			jet.each(obj, function () {
				if (jet.isElement(this)) {
					this.removeAttribute(attr);
				}
			});
			return this;
			
		},

		// - .html([value]) mirroring jet.html(@obj[, value])
		// Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} value The content of the element to set.
		// @param {Function} value A function returning the value to set.
		// @return {jObject}
		// - 
		html: function (obj, value) {
			var elem;
			if (jet.isDefined(value)) {
				jet.each(obj, function () {
					var setValue = '';
					if (jet.isFunction(value)) {
						setValue = value.call(this, this.innerHTML);
					} else {
						setValue = value;
					}

					this.innerHTML = setValue;
				});
				return this;
			} else {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					return elem.innerHTML;
				}
				return '';
			}
		},

		// - .bind(event, callback) mirroring jet.bind(@obj, event, callback)
		// Bind the callback function to specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event.
		// @param {Function} callback The callback function that will be applied.
		// @return {jObject}
		// - 
		bindEvent: function (obj, event, callback) {
			var bindMapping = {'DOMContentLoaded': 'onload'},
				evtName,
				subName,
				matches;

			event = jet.trim(event);
			if (matches = eventNameRegex.exec(event)) {
				evtName = matches[1];
				subName = matches[2];

				jet.each(obj, function () {
					if (/^(DOMContentLoaded|onload|onload)$/i.test(evtName) && (this == doc || this == win)) {
						jet.ready(callback);
					} else {
						if (jet.isElement(this) || jet.isWindow(this)) {
							if (!this.jEvent) {
								this.jEvent = {};
							}
			
							if (!this.jEvent[evtName]) {
								this.jEvent[evtName] = new jEvent();
								this.jEvent[evtName].element = this;
				
								if (this.addEventListener) {
									this.addEventListener(evtName, this.jEvent[evtName].getHandler(), false);
								} else if (obj.attachEvent) {
									this.attachEvent(bindMapping[evtName] || 'on' + evtName, this.jEvent[evtName].getHandler());
								} else {
									this[bindMapping[evtName] || 'on' + evtName] = this.jEvent[evtName].getHandler();
								}
							}

							this.jEvent[evtName].add(subName, callback);
						}
					}
				});
			}

			return this;
		},

		// - .unbind(event) mirroring jet.unbind(@obj, event)
		// Unbind the specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event to unbind.
		// @return {jObject}
		// - 
		unbindEvent: function (obj, event) {
			var evtName, subName;

			event = jet.trim(event);
			if (matches = eventNameRegex.exec(event)) {
				evtName = matches[1];
				subName = matches[2];
				jet.each(obj, function () {
					if (jet.isElement(this) || jet.isWindow(this)) {
						if (this.jEvent && this.jEvent[evtName]) {
							this.jEvent[evtName].remove(subName);
							if (jet.isEmpty(this.jEvent[evtName])) {
								if (this.removeEventListener) {
									this.removeEventListener(evtName, function (e) {
										return e.preventDefault();
									}, false);
								} else if (obj.detachevent) {
									this.detachevent(bindMapping[evtName] || 'on' + evtName, function (e) {
										return e.preventDefault();
									});
								} else {
									this[bindMapping[evtName] || 'on' + evtName] = function (e) {
										return e.preventDefault();
									};
								}
								delete this.jEvent[evtName];
							}
						}
					}
				});
			}

			return this;
		},

		// - .trigger(event) mirroring jet.trigger(@obj, event)
		// Fire the specifed event in every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} event The name of the event to fire.
		// @return {jObject}
		// - 
		trigger: function (obj, event) {
			var bindMapping = {'DOMContentLoaded': 'onload'}, e;

			jet.each(obj, function () {
				if (doc.createEvent) {
					if (/(mouse.+)|((un)?click)/i.test(event)) {
						e = doc.createEvent('MouseEvents');
					} else {
						e = doc.createEvent('HTMLEvents');
					}
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

		// - .is(selector) mirroring jet.is(@obj, selector)
		// Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {Boolean}
		// - 
		is: function (obj, selector) {
			var result = true;

			if (jet.isCollection(selector)) {
				jet.each(obj, function () {
					if (jet.isElement(this) && result) {
						if (!jet.inArray(selector, this)) {
							result = false;
						}
					}
				});
			} else if (jet.isFunction(selector)) {
				jet.each(obj, function () {
					if (result) {
						if (!selector.call(this)) {
							result = false;
						}
					}
				});
			} else {
				obj = [obj];
				return !!jet(selector).filter(function () {
					if (jet.inArray(obj, this)) {
						return true;
					}
					return false;
				}).length;
			}
			return result;
		},

		// - .value(value) mirroring jet.value(@obj, value)
		// Get the current value of the first element in the set of matched elements or set the value of every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The value to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jObject|String}
		// - 
		value: function (obj, value) {
			var ref = this, elem;

			if (jet.isDefined(value)) {
				jet.each(obj, function () {
					var setValue, hook;
	
					hook = jValueHooks[this.type] || jValueHooks[jCore.nodeName(this)];
					if (hook) {
						hook.call(ref, this, value);
					} else {
						if (jCore.isFunction(value)) {
							setValue = value.call(this.value);
						} else {
							setValue = value;
						}

						if (jet.isDefined(this.value)) {
							this.value = setValue;
						}
					}
				});
				return this;
			} else {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					hook = jValueHooks[elem.type] || jValueHooks[jCore.nodeName(elem)];
					if (hook) {
						return hook.call(ref, elem, value);
					}
					return obj.value;
				}
				return '';
			}
		},

		// - .text(value) mirroring jet.text(@obj, value)
		// Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @param {String} selector The string of content to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jObject|String}
		// - 
		text: function (obj, value) {
			if (jet.isDefined(value)) {
				jet.each(obj, function () {
					var setValue;

					if (jCore.isFunction(value)) {
						setValue = value.call(this.value);
					} else {
						setValue = value;
					}

					this.innerText = setValue;
				});
			} else {
				elem = obj[0] || obj;
				if (jet.isElement(elem)) {
					return elem.innerText;
				}
				return '';
			}
		},

		// - .detach() mirroring jet.detach(@obj)
		// Remove the set of matched elements from the DOM.
		// @param {Object} obj The set of elements, it can be array, array-like object or specified DOM element.
		// @return {jObject}
		// - 
		detach: function (obj) {
			jet.each(obj, function () {
				if (this.parentNode) {
					this.parentNode.removeChild(this);
				}
			});
			return this;
		}
	}, true);

	// Install Mirroring Plugin (First Element)
	jet.install({
		// - .sibling(type) mirroring jet.sibling(@obj, type)
		// Get the previous or next sibling element from the first element of the set of matched elements.
		// @param {DOMElement} obj The point of element to get the sibling element.
		// @param {String} type The string of the sibling type, in 'previous' or 'next'.
		// @return {jObject}
		// - 
		sibling: function (obj, type) {
			var direction = type + 'Sibling',
				elementDirection = type + 'ElementSibling';

			if (!obj) return null;

			if (obj[elementDirection]) {
				return obj[elementDirection];
			} else if (obj[direction]) {
				while (obj = obj[direction]) {
					if (jCore.isElement(obj)) {
						return obj;
					}
				}
			}
			
			return null;
		},

		// - .hasClass(classNameList) mirroring jet.hasClass(@obj, classNameList)
		// Check the first element of the set of matched elements has included one or more classes.
		// @param {DOMElement} obj The element to check the class.
		// @param {Array} classNameList A list of class.
		// @return {Boolean}
		// - 
		hasClass: function (obj, classNameList) {
			var elemClass, index = 0, className;
			if (jet.isString(classNameList)) {
				classNameList = [classNameList];
			} else if (classNameList.length == 0) {
				return true;
			}

			if (!jet.isElement(obj)) {
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

		// - .isActive() mirroring jet.isActive(@obj)
		// Check the first element of the set of matched elements is active (focus) in current document.
		// @param {DOMElement} obj The element to check.
		// @return {Boolean}
		// - 
		isActive: function (obj) {
			if (!obj || !jet.isElement(obj)) return false;
			if (doc.activeElement == obj) {
				return true;
			}
			return false;
		},

		// - .getUnit(prop) mirroring jet.getUnit(@obj, prop)
		// Get the CSS value in jUnit object from the first element's position of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @param {String} prop The name of style to get.
		// @return {jUnit}
		// - 
		getUnit: function (obj, prop) {
			var unitObj = new jUnit();
			if (!obj || !jet.isElement(obj)) return unitObj;

			unitObj.setBase(obj, prop);

			return unitObj;
		},

		// - .offset() mirroring jet.offset(@obj)
		// Get the first element's position of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @param {String} prop The name of style to get.
		// @return {PlainObject}
		// - 
		offset: function (obj) {
			var offset = {left: 0, top: 0}, elem, bRect, eRect;

			if (jet.isElement(obj)) {
				if (!obj.getBoundingClientRect) {
					bRect = doc.body.getBoundingClientRect();
					eRect = obj.getBoundingClientRect();
    				offset.top = eRect.top - bRect.top;
    				offset.left = eRect.left - bRect.left;
				} else {
					elem = obj;
					while (jet.isDefined(elem.offsetLeft) && jet.isDefined(elem.offsetTop)) {
					    offset.left += elem.offsetLeft;
					    offset.top += elem.offsetTop;
					    elem = elem.parentNode;
					}
				}
			}

			return offset;
		},

		// - .height([value]) mirroring jet.height(@obj[, value])
		// Get the first element's height of the set of matched elements or set the height for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of height to set.
		// @return {jObject|Number}
		// - 
		height: function (obj, value) {
			var body = doc.getElementsByTagName('body')[0], returnValue = 0, setValue;
			if (!jet.isDefined(obj) || !jet.isElement(obj)) {
				obj = win;
			}

			if (jet.isDefined(value)) {
				if (obj != win && obj != doc && obj != body) {
					if (jet.isFunction(value)) {
						setValue = value.call(obj, jet.css(obj, 'height'));
					} else {
						setValue = value;
					}
					setValue += 'px';

					jet.css(obj, 'height', setValue);
				}
				return this;
			} else {
				if (obj == win) {
					return parseInt(win.innerHeight);
				} else if (obj == doc || obj == body) {
					returnValue = doc.documentElement.clientHeight || jet('body').css('clientHeight');
					returnValue = parseInt(value);
					return returnValue;
				} else {
					returnValue = parseInt(jet.css(obj, 'height'));
					return returnValue;
				}
			}
		},

		// - .innerHeight() mirroring jet.innerHeight(@obj)
		// Get the first element's height without border, padding and margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		innerHeight: function (obj) {
			if (!jet.isElement(obj)) {
				return 0;
			}

			return parseInt(jet.css(obj, 'height')) + parseInt(jet.css(obj, 'padding-top')) + parseInt(jet.css(obj, 'padding-bottom'));
		},

		// - .outerHeight() mirroring jet.outerHeight(@obj)
		// Get the first element's height with padding and border, even include the margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		outerHeight: function (obj, includeMargin) {
			var value;
			if (!jet.isElement(obj)) {
				return 0;
			}
			includeMargin = (includeMargin) ? true : false;

			value = parseInt(jet.css(obj, 'height')) + parseInt(jet.css(obj, 'padding-top')) + parseInt(jet.css(obj, 'padding-bottom')) + parseInt(jet.css(obj, 'border-top')) + parseInt(jet.css(obj, 'border-bottom'));
			if (includeMargin) {
				value += (parseInt(jet.css(obj, 'margin-top')) + parseInt(jet.css(obj, 'margin-bottom')));
			}
			return value;
		},

		// - .width([value]) mirroring jet.width(@obj[, value])
		// Get the first element's width of the set of matched elements or set the width for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of width to set.
		// @return {jObject|Number}
		// - 
		width: function (obj, value) {
			var body = doc.getElementsByTagName('body')[0], returnValue = 0, setValue;
			if (!jet.isDefined(obj) || !jet.isElement(obj)) {
				obj = win;
			}

			if (jet.isDefined(value)) {
				if (obj != win && obj != doc && obj != body) {
					if (jet.isFunction(value)) {
						setValue = value.call(obj, jet.css(obj, 'width'));
					} else {
						setValue = value;
					}
					setValue += 'px';

					jet.css(obj, 'width', setValue);
				}
				return this;
			} else {
				if (obj == win) {
					return parseInt(win.innerWidth);
				} else if (obj == doc || obj == body) {
					returnValue = doc.documentElement.clientWidth || jet('body').css('clientWidth');
					returnValue = parseInt(value);
					return returnValue;
				} else {
					returnValue = parseInt(jet.css(obj, 'width'));
					return returnValue;
				}
			}
		},

		// - .innerWidth() mirroring jet.innerWidth(@obj)
		// Get the first element's width without border, padding and margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		innerWidth: function (obj) {
			if (!jet.isElement(obj)) {
				return 0;
			}

			return parseInt(jet.css(obj, 'width')) + parseInt(jet.css(obj, 'padding-left')) + parseInt(jet.css(obj, 'padding-right'));
		},

		// - .outerWidth() mirroring jet.outerWidth(@obj)
		// Get the first element's width with padding and border, even include the margin of the set of matched elements.
		// @param {DOMElement} obj The element to get.
		// @return {Number}
		// - 
		outerWidth: function (obj, includeMargin) {
			var value;
			if (!jet.isElement(obj)) {
				return 0;
			}
			includeMargin = (includeMargin) ? true : false;

			value = parseInt(jet.css(obj, 'width')) + parseInt(jet.css(obj, 'padding-left')) + parseInt(jet.css(obj, 'padding-right')) + parseInt(jet.css(obj, 'border-left')) + parseInt(jet.css(obj, 'border-right'));
			if (includeMargin) {
				value += (parseInt(jet.css(obj, 'margin-left')) + parseInt(jet.css(obj, 'margin-right')));
			}
			return value;
		},

		// - .parent([selector]) mirroring jet.parent(@obj[, selector])
		// Get the parent element from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		parent: function (obj, selector) {
			var parent = obj.parentNode;
			if (!obj) return null;

			return (parent && parent.nodeType !== 11 && (!selector || jet.is(parent, selector))) ? jet(parent) : jet();
		},

		// - .parents([selector]) mirroring jet.parents(@obj[, selector])
		// Get the ancestors from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		parents: function (obj, selector) {
			var elements = [], elem;
			if (!obj) return null;

			elem = obj;
			while (elem = elem.parentNode) {
				if (!parent && parent.nodeType == 11) {
					break;
				}

				if (!selector || jet.is(elem, selector)) {
					elements.push(elem);
				}
			}
			return jet(elements);
		},

		// - .childs([selector]) mirroring jet.childs(@obj[, selector])
		// Get the child elements from first element of the set of matched element, optionally filtered by a selector.
		// @param {DOMElement} obj The point element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jObject}
		// - 
		childs: function (obj, selector) {
			var elements = [], elem;
			if (!obj) return null;

			elem = obj.childNodes[0];
			while (elem = jet.sibling(elem, 'next')) {
				if (!selector || jet.is(elem, selector)) {
					elements.push(elem);
				}
			}

			return jet(elements);
		},

		// - .scrollTop([value]) mirroring jet.scrollTop(@obj[, value])
		// Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of scroll top to set.
		// @return {jObject|Number}
		// - 
		scrollTop: function (obj, value) {
			var y = 0;

			if (jet.isDefined(value)) {
				value = parseInt(value);
				win.scrollTo(jet.scrollLeft(obj), value);
				return this;
			} else {
				if (jCore.nodeName(obj, 'body')) {
					y = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
				} else if (jet.isElement(obj)) {
					y = obj.scrollTop || 0;
				}
	
				return y;
			}
		},

		// - .scrollLeft([value]) mirroring jet.scrollLeft(@obj[, value])
		// Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.
		// @param {DOMElement} obj The element to get.
		// @param {Number} value The value of scroll left to set.
		// @return {jObject|Number}
		// - 
		scrollLeft: function (obj, value) {
			var x = 0;

			if (jet.isDefined(value)) {
				value = parseInt(value);
				win.scrollTo(value, jet.scrollTop(obj));
				return this;
			} else {
				if (jCore.nodeName(obj, 'body')) {
					x = doc.documentElement.scrollLeft || doc.body.scrollLeft || 0;
				} else if (jet.isElement(obj)) {
					x = obj.scrollLeft || 0;
				}

				return x;
			}
		},

		// - .scrollTo(x, y) mirroring jet.scrollTo(@obj, x, y)
		// Scroll every matched element to specified position.
		// @param {DOMElement} obj The element to get.
		// @param {Number} x The value of scroll left to set.
		// @param {Number} y The value of scroll top to set.
		// @return {jObject}
		// - 
		scrollTo: function (obj, x, y) {
			var elem;

			if (!jet.isElement(obj)) {
				return this;
			}

			if (x.constructor === jObject) {
				elem = x[0];
				x = jet.offset(elem).x;
				y = jet.offset(elem).y;
			} else if (jet.isElement(x)) {
				elem = x;
				x = jet.offset(elem).x;
				y = jet.offset(elem).y;
			}

			x = parseInt(x);
			y = parseInt(y);

			if (jet.isFunction(obj.scrollTo)) {
				obj.scrollTo(x, y);
			}
			return this;
		},

		// - .handler(event) mirroring jet.handler(@obj, event)
		// Get the first element's event callback function of the set of matched elements
		// @param {DOMElement} obj The element to get.
		// @param {String} event The name of event to get.
		// @return {Function}
		// - 
		handler: function (obj, event) {
			var bindMapping = {'DOMContentLoaded': 'onload'};
			return obj[bindMapping[event] || 'on' + event] || obj[event];
		},

		// - .serialize() mirroring jet.serialize(@obj)
		// Encode a set of form elements as a string for submission.
		// @return {String}
		// - 
		serialize: function (obj) {
			if (jCore.nodeName(obj, 'form') && obj.elements) {
				return jet.buildQueryString(jet(obj.elements).filter(function () {
					if (submitNameRegex.test(this.tagName) && !submitTypeRegex.test(this.type) && !jet.is(this, ':disabled') && (!checkableRegex.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).walk(function (i, elem) {
					var value = jet(this).value();
					if (jet.isArray(value)) {
						return jet.walk(value, function () {
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
		get: function (selector, baseElements) {
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

			if (jet.isDefined(baseElements)) {
				if (jet.isElement(baseElements)) {
					elements = [baseElements];
				} else if (jet.IsCollection(baseElements)) {
					elements = baseElements;
				}
			}
			selector = jCore.selectorSpecialChar(selector);

			try {
				if (jet.trim(selector) === 'body') {
					jObj.add(doc.body);
				} else {
					if (elements.length > 0) {
						for (index = 0, length = elements.length; index < length; index++) {
							elem = elements[index].querySelectorAll(selector);
							for (eIndex = 0, eLength = elem.length; eIndex < eLength; eIndex++) {
								jObj.add(elem[eIndex]);
							}
						}
					} else {
						elements = doc.querySelectorAll(selector);
						if (elements.length > 0) {
							for (index = 0, length = elements.length; index < length; index++) {
								jObj.add(elements[index]);
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
								while ((elem = jet.sibling(elem, 'next'))) {
									if (elem.walked) break;
									if (jCore.match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
								}
							} else if (sibling === '+') { 
								elem = tmpElements[index];
								while ((elem = jet.sibling(elem, 'next'))) {
									if (elem.walked) break;
									if (jCore.match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
		
									break;
								}
							} else if (sibling === '>') {
								elem = jet.childAt(tmpElements[index], 'first');
		
								do {
									if (!elem || elem.walked) break;
									if (jCore.match(elem, selectorSetting)) {
										elements.push(elem);
										elem.walked = true;
									}
								} while (elem && (elem = jet.sibling(elem, 'next')));
							}
						} else {
							// Normal Element Finder
							if (selectorSetting.type == '#') {
								elem = doc.getElementById(selectorSetting.tag);
								if (elem && (tmpElements[index] === doc || jet.comparePosition(tmpElements[index], elem) === 20)) {
									if (jet.hasClass(elem, selectorSetting.classes)) {
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
									if (jet.hasClass(elem[eIndex], selectorSetting.classes)) {
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
				
								value = jet.attr(tmpElements[index], attributeSetting.attribute);
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
									if (!jet.sibling(elem, 'next') && !jet.sibling(elem, 'previous')) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'first-child') {
								while ((elem = tmpElements[eIndex++])) {
									if (jet.childAt(elem.parentNode, 'first') === elem) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'last-child') {
								while ((elem = tmpElements[eIndex++])) {
									if (jet.childAt(elem.parentNode, 'last') === elem) {
										elements.push(elem);
									}
								}
							} else if (movementSettingting.type === 'not') {
								while ((elem = tmpElements[eIndex++])) {
									if (movementSettingting.value.substring(0, 1) === '.') {
										if (!jet.hasClass(elem, [movementSettingting.value.substring(1)])) {
											elements.push(elem);
										}
									} else if (movementSettingting.value.substring(0, 1) === '#') {
										if (elem.id !== movementSettingting.value.substring(1)) {
											elements.push(elem);
										}
									} else {
										if (jCore.nodeName(elem, movementSettingting.value)) {
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
										elem = jet.childAt(prevEle, movement[0]);
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
											elem = jet.sibling(elem, movement[1]);
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
	
					sibling = (jet.trim(blocks[8]) != ',') ? jet.trim(blocks[8]) : '';
					if (blocks[8].indexOf(',') != -1) {
						for (index = 0, length = elements.length; index < length; index++) {
							if (!elements[index].added) {
								jObj.add(elements[index]);
								elements[index].added = true;
							}
						}
						elements = [doc];
					}
				}
	
				if (elements.length > 0) {
					for (index = 0, length = elements.length; index < length; index++) {
						if (!jet.isDefined(elements[index].added) || !elements[index].added) {
							jObj.add(elements[index]);
						}
					}
				}
			}

			jObj.finalize();
			return jObj;
		}
	};

	// jet Color Object
	jColor = function () {
		
	};

	jCore.extend(jColor.prototype, {
		R: 0,
		G: 0,
		B: 0,
		A: 255,

		set: function (value) {
			var matches;
			if (jet.isString(value)) {
				if (matches = hexRegex.exec(jet.trim(value))) {
					this.r = parseInt(matches[1], 16);
					this.g = parseInt(matches[2], 16);
					this.b = parseInt(matches[3], 16);
					if (matches[4]) {
						this.a = parseInt(matches[4], 16);
					}
				} else if (matches = colorRegex.exec(jet.trim(value))) {
					this.r = parseInt(matches[1], 10);
					this.g = parseInt(matches[2], 10);
					this.b = parseInt(matches[3], 10);
				}
			}

			return this;
		},

		subtract: function (value) {
			var color = new jColor();
			color.set(value);
			this.r -= color.r;
			if (this.r <= 0) this.r = 0;
			this.g -= color.g;
			if (this.g <= 0) this.g = 0;
			this.b -= color.b;
			if (this.b <= 0) this.b = 0;
			this.a -= (255 - color.a);
			if (this.a <= 0) this.a = 0;

			return this;
		},

		mix: function (value) {
			var color = new jColor();
			color.set(value);
			this.r += color.r;
			if (this.r > 255) this.r = 255;
			this.g += color.g;
			if (this.g > 255) this.g = 255;
			this.b += color.b;
			if (this.b > 255) this.b = 255;
			this.a += (255 - color.a);
			if (this.a > 255) this.a = 255;

			return this;
		},

		diff: function (value, percentage) {
			var color = new jColor();
			color.set(value);

			percentage = parseFloat(percentage);
			percentage = (percentage > 1) ? 1 : percentage;

			if (this.r > color.r) {
				color.r = this.r - Math.ceil((this.r - color.r) * percentage);
			} else {
				color.r = this.r + Math.ceil((color.r - this.r) * percentage);
			}

			if (this.g > color.g) {
				color.g = this.g - Math.ceil((this.g - color.g) * percentage);
			} else {
				color.g = this.g + Math.ceil((color.g - this.g) * percentage);
			}
			
			if (this.b > color.b) {
				color.b = this.b - Math.ceil((this.b - color.b) * percentage);
			} else {
				color.b = this.b + Math.ceil((color.b - this.b) * percentage);
			}
			
			return color;
		},

		toHex: function () {
			return '#' + (this.r < 16 ? '0' + this.r.toString(16) : this.r.toString(16)) +
			(this.g < 16 ? '0' + this.g.toString(16) : this.g.toString(16)) +
			(this.b < 16 ? '0' + this.b.toString(16) : this.b.toString(16));
		},

		toFullHex: function () {
			return '#' + (this.r < 16 ? '0' + this.r.toString(16) : this.r.toString(16)) +
			(this.g < 16 ? '0' + this.g.toString(16) : this.g.toString(16)) +
			(this.b < 16 ? '0' + this.b.toString(16) : this.b.toString(16)) +
			(this.a < 16 ? '0' + this.a.toString(16) : this.a.toString(16));
		}
	});

	// jet Unit
	jUnit = function () {

	};

	jCore.extend(jUnit.prototype, {
		isColor: false,
		colorObj: null,
		diff: null,
		pixel: null,
		prop: '',
		parentPx: null,
		hasUnit: false,

		convertToPx: function (value, unit, parent) {
			if (this.isColor) {
				return 0;
			}
			value = parseFloat(value);

			switch (unit) {
				case '%':
					if (!jet.isDefined(parent)) return 0;
					return parent * (value / 100);
				case 'em':
					if (!jet.isDefined(parent)) return 0;
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

		convertToUnit: function (unit) {
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

		setBase: function (obj, prop) {
			var propValue, parentEle, matches, color;

			if (jet.isElement(obj)) {
				this.prop = prop;
				propValue = jet.css(obj, prop);

				if (jUnitHooks[this.prop] && jUnitHooks[this.prop].setBase) {
					return jUnitHooks[this.prop].setBase.call(this, propValue, obj);
				}

				if (colorRegex.test(propValue) || hexRegex.test(propValue)) {
					// Is Color value
					this.isColor = true;
					color = new jColor();
					color.set(propValue);
					this.colorObj = color;
				} else if (jet.isDefined(propValue)) {
					// Obtain parent element's prop value in pixel
					parentEle = jet(obj).parent();
					if (jet.isDefined(parentEle)) {
						if ((matches = unitRegex.exec(parentEle.css(prop))) !== null) {
							this.parentPx = parseInt(matches[1]);
						}
					}

					if ((matches = unitRegex.exec(propValue)) !== null) {
						if (matches[2]) {
							this.hasUnit = true;
							this.pixel = this.convertToPx(matches[1], matches[2].toLowerCase(), this.parentPx);
						} else {
							this.pixel = parseFloat(matches[1]);
						}
					}
				}
			}

			return this;
		},

		calculateDiff: function (value) {
			var val;
			if (jUnitHooks[this.prop] && jUnitHooks[this.prop].calculateDiff) {
				return jUnitHooks[this.prop].calculateDiff.call(this, value);
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
								val = this.convertToUnit(matches[2]);
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

		take: function (percentage) {
			if (jUnitHooks[this.prop] && jUnitHooks[this.prop].take) {
				return jUnitHooks[this.prop].take.call(this, percentage);
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

	jAnimate.easing = {
		linear: function(percent) {
			return percent;
		},

		onswing: function(percent) {
			return 0.5 - Math.cos(percent * Math.pI) / 2;
		},

		easingIn: function (percent) {
			return (1 - (Math.cos((percent / 2) * Math.pI)));
		},

		easingOut: function (percent) {
			return (Math.cos(((1 - percent) / 2) * Math.pI));
		}
	};

	jAnimate.environmentFPS = 60;
	jAnimate.speed = 1;
	jAnimate.acceptedProp = /^scroll(Left|Top)|width|height|left|top|right|bottom|opacity|fontSize|color|backgroundColor|border((Left|Right|Top|Bottom)?Width)|lineHeight|padding(Left|Right|Top|Bottom)?|margin(Left|Right|Top|Bottom)?$/;
	jAnimate.getPitch = function () {
		return Math.ceil(1000 / (jAnimate.environmentFPS * jAnimate.speed)) || 1;
	};
	jAnimate.getFrames = function (duration) {
		return Math.ceil(duration / (1000 / jAnimate.environmentFPS));
	};
	jAnimate.getPercentage = function (max, frame) {
		if (max == 0) return 1;
		return frame / max;
	};
	jAnimate.setSpeed = function (value) {
		jAnimate.speed = parseFloat(value);
		if (jAnimate.speed <= 0) {
			jAnimate.speed = 1;
		}
		return this;
	};

	jCore.extend(jAnimate.prototype, {
		queue: [],
		unit: {},
		onPlaying: false,
		element: null,

		init: function (obj) {
			if (jet.isElement(obj)) {
				this.element = obj;
				return true;
			}
			return false;
		},

		apply: function (prop, duration, easing, callbackObj) {
			var index, propAllowed = {}, obj;

			if (jet.isPlainObject(prop)) {
				for (index in prop) {
					if (jAnimate.acceptedProp.test(jet.camelCase(index))) {
						propAllowed[index] = prop[index];
					}
				}

				obj = {
					to: propAllowed,
					progress: 0,
					frames: jAnimate.getFrames(duration),
					step: null,
					complete: null,
					easing: easing
				};
				
				if (jet.isPlainObject(callbackObj)) {
					if (jet.isFunction(callbackObj.step)) {
						obj.step = callbackObj.step;
					}

					if (jet.isFunction(callbackObj.complete)) {
						obj.complete = callbackObj.complete;
					}
				}

				this.queue.push(obj);
			}
			return this;
		},

		wait: function (duration, callbackObj) {
			this.apply({}, duration, 'Linear', callbackObj);
			return this;
		},

		play: function () {
			var that = this;
			if (!this.onPlaying) {
				this.onPlaying = true;
				setTimeout(function () {
					var index, unit, method;

					if (that.queue.length > 0) {
						if (that.queue[0].progress == that.queue[0].frames) {
							that.queue[0].progress = 0;
							for (index in that.queue[0].to) {
								jet.css(that.element, index, that.queue[0].to[index]);
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
									that.unit[index].setBase(that.element, index);

									if (!that.unit[index].isColor) {
										that.unit[index].calculateDiff(that.queue[0].to[index]);
									}
								}
							} else {
								if (!jet.isEmpty(that.queue[0].to)) {
									for (index in that.queue[0].to) {
										if (that.unit[index].isColor) {
											jet.css(that.element, index, 
												that.diff[index].colorObj.diff(that.queue[0].to[index], jAnimate.easing[(jAnimate.easing[that.queue[0].easing]) ? that.queue[0].easing : 'linear'](
													jAnimate.getPercentage(that.queue[0].frames, that.queue[0].progress)
												)).toHex()
											);
										} else {
											jet.css(that.element, index, that.unit[index].take(
												jAnimate.easing[(jAnimate.easing[that.queue[0].easing]) ? that.queue[0].easing : 'linear'](
													jAnimate.getPercentage(that.queue[0].frames, that.queue[0].progress)
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
							setTimeout(arguments.callee, jAnimate.getPitch());
						}
					} else {
						that.onPlaying = false;
					}
				}, 1);
			}
			return this;
		},

		loop: function (value) {
			this.playback = parseInt(value);
			return this;
		},

		pause: function () {
			this.onPlaying = false;
			return this;
		},

		clear: function () {
			this.pause();
			this.quene = [];
			this.diff = {};
		}
	});

	win.jet = jet;
	win.jColor = jColor;
	win.jUnit = jUnit;
	win.jAnimate = jAnimate;

	//	register css: Hooks
	jCore.each(['scrollTop', 'scrollLeft'], function (i, css) {
		jet.registerCSSHook(css, function (obj, prop, value) {
			var setValue = 0, elem;
			if (jet.isDefined(value)) {
				jet.each(obj, function () {
					if (jet.isElement(this)) {
						if (jet.isFunction(value)) {
							setValue = value.call(this, jet.prop(this, prop));
						} else {
							setValue = value;
						}
						jet.prop(this, prop, setValue);
					}
				});
	
				return this;
			} else {
				elem = obj[0];
				if (jet.isElement(elem)) {
					return jet[jet.capitalise(prop)](elem);
				}
				return 0;
			}
		});
	});

	//	register Prop: Hooks

	//	register Value: Hooks
	jet.registerValueHook('select', function (element, value) {
		var returns = [], valueMap = {};
		if (jet.isDefined(value)) {
			if (jet.isString(value)) {
				value = [value];
			}

			if (jet.isArray(value)) {
				jet.each(value, function () {
					valueMap[this] = true;
				});

				jet.each(element.options, function () {
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
				jet.each(element.options, function () {
					if (this.selected && !this.disabled && (!jCore.nodeName(this.parentNode, 'optgroup') || !this.parentNode.disabled)) {
						returns.push(this.value);
					}
				});
				return returns;
			} else {
				return elementoptions[obj.selectedIndex].value;
			}
		}
	});

	jCore.each(['checkbox', 'radio'], function () {
		jet.registerValueHook(this, function (element, value) {
			if (jet.isDefined(value)) {
				if (jet.isString(value)) {
					value = [value];
				}
	
				element.checked = jet.inArray(value, element.value);
				return this;
			} else {
				if (element.checked) {
					if (jet.isDefined(element.getAttribute('value'))) {
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
	jCore.each(['padding', 'margin'], function () {
		jet.registerUnitHook(this, {
			take: function (percentage) {
				var ref = this, val = [];
				jet.each(this.pixel, function (i, value) {
					val[i] = (ref.pixel[i] + (ref.diff[i] * percentage)) + 'px';
				});
				return val.join(' ');
			},

			setBase: function (value, element) {
				var valueSet, ref = this;

				// IE	fix: No margin value
				if (!value) {
					valueSet = [jet.css(element, 'margin-top'), jet.css(element, 'margin-right'), jet.css(element, 'margin-bottom'), jet.css(element, 'margin-left')];
				} else {
					valueSet = value.split(' ');
				}

				this.pixel = [];
				jet.each(valueSet, function (i, propValue) {
					if ((matches = unitRegex.exec(propValue)) !== null) {
						if (matches[2]) {
							ref.pixel[i] = ref.convertToPx(parseFloat(matches[1]), matches[2].toLowerCase(), ref.parentPx);
						} else {
							ref.pixel[i] = parseFloat(matches[1]);
						}
					}
				});

				return this;
			},

			calculateDiff: function (value) {
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
				jet.each(this.pixel, function (i, propValue) {
					var targetVal = target[i];
					if ((matches = unitRegex.exec(targetVal)) !== null) {
						if (matches[2]) {
							ref.diff[i] = ref.convertToPx(parseFloat(matches[1]), matches[2].toLowerCase(), ref.parentPx) - propValue;
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
	jCore.domReady();

	if (jCore.isDefined(win.define) && jCore.isFunction(define) && define.amd) {
		define('jet', [], function() {
			return jet;
		});
	}
})();
