(function() {
	var jet, core, win = window,
		doc = window.document,
		nav = navigator,
		docElem = doc.documentElement,
		slice = Array.prototype.slice,
		objmodel = Object.prototype,
		typeCache = {},
		hasOwn = objmodel.hasOwnProperty,
		onLoadEvent = [],
		arraymodel = [],
		iframe = null,
		defaultStyles = {},
		container = doc.createElement('div'),
		regex = {
			selector: /(([\.#])?([a-z0-9_\-]+|\*)([#\.][^\s#,\.]+)*((?:\[[^:]*\]|:[a-z\-]+(\([^\)]+\))?)+)*(\s*[+>~]\s*|\s*,?\s*))+?/gi,
			subAttr: /([#\.])([^#\.]+)/gi,
			attribute: /\[([a-z_]+)(([~!\|\^$\*]?)=((\"(.*)\")|(\'(.*)\')|([0-9a-z_\-]*)))?\]/gi,
			pseudo: /:([a-z\-]+)(\(([^\)]+)\))?/gi,
			nth: /nth(-(last))?-(child|of-type)/i,
			nthValue: /(-)?((([0-9]*)n)|([0-9]+))(([+\-])([0-9]+))?/i,
			submitType: /^(submit|button|image|reset|file)$/i,
			submitName: /^(input|select|textarea|keygen)$/i,
			checkable: /^(checkbox|radio)$/i,
			eventname: /^(\w*)(\.([\w_\-]+))?$/i,
			unit: /(-?[0-9\.]+)\s*([a-z%]*)/i,
			colorRegex: /rgb\(([0-9]+),\s*([0-9]+),\s*([0-9]+)\)/i,
			hexRegex: /([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})?/i,
			type: /\[object ([a-z]+)\]/i,
			timestamp: /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(\+[0-9]{2}:[0-9]{2}|Z)?/,
			dateformat: /([y]{1,4}|[M]{1,4}|[d]{1,4}|hh|h|HH|H|mm|m|ss|s|tt|t|f|q)/g
		},
		attrmap = {
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
		propmap = {
			'for': 'htmlFor',
			'class': 'className'
		},
		bindmap = {
			'DOMContentLoaded': 'onload'
		},
		boxAdjust = null,
		// Hooks
		jHooks = {
			css: {},
			value: {},
			prop: {},
			unit: {}
		},
		jetObject = function() {};
	jet = function(selector, context) {
		var jetObj;

		if (core.isDefined(selector)) {
			if (core.isFunction(selector)) {
				jet.ready(selector);
			} else if (core.isElement(selector) || core.isWindow(selector)) {
				jetObj = new jetObject();
				jetObj.push(selector);
				return jetObj;
			} else if (core.isString(selector)) {
				if (selector[0] === '<' && selector[selector.length - 1] === '>' && selector.length > 3) {
					return jet.shift(selector);
				} else {
					return querySelector(selector, context, new jetObject());
				}
			} else if (core.isCollection(selector)) {
				jetObj = new jetObject();
				each(selector, function () {
					jetObj.merge(jet(this));
				});
				return jetObj;
			}
		}
		return new jetObject();
	};
	// Global Function, can be called in plugin implement
	core = {
		// - core.isChrome
		// Chrome Broswer
		// @return {Boolean}
		// -
		isChrome: /Chrome/.test(nav.userAgent),
		// - core.isSafari
		// Safari Broswer
		// @return {Boolean}
		// -
		isSafari: /Apple.*Safari/.test(nav.vendor),
		// - core.isOpera
		// Opera Broswer
		// @return {Boolean}
		// -
		isOpera: !! win.opera || nav.userAgent.indexOf(' OPR/') >= 0,
		// - core.isFirefox
		// Firefox Broswer
		// @return {Boolean}
		// -
		isFirefox: /Firefox/.test(nav.userAgent),
		// - core.isIE
		// IE Broswer
		// @return {Boolean}
		// -
		isIE: /MSIE/.test(nav.userAgent),
		// - core.getType(object)
		// Return the type of object 
		// @param {Object} obj The object for getTypeion.
		// @return {String} Returns the object type.
		// -
		getType: function(object) {
			var name = objmodel.toString.call(object),
				type;
			if (!typeCache[name]) {
				type = name.split(' ')[1];
				typeCache[name] = type.substring(0, type.length - 1).toLowerCase();
			}
			return typeCache[name];
		},
		// - core.isDefined([arguments, ...])
		// Check to see if one or more object is defined. 
		// @return {Boolean}
		// - 
		isDefined: function() {
			return walk(arguments, function(object) {
				return (typeof object !== 'undefined');
			});
		},
		// - core.isWalkable([arguments, ...])
		// Check to see if one or more object can be Iterated. 
		// @return {Boolean}
		// -
		isWalkable: function() {
			return walk(arguments, function(object) {
				return (this.isCollection(object) || this.isPlainObject(object));
			});
		},
		// - core.isJetObject([arguments, ...])
		// Check to see if one or more object is a jet object. 
		// @return {Boolean}
		// -
		isJetObject: function() {
			return walk(arguments, function(object) {
				return (this.isDefined(object) && object.constructor === jetObject);
			});
		},
		// - core.isCollection([arguments, ...])
		// Check to see if one or more object is a collection or an array. 
		// @return {Boolean}
		// -
		isCollection: function() {
			return walk(arguments, function(object) {
				return (this.isDefined(object) && (this.isArray(object) || this.isJetObject(object) || (this.isNumeric(object.length) && this.isFunction(object.item))));
			});
		},
		// - core.isElement([arguments, ...])
		// Check to see if one or more object is an element object. 
		// @return {Boolean}
		// - 
		isElement: function() {
			return walk(arguments, function(object) {
				return (this.isDefined(object) && (object.nodeType === 1 || object.nodeType === 9));
			});
		},
		// - core.isArray([arguments, ...])
		// Check to see if one or more object is an array. 
		// @return {Boolean}
		// - 
		isArray: function() {
			return walk(arguments, function(object) {
				return (this.getType(object) === 'array');
			});
		},
		// - core.isObject([arguments, ...])
		// Check to see if one or more object is an object. 
		// @return {Boolean}
		// - 
		isObject: function() {
			return walk(arguments, function(object) {
				return (this.getType(object) === 'object');
			});
		},
		// - core.isFunction([arguments, ...])
		// Check to see if one or more object is a callback function. 
		// @return {Boolean}
		// - 
		isFunction: function() {
			return walk(arguments, function(object) {
				return (this.getType(object) === 'function');
			});
		},
		// - core.isString([arguments, ...])
		// Check to see if one or more object is a string. 
		// @return {Boolean}
		// - 
		isString: function() {
			return walk(arguments, function(object) {
				return (this.getType(object) === 'string');
			});
		},
		// - core.isNumeric([arguments, ...])
		// Check to see if one or more object is a number. 
		// @return {Boolean}
		// - 
		isNumeric: function() {
			return walk(arguments, function(object) {
				return (this.getType(object) === 'number');
			});
		},
		// - core.isPlainObject([arguments, ...])
		// Check to see if one or more object is a plain object (created using "{}" or "new Object").
		// @return {Boolean}
		// - 
		isPlainObject: function() {
			return walk(arguments, function(object) {
				if (!this.isDefined(object) || (object.constructor && !hasOwn.call(object.constructor.prototype, 'isPrototypeOf'))) {
					return false;
				}
				return true;
			});
		},
		// - core.isDocument([arguments, ...])
		// Check to see if one or more object is a document node.
		// @return {Boolean}
		// - 
		isDocument: function() {
			return walk(arguments, function(object) {
				return (this.isDefined(object) && object.nodeType === 9);
			});
		},
		// - core.isEmpty([arguments, ...])
		// Check to see if one or more object or array is empty.
		// @param {Object} obj The object that will be checked to see if it's empty.
		// @return {Boolean}
		// - 
		isEmpty: function() {
			return walk(arguments, function(object) {
				if (object === null || !core.isDefined(object) || object.length === 0) return true;
				if (object.length > 0) return false;
				for (var key in object) {
					if (hasOwn.call(object, key)) return false;
				}
				return true;
			});
		},
		// - core.isWindow([arguments, ...])
		// Check to see if one or more object is a window object.
		// @return {Boolean}
		// @added 1.0.2-Beta
		// - 
		isWindow: function() {
			return walk(arguments, function(object) {
				return this.isDefined(object, object.setInterval) && this.isFunction(object.setInterval);
			});
		},
		// - core.hasClass(element, list)
		// Check the element has included one or more classes.
		// @param {DOMElement} element The element to check the class.
		// @param {Array} list A list of class.
		// @return {Boolean}
		// - 
		hasClass: function(element, list) {
			var elemClass, index = 0,
				className;
			if (!this.isElement(element)) return false;
			if (this.isString(list)) {
				list = [list];
			} else if (list.length == 0) {
				return true;
			}
			className = ' ' + element.className + ' ';
			while (elemClass = list[index++]) {
				if (className.indexOf(' ' + elemClass + ' ') === -1) {
					return false;
				}
			}
			return true;
		},
		// - core.comparePosition(a, b)
		// Convert the string into jet object.
		// @param {DOMElement} a The dom element that for compare.
		// @param {DOMElement} b The dom element that will be compared with first dom element provided.
		// @return {Number}
		// - 
		comparePosition: function(a, b) {
			return a.compareDocumentPosition ? a.compareDocumentPosition(b) : a.contains ? (a != b && a.contains(b) && 16) + (a != b && b.contains(a) && 8) + (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1) : 0;
		},
		// - core.nodeName(element, compare)
		// Get or compare the element node name
		// @param {DOMElement} element The dom element to get.
		// @param {String} compare Compare with the node name
		// @return {Boolean}
		// @added 1.1.0
		// - 
		nodeName: function(element, compare) {
			if (core.isDefined(compare)) {
				return element.nodeName && element.nodeName.toLowerCase() === compare.toLowerCase();
			}
			return (element.nodeName) ? element.nodeName.toLowerCase() : '';
		},
		// - core.capitalise(text)
		// Capital the first letter of a string.
		// @param {String} text The string for capital the first letter.
		// @return {String}
		// - 
		capitalise: function(text) {
			if (core.isString(text)) {
				return text.charAt(0).toUpperCase() + text.slice(1);
			}
			return '';
		},
		// - core.camelCase(text)
		// Convert from Underscore text or Hyphen text to Camel Case one.
		// @param {String} text The string that will be converted from Underscore text or Hyphen text to Camel Case one.
		// @return {String}
		// - 
		camelCase: function(text) {
			return (text) ? text.replace(/[\-_]([\da-z])/gi, function(str, match) {
				return match.toUpperCase();
			}) : '';
		},
		// - core.inArray(items, compare)
		// Check to see if an object is included in a specified array.
		// @param {Object} items The object that will be checked to see if it's included in a specified array.
		// @param {Object} compare The object for compare.
		// @return {Boolean}
		// - 
		inArray: function(items, compare) {
			var index = 0,
				val;
			if (core.isCollection(items)) {
				while (val = items[index++]) {
					if (compare === val) {
						return true;
					}
				}
			}
			return false;
		},
		// - core.defaultStyle(tagname)
		// Check to see if an object is included in a specified array.
		// @param {String} tagname The tag name of element.
		// @return {Boolean}
		// - 
		defaultStyle: function(tagname) {
			var style = defaultStyles[tagname],
				elem, container = doc;
			if (!style) {
				iframe = (iframe || jet('<iframe frameborder="0" width="0" height="0" />')).appendTo(container.documentElement);
				container = iframe[0].contentDocument;
				container.write();
				container.close();
				elem = jet(container.createElement(tagName)).appendTo(container.body);
				style = defaultStyles[tagname] = {
					display: elem.css('display'),
					overflow: elem.css('overflow')
				};
				elem.detach();
				iframe.detach();
			}
			return style;
		},
		// - core.owner(element)
		// Get the element's owner, return document and window
		// @param {DOMElement} element The DOM element to get.
		// @return {PlainObject}
		// - 
		owner: function(element) {
			var ownerDoc = element.ownerDocument || doc;
			return {
				document: ownerDoc,
				window: ownerDoc.defaultView || ownerDoc.parentWindow
			};
		}
	};

	each('isChrome isSafari isOpera isFirefox isIE getType isDefined isWalkable isJetObject isCollection isElement isArray isObject isFunction isString isNumeric isPlainObject isDocument isEmpty isWindow'.split(' '), function() {
		jet[this] = core[this];
	});

	// - jet.each(obj, callback)
	// Seamlessly iterate each item of an array, array-like or object.
	// @param {Object} obj The object that will be checked to see if it's included in a specified array.
	// @param {Function} callback The callback function that to be executed for each item.
	// @return {jet}
	// - 

	function each(objects, callback) {
		var index, length;
		if (core.isFunction(callback)) {
			if (core.isCollection(objects)) {
				for (index = 0, length = objects.length; index < length; index++) {
					callback.call(objects[index], index, objects[index]);
				}
			} else if (core.isObject(objects)) {
				for (index in objects) {
					if (objects.hasOwnProperty(index)) {
						callback.call(objects[index], index, objects[index]);
					}
				}
			} else {
				callback.call(objects, 0, objects);
			}
		}
		return this;
	}
	jet.each = each;
	// - core.registerCSSHook(name, callback)
	// Register a Hook for jet.css()
	// @param {String} name The name of style property that will be executed by user-defined callback function.
	// @param {Function} callback The callback function thet will be executed.
	// @return {jet}
	// - 
	// - core.registerValueHook(name, callback)
	// Register a Hook for jet.value()
	// @param {String} name The name of object type or name that will be executed by user-defined callback function.
	// @param {Function} callback The callback function thet will be executed.
	// @return {jet}
	// - 
	// - core.registerPropHook(name, callback)
	// Register a Hook for jet.prop()
	// @param {String} name The name of property that will be executed by user-defined callback function.
	// @param {Function} callback The callback function thet will be executed.
	// @return {jet}
	// - 
	// - core.registerUnitHook(name, obj)
	// Register a Hook for jUnit calculation
	// @param {String} name The name of property that will be executed by user-defined callback function.
	// @param {PlainObject} obj A set of callback function.
	// @item obj:{Function} parseDiff(value) The callback function that for calculate the different between original and specified value.
	// @param {String} obj.parseDiff.value A specified value that to calculate the difference with original value.
	// @item obj:{Function} Take(percentage) Returns the original value plus the difference in percentage provided.
	// @param {Number} obj.take.percentage A number of percentage, between 0 to 1 (0% to 100%).
	// @item obj:{Function} init(value) The callback function that for setup and calculate the original value.
	// @param {String} obj.init.value A string of the original value.
	// @return {jet}
	// - 
	each({
		registerCSSHook: 'css',
		registerValueHook: 'value',
		registerPropHook: 'prop',
		registerUnitHook: 'unit'
	}, function(method, map) {
		(function(m) {
			core[method] = function(name, callback) {
				if (core.isString(name) && trim(name)) {
					if ((m === 'unit' && core.isPlainObject(callback)) || core.isFunction(callback)) {
						jHooks[m][name] = callback;
					}
				}
				return this;
			};
		})(map);
	});
	// Object clone function

	function clone(object) {
		var newObject, index, length;
		if (!core.isDefined(object) || !object) return object;
		if (object instanceof Date) {
			
		} else if (core.isDefined(object.cloneNode)) {
			return object.cloneNode(true);
		} else if (core.isObject(object) || core.isJetObject(object)) {
			newObject = {};
			for (index in object) {
				newObject[index] = clone(object[index]);
			}
			return newObject;
		} else if (core.isArray(object)) {
			newObject = [];
			for (index = 0, length = object.length; index < length; index++) {
				newObject.push(clone(object[index]));
			}
			return newObject;
		}
		return object;
	}
	// Extend global function from core to jet

	function extend(objA, objB, inherit) {
		var name = '';
		if (core.isObject(objB)) {
			for (name in objB) {
				if (!inherit || !core.isDefined(objA[name])) {
					objA[name] = clone(objB[name]);
				}
			}
		}
		return objA;
	}
	// Bind the original extend function to core for internal or plugin use
	core.extend = extend;
	// Bind the original clone function to jet
	// - jet.clone(obj)
	// Clone an object.
	// @param {Object} obj The object that will be cloned.
	// @return {Object}
	// @added 1.0.4-Beta
	// - 
	jet.clone = clone;
	// Bind jet extend function
	// - jet.extend(obj)
	// Merge the contents of the object into jet control prototype.
	// @param {Object} obj The object that will be merged into jet control.
	// @return {jet}
	// - 
	jet.extend = function(objects) {
		var name = '';
		if (core.isObject(objects)) {
			for (name in objects) {
				if (!core.isDefined(this[name])) {
					this[name] = clone(objects[name]);
				}
			}
		}
		return this;
	};
	// Bind trim function
	// - jet.trim(text)
	// Strip whitespace from the beginning and end of a string
	// @param {String} text The string that for whitespace stripping.
	// @return {String}
	// - 
	// - trim(text)
	// Strip whitespace from the beginning and end of a string
	// @param {String} text The string that for whitespace stripping.
	// @return {String}
	// - 

	function trim(text) {
		return (!core.isString(text)) ? '' : text.replace(/(^\s*)|(\s*$)/g, '');
	}
	jet.trim = trim;

	// Walk all object
	function walk(objects, callback) {
		var index = 0,
			length = objects.length;
		if (core.getType(callback) === 'function') {
			for (; index < length; index++) {
				if (!callback.call(core, objects[index])) {
					return false;
				}
			}
		}
		return true;
	}

	// Unique Element
	function unique(objects, collection) {
		var index = 0,
			elem, returns = collection || [];
		while (elem = objects[index++]) {
			if (!elem.added) {
				returns.push(elem);
				elem.added = true;
			}
		}
		index = 0;
		reset(returns);
		return returns;
	}

	// Sibling Element
	function siblingElement(object, type) {
		var direction = type + 'Sibling',
			elementDirection = type + 'ElementSibling';
		if (!object) return null;
		if (object[elementDirection]) {
			return object[elementDirection];
		} else if (object[direction]) {
			while (object = object[direction]) {
				if (core.isElement(object)) {
					return object;
				}
			}
		}
		return null;
	}
	// Child at First or Last

	function childElement(object, type) {
		var direction = (type === 'first') ? 'next' : 'previous',
			child;
		if (!object) return null;
		if (object[type + 'ElementChild']) {
			return object[type + 'ElementChild'];
		} else {
			child = object[type + 'Child'];
			if (core.isElement(child)) return child;
			return siblingElement(child, direction);
		}
	}
	// Validate Element is passed by selector setting

	function matchElement(element, selectorSetting) {
		if (selectorSetting.type === '#') {
			if (element.id !== selectorSetting.tag) {
				return false;
			}
		} else if (selectorSetting.classes.length > 0) {
			if (!core.hasClass(element, selectorSetting.classes)) {
				return false;
			}
		} else {
			if (!core.nodeName(element, selectorSetting.tag)) {
				return false;
			}
		}
		return true;
	}
	// Fix selector name or attribute start with numberic

	function selectorSpecialChar(selector) {
		selector = selector.replace(/#(\d)/, '#\\3$1 ');
		selector = selector.replace(/(\[\w+\s*=\s*)(\d)/i, '$1\\3$2 ');
		return selector.replace(/#(\d)/, '#\\3$1 ');
	}
	// Clear all added attribute

	function reset(elements) {
		each(elements, function() {
			this.added = null;
		});
	}
	// CSS Selector

	function querySelector(selector, context, collection) {
		var attributeCache = [],
			selectorSetting, blocks, matches, elements = [doc],
			elem, elemGroup = [],
			sibling = '',
			// Index and Length
			index, eIndex, length, eLength,
			// Attribute Varible
			attribute, attr, validPass = true,
			// Pseudo Varible
			pseudoSetting, movementSetting, pseudo, prevList = [],
			nodeName, movement, movementSetting = {},
			nth, position = 0,
			next = 0,
			results;
		// Get context set
		if (core.isDefined(context)) {
			elements = (core.isCollection(context)) ? context : [context];
		} else {
			elements = [doc];
		}
		selector = selectorSpecialChar(selector);
		try {
			if (trim(selector) === 'body') {
				elemGroup.push(doc.body);
			} else {
				if (elements.length > 0) {
					for (index = 0, length = elements.length; index < length; index++) {
						elem = elements[index].querySelectorAll(selector);
						if (elem.length > 0) {
							elemGroup = elemGroup.concat(slice.call(elem));
						}
					}
				} else {
					elements = doc.querySelectorAll(selector);
					if (elements.length > 0) {
						elemGroup = elemGroup.concat(slice.call(elements));
					}
				}
			}
		} catch (error) {
			while ((blocks = regex.selector.exec(selector)) !== null) { /* START: Define selector type, attribute selector, pseudo and sibling */
				selectorSetting = {
					type: (blocks[2] !== '.') ? blocks[2] : '',
					tag: (blocks[2] === '.') ? '*' : blocks[3],
					classes: (blocks[2] === '.') ? [blocks[3]] : [],
					attribute: [],
					pseudo: []
				};
				tmpElements = elements;
				elements = [];
				while ((matches = regex.subAttr.exec(blocks[4])) !== null) {
					if (matches[1] === '.') {
						selectorSetting.classes.push(matches[2]);
					} else {
						selectorSetting.attribute.push('[id=' + matches[2] + ']');
					}
				}
				while ((matches = regex.attribute.exec(blocks[5])) !== null) {
					selectorSetting.attribute.push(matches[0]);
				}
				while ((matches = regex.pseudo.exec(blocks[5])) !== null) {
					selectorSetting.pseudo.push(matches[0]);
				}
				selectorSetting.tag = selectorSetting.tag.replace(/(\.|#).*/, ''); /* END: Define selector type, attribute selector, pseudo and sibling */
				for (index = 0, length = tmpElements.length; index < length; index++) {
					// Sibling Selector
					if (sibling) {
						if (sibling === '~') {
							elem = tmpElements[index];
							while ((elem = siblingElement(elem, 'next'))) {
								if (elem.walked) break;
								if (matchElement(elem, selectorSetting)) {
									elements.push(elem);
									elem.walked = true;
								}
							}
						} else if (sibling === '+') {
							elem = tmpElements[index];
							while ((elem = siblingElement(elem, 'next'))) {
								if (elem.walked) break;
								if (matchElement(elem, selectorSetting)) {
									elements.push(elem);
									elem.walked = true;
								}
								break;
							}
						} else if (sibling === '>') {
							elem = childElement(tmpElements[index], 'first');
							do {
								if (!elem || elem.walked) break;
								if (matchElement(elem, selectorSetting)) {
									elements.push(elem);
									elem.walked = true;
								}
							} while (elem && (elem = siblingElement(elem, 'next')));
						}
					} else {
						// Normal Element Finder
						if (selectorSetting.type == '#') {
							elem = doc.getElementById(selectorSetting.tag);
							if (elem && (tmpElements[index] === doc || core.comparePosition(tmpElements[index], elem) === 20)) {
								if (core.hasClass(elem, selectorSetting.classes)) {
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
								if (core.hasClass(elem[eIndex], selectorSetting.classes)) {
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
				// Pseudo Selector
				if (selectorSetting.pseudo.length > 0) {
					index = 0;
					while ((pseudo = selectorSetting.pseudo[index++])) {
						tmpElements = elements;
						elements = [];
						matches = regex.pseudo.exec(pseudo);
						pseudoSetting = {
							type: matches[1],
							value: matches[3]
						};
						eIndex = 0;
						if (pseudoSetting.type === 'contains') {
							while ((elem = tmpElements[eIndex++])) {
								if ((elem.innerText || elem.textContent || '').indexOf(pseudoSetting.value) > -1) {
									elements.push(elem);
								}
							}
						} else if (pseudoSetting.type === 'only-child') {
							while ((elem = tmpElements[eIndex++])) {
								if (!siblingElement(elem, 'next') && !siblingElement(elem, 'previous')) {
									elements.push(elem);
								}
							}
						} else if (pseudoSetting.type === 'first-child') {
							while ((elem = tmpElements[eIndex++])) {
								if (childElement(elem.parentNode, 'first') === elem) {
									elements.push(elem);
								}
							}
						} else if (pseudoSetting.type === 'last-child') {
							while ((elem = tmpElements[eIndex++])) {
								if (childElement(elem.parentNode, 'last') === elem) {
									elements.push(elem);
								}
							}
						} else if (pseudoSetting.type === 'not') {
							while ((elem = tmpElements[eIndex++])) {
								if (pseudoSetting.value.substring(0, 1) === '.') {
									if (!core.hasClass(elem, [pseudoSetting.value.substring(1)])) {
										elements.push(elem);
									}
								} else if (pseudoSetting.value.substring(0, 1) === '#') {
									if (elem.id !== pseudoSetting.value.substring(1)) {
										elements.push(elem);
									}
								} else {
									if (core.nodeName(elem, pseudoSetting.value)) {
										elements.push(elem);
									}
								}
							}
						} else if (pseudoSetting.type.substring(0, 3) === 'nth') {
							if (pseudoSetting.value) pseudoSetting.value = pseudoSetting.value.replace(/^2n\+1$/, 'odd').replace(/^2n$/, 'even');
							nth = regex.nth.exec(pseudo);
							movement = (nth[2] === 'last') ? ['last', 'previous'] : ['first', 'next'];
							movementSetting = {
								start: 0,
								step: 1,
								limit: -1
							};
							if (pseudoSetting.value === 'n') {
								elements = tmpElements;
								continue;
							} else if (pseudoSetting.value === 'even') {
								movementSetting.start = 1;
								movementSetting.step = 2;
							} else if (pseudoSetting.value === 'odd') {
								movementSetting.start = 0;
								movementSetting.step = 2;
							} else {
								matches = pseudoSetting.value.match(regex.nthValue);
								if (!matches[3]) {
									movementSetting.start = movementSetting.limit = parseInt(matches[2]) - 1;
								} else {
									movementSetting.step = (matches[4]) ? parseInt(matches[4]) : 1;
									if (!matches[5]) {
										movementSetting.start = movementSetting.step - 1;
									} else {
										if (matches[1] === '-') {
											movementSetting.limit = (matches[8]) ? parseInt(matches[8]) - 1 : 0;
											movementSetting.start = movementSetting.limit % movementSetting.step;
										} else {
											movementSetting.start = (matches[8]) ? parseInt(matches[8]) - 1 : 0;
										}
									}
								}
							}
							while ((elem = tmpElements[eIndex++])) {
								prevEle = elem.parentNode;
								prevEle.childExists = prevEle.childExists || {};
								nodeName = elem.nodeName;
								if (!prevEle.childExists[nodeName]) {
									elem = childElement(prevEle, movement[0]);
									next = movementSetting.start;
									while (elem && (movementSetting.limit === -1 || position <= movementSetting.limit)) {
										if (!(nth[3] === 'of-type') || (elem.nodeName === nodeName)) {
											if (position === next) {
												if (elem.nodeName === nodeName) {
													elements[elements.length] = elem;
												}
												next += movementSetting.step;
											}
											position++;
										}
										elem = siblingElement(elem, movement[1]);
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
				// Attribute Selector
				if (selectorSetting.attribute.length > 0) {
					tmpElements = elements;
					elements = [];
					for (index = 0, length = tmpElements.length; index < length; index++) {
						eIndex = 0;
						validPass = true;
						while ((attr = selectorSetting.attribute[eIndex++])) {
							if (attributeCache[attr]) {
								matches = attributeCache[attr];
							} else {
								matches = regex.attribute.exec(attr);
								attributeCache[attr] = matches;
							}
							attribute = matches[6] || matches[8] || matches[9];
							value = tmpElements[index][attrmap[matches[1]] || matches[1]];
							if (!attribute && !value) {
								validPass = false;
								break;
							} else {
								if (matches[3]) {
									attrOperator = {
										'^': '^' + attribute,
										'$': attribute + '$',
										'*': attribute,
										'|': '^' + attribute + '(\\-\\w+)*$',
										'~': '\\b' + attribute + '\\b'
									};
									if (!(new RegExp(attrOperator[matches[3]])).test(value)) {
										validPass = false;
										break;
									}
								} else {
									if (value !== attribute) {
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
				sibling = (trim(blocks[7]) !== ',') ? trim(blocks[7]) : '';
				if (blocks[7].indexOf(',') !== -1) {
					elemGroup = elemGroup.concat(elements);
					elements = [doc];
				}
			}
			if (elements.length > 0) {
				elemGroup = elemGroup.concat(elements);
			}
		}
		
		results = unique(elemGroup, collection, selector);
		results.selector = selector;
		return results;
	}
	// Setup the jetObject as a prototype object
	// jet function
	jet.extend({
		version: '1.1.0',
		// - jet.noConflict()
		// Release the jet control of the jet variable.
		// @return {jet}
		// - 
		noConflict: function() {
			var _jet = win.jet;
			win.jet = null;
			return _jet;
		},
		// - jet.ready(callback)
		// Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).
		// @param {Function} callback The object that is a set of plugin to install.
		// @return {jet}
		// - 
		ready: function(callback) {
			var index, func;
			if (core.isArray(callback)) {
				index = 0;
				while (func = callback[index++]) {
					this.ready(func);
				}
			} else {
				if (core.isFunction(callback)) {
					onLoadEvent.push(callback);
				}
			}
			return this;
		}
	});
	jet.extend({
		// - jet.shift(html)
		// Convert the string into jet object.
		// @param {String} html The string that will be converted to a set of elements.
		// @return {jetObject}
		// - 
		shift: function(html) {
			var object = new jetObject();
			container.innerHTML = html;
			each(container.children, function() {
				object.push(this.cloneNode(true));
			});
			container.innerHTML = '';
			return object;
		},
		// - jet.ajax(object)
		// Perform an Asynchronous JavaScript and XML (Ajax) request and apply the JSON or XML object into specified callback function.
		// @param {PlainObject} object A set of setting for perform an Ajax request.
		// @item obj:{String} url The target url for Ajax request.
		// @item obj:{Number} timeout Setup a timeout option for request. Value in millisecond.
		// @item obj:{String} method The request method in POST or GET.
		// @item obj:{PlainObject} headers The plain object with headers that will be set for request.
		// @item obj:{PlainObject} data The plain object with POST data that will be sent.
		// @item obj:{String} dataType The string of data type in 'json' or 'xml'
		// @return {jet}
		// - 
		ajax: function(object) {
			var data = {},
				parser;
			object = object || {};
				if (object.dataType === 'xml') {
					object.parser = function(response) {
						var p;
						try {
							if (win.DOMParser) {
								p = new DOMParser();
								return p.parseFromString(response, 'text/xml');
							} else {
								p = new ActiveXObject('Microsoft.XMLDOM');
								p.async = false;
								p.loadXML(response);
								return p;
							}
						}
						catch (error) {
							return null;
						}
					};
				} else {
					object.parser = function(response) {
						var obj = {};
						if (core.isString(response) && response.length > 0) {
							try {
								obj = eval('(' + response + ')');
							}
							catch (error) {
								return null;
							}
						}
						return obj;
					};
				}
			return jet.request(object);
		},
		// - jet.request(object)
		// Perform a web request with get / post method.
		// @param {PlainObject} object A set of setting for perform an Ajax request.
		// @item obj:{String} url The target url for Ajax request.
		// @item obj:{Number} timeout Setup a timeout option for request. Value in millisecond.
		// @item obj:{String} method The request method in POST or GET.
		// @item obj:{Function} success The callback function that will be executed when the request is completed.
		// @item obj:{Function} error The callback function that will be executed if the request returns error or timeout.
		// @item obj:{PlainObject} headers The plain object with headers that will be set for request.
		// @item obj:{PlainObject} data The plain object with POST data that will be sent.
		// @return {jet}
		// - 
		request: function(object) {
			var that = this,
				d = jet.Deferred();
			(function(deferred) {
				var xmlHttp = null,
					dataString = '',
					index;
				if (core.isPlainObject(object) && core.isDefined(object.url) && object.url.length > 0) {
					// Setup HTTP Request
					xmlHttp = new XMLHttpRequest();
					// Setup Timeout
					if (parseInt(object.timeout) > 0) {
						xmlHttp.timeoutTimer = setTimeout(function() {
							xmlHttp.abort('timeout');
						}, parseInt(object.timeout));
					}
					// Bind onReadyStateChange event
					xmlHttp.onreadystatechange = function() {
						var response;
						if (xmlHttp.readyState != 4) return;
						if (xmlHttp.status == 200) {
							if (core.isFunction(object.parser)) {
								response = object.parser.call(deferred, xmlHttp.responseText);
								if (response === null) {
									deferred.reject({
										status: xmlHttp.status,
										text: 'Fail to parse target object'
									});
								} else {
									deferred.resolve(response);
								}
							} else {
								deferred.resolve(xmlHttp.responseText);
							}
						} else {
							deferred.reject({
								status: xmlHttp.status,
								text: xmlHttp.statusText
							});
						}
					};
					try {
						// Request method
						if (object.method === 'post') {
							xmlHttp.open('POST', object.url, true);
							// Set Header
							if (core.isPlainObject(object.headers)) {
								for (index in object.headers) {
									xmlHttp.setRequestHeader(index, object.headers[index]);
								}
							}
							// Set Post Data
							if (core.isDefined(object.data)) {
								if (object.data.constructor != FormData && core.isPlainObject(object.data)) {
									xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
									for (index in object.data) {
										dataString += (dataString.length) ? '&' + index + '=' + object.data[index] : index + '=' + object.data[index];
									}
									xmlHttp.send(dataString);
								} else if (core.isString(object.data)) {
									xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
									xmlHttp.send(object.data);
								} else {
									xmlHttp.send(object.data);
								}
							}
						} else {
							// Method 'Get'
							xmlHttp.open('GET', object.url, true);
							xmlHttp.send();
						}
					}
					catch (err) {
						deferred.reject({
							status: xmlHttp.status,
							text: xmlHttp.statusText
						});
					}
				}
				return deferred.detach();
			})(d);
			return d;
		},
		// - jet.walk(object, callback)
		// Execute the user-defined callback function to each item of the array, array-like object, plain object or object.
		// @param {Object} object The array, array-like object, plain object or object that will be iterated.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jet}
		// - 
		walk: function(object, callback) {
			var result = [];
			if ((core.isArray(object) || core.isPlainObject(object)) && core.isFunction(callback)) {
				each(object, function(i) {
					var value = callback.call(this, i, this);
					if (core.isArray(value)) {
						result = result.concat(value);
					} else {
						result.push(value);
					}
				});
			}
			return result;
		},
		// - jet.buildQueryString(object)
		// Generates a URL-encoded query string from the array or plain object provided.
		// @param {Object} object The array or plain object that will be converted to a URL-encoded query. If the object is an array, each item should included 'name' and 'value' properties.
		// @return {String}
		// - 
		buildQueryString: function(object) {
			var queryString = [],
				value;
			if (core.isCollection(object)) {
				each(object, function() {
					if (core.isDefined(this.name, this.value)) {
						value = (core.isFunction(this.value)) ? this.value() : this.value;
						queryString.push(encodeURIComponent(this.name) + '=' + encodeURIComponent(value));
					}
				});
			} else if (core.isPlainObject(object)) {
				each(object, function(i, val) {
					value = (core.isFunction(val)) ? val() : val;
					queryString.push(encodeURIComponent(i) + '=' + encodeURIComponent(value));
				});
			}
			return (queryString.length > 0) ? queryString.join('&') : '';
		},
		
		// - .json()
		// Encode a object as a json.
		// @return {String}
		// - 
		json: function(object) {
			return (function parse(obj){
				var returns = [];
				if (core.isObject(obj)) {
					if (core.isDefined(obj.name, obj.value)) {
						returns.push('"' + obj.name + '": ' + '"' + ((core.isFunction(obj.value)) ? obj.value() : obj.value) + '"');
					} else {
						each(obj, function(key, value) {
							returns.push('"' + key + '": ' + parse(value));
						});
					}
					return '{' + returns.join(', ') + '}';
				} else if (core.isCollection(obj)) {
					each(obj, function(key, value) {
						returns.push('"' + key + '": ' + parse(value));
					});
					return '[' + returns.join(', ') + ']';
				} else {
					return '"' + obj.toString() + '"';
				}
			})(object);
		},

		// - jet.developer(callback)
		// Provide developer environment for plugin implementation.
		// @param {Function} callback The callback function that will be executed for developer environment
		// @return {jet}
		// @added 1.0.5-Beta
		// - 
		developer: function(callback) {
			if (core.isFunction(callback)) {
				callback.call(clone(core));
			}
			return this;
		}
	});

	// Get Event Object
	function getEventObject(element, event, namespace) {
		var evtobj;
		if (Event) {
			var evtobj = new Event(event, {
	            'bubbles'    : true, // Whether the event will bubble up through the DOM or not
	            'cancelable' : true  // Whether the event may be canceled or not
	        });
		} else if (doc.createEvent) {
			if (/(mouse.+)|((un)?click)/i.test(event)) {
				evtobj = doc.createEvent('MouseEvents');
			} else {
				evtobj = doc.createEvent('HTMLEvents');
			}
			evtobj.initEvent(event, true, true);
		} else if (element.createEventObject) {
			evtobj = element.createEventObject();
		}
		evtobj.namespace = namespace;

		return evtobj;
	}

	// Jet Live Event Handler
	jLiveEvent = function (elem) {
		var events = {},
			liveBinded = {},
			element = elem,
			self = {
				register: function (selector, event, callback) {
					event = event.toLowerCase();
					selector = trim(selector);
					if (!core.isDefined(events[event])) {
						events[event] = {};
					}
					events[event][selector] = callback;
				
					if (!core.isDefined(liveBinded[event])) {
						liveBinded[event] = true;

						// Bind OnLive event to document
						jet(element).bind(event, function (e) {
							var evt = e || window.event, elem = evt.target || evt.srcElement;
							each(events[event], function (selector, callback) {
								if (!core.isDefined(elem.bindMap)) {
									elem.bindMap = {};
								}
								if (!core.isDefined(elem.bindMap[event])) {
									elem.bindMap[event] = {};
								}
								if (!core.isDefined(elem.bindMap[event][selector])) {
									var el = jet(elem), e;

									elem.bindMap[event][selector] = true;
									if (el.is(selector)) {
										if (evt = regex.eventname.exec(event)) {
											jet(elem).bind(event, callback);

											evt[1] = evt[1].toLowerCase();
											e = getEventObject(this, evt[1], evt[2]);

											callback.call(elem, e);
										}
									}
								}
							});
						});
					}

					return this;
				},
				detach: function (event, selector) {
					var evt = regex.eventname.exec(event);
					evt[1] = trim(evt[1].toLowerCase());

					each(events, function (eventName, i) {
						var evtIn = regex.eventname.exec(eventName);
						evtIn[1] = trim(evtIn[1].toLowerCase());

						if (evt[1] == '' || evtIn[1] == evt[1]) {
							each(this, function (sel, event) {
								if (!core.isDefined(selector) || selector == sel) {
									jet(element).find(sel).unbind(eventName).each(function () {
										if (core.isDefined(this.bindMap) && core.isDefined(this.bindMap[eventName]) && core.isDefined(this.bindMap[eventName][sel])) {
											delete this.bindMap[eventName][sel];
										}
									});
									delete events[eventName][sel];
								}
							});
						}
					});
					
					if (!core.isDefined(selector)) {
						jet(element).unbind(event);
					}

					return this;
				}
			};
		return self;
	}

	function getNativeEvent(element, evt) {
		if (element[evt]) {
			return element[evt];
		} else if (element['on' + evt]) {
			return element['on' + evt];
		}
		return null;
	}

	// Jet Element Event Handler
	function jEvent(element, evt) {
		var events = {},
			nativeEvent = null,
			self = {
				element: null,
				add: function(namespace, callback) {
					if (!namespace) namespace = '__default';
					if (core.isEmpty(events)) {
						nativeEvent = getNativeEvent(element, evt);
					}
					events['__default'] = callback;

					if (!core.isDefined(events[namespace])) {
						events[namespace] = function () {};
					}
					events[namespace] = callback;
					return this;
				},
				remove: function(namespace) {
					if (!namespace) namespace = '__default';
					delete events[namespace];
					return this;
				},
				clear: function() {
					events = {};
					return this;
				},
				isEmpty: function() {
					return jet.isEmpty(events);
				},
				getHandler: function() {
					return function(e) {
						var index;
						// Fixed below IE8
						e = e || win.event;
						(function (evt) {
							self.trigger = function () {
								return nativeEvent.call(element, evt);
							}
						})(e);
						e.nativeEvent = self.trigger;

						// If trigger with namespace, call the specify event handler
						if (core.isDefined(e.namespace) && e.namespace) {
							if (core.isDefined(events[e.namespace])) {
								return events[e.namespace].call(element, e);
							}
						} else {
							// If trigger without namespace, execute default handler
							if (events['__default']) return events['__default'].call(element, e);
						}
					};
				}
			};
		self.element = element;
		return self;
	}
	// jetObject Prototype
	jetObject.prototype = [];
	extend(jetObject.prototype, {
		constructor: jetObject,
		selector: '',
		// - .merge(object)
		// Merge a set of elements into current set of matched elements that not be added or duplicate.
		// @param {Object} object The array or array-like object that will be merged.
		// @return {jetObject}
		// - 
		merge: function(object) {
			var self = this;
			each(this, function() {
				this.add = true;
			});
			if (core.isCollection(object)) {
				each(object, function() {
					if (core.isElement(this) && !this.added) {
						this.added = true;
						self.push(this);
					}
				});
				reset(this);
			}
			return this;
		},
		// - .each(callback)
		// Iterate over a jet object, executing a function for each matched element.
		// @param {Function} callback The callback function that to be executed.
		// @return {jetObject}
		// - 
		each: function(callback) {
			each(this, callback);
			return this;
		},
		// - .find(selector)
		// Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {DOMElement} selector The element that for filtering.
		// @return {jetObject}
		// - 
		find: function(selector) {
			var object;
			if (core.isString(selector)) {
				return querySelector(selector, this, new jetObject());
			} else {
				object = new jetObject();
				(function process(element) {
					if (core.isCollection(element)) {
						each(element, function() {
							process(this);
						});
					} else if (core.isElement(element)) {
						each(this, function() {
							if (!element.added && core.comparePosition(this, element) === 20) {
								object.push(element);
								element.added = true;
							}
						});
					}
				})(selector);
				reset(object);
				return object;
			}
		},
		// Animation Action
		// - .hide(duration, callback)
		// Hide the matched elements.
		// @param {Number} duration The number of duration in millisecond.
		// @param {Function} callback The callback function that will be executed when the element has been hidden.
		// @return {jetObject}
		// - 
		hide: function(duration, callback) {
			each(this, function(i, elem) {
				var values = {},
					jetObj = jet(elem);
				if (jetObj.css('display') !== 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						elem._cssStorage = {};
						each({
							width: true,
							height: true,
							padding: true,
							margin: true,
							opacity: true,
							display: false,
							overflow: false
						}, function(css, isValue) {
							var val = jetObj.css(css);
							if (parseFloat(val) > 0) {
								elem._cssStorage[css] = val;
							}
							if (isValue) values[css] = '0';
						});
						jetObj.css({
							display: 'block',
							overflow: 'hidden'
						});
						if (!core.isEmpty(values)) {
							jetObj.animate(values, duration, 'swing', {
								complete: function() {
									jetObj.css('display', 'none');
									if (core.isFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jetObj.css('display', 'none');
						if (core.isFunction(callback)) {
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
		// @return {jetObject}
		// - 
		show: function(duration, callback) {
			each(this, function(i, elem) {
				var values = {},
					jetObj = jet(elem),
					style;
				if (jetObj.css('display') === 'none') {
					duration = parseInt(duration);
					if (duration > 0) {
						if (core.isDefined(elem._cssStorage)) {
							each({
								width: true,
								height: true,
								padding: true,
								margin: true,
								opacity: true,
								display: false,
								overflow: false
							}, function(css, isValue) {
								if (isValue) {
									values[css] = elem._cssStorage[css];
								} else {
									jetObj.css(name, jetObj.css(css));
								}
							});
							elem._cssStorage = null;
						} else {
							style = core.defaultStyle(core.nodeName(elem));
							jetObj.css({
								display: style.display,
								overflow: style.overflow,
								opacity: 0
							});
							values = {
								opacity: 1
							};
						}
						if (!core.isEmpty(values)) {
							jetObj.animate(animateObj, duration, 'onswing', {
								complete: function() {
									if (core.isFunction(callback)) {
										callback.call(elem);
									}
								}
							});
						}
					} else {
						jetObj.css('display', 'block');
						if (core.isFunction(callback)) {
							callback.call(this);
						}
					}
				}
			});
			return this;
		},
		// - .get(start[, length])
		// Returns the specified element or a number of elements with jet object.
		// @param {Number} start The returned element will start at the specified index in the set of matched elements.
		// @param {Number} length Returnes a number of elements from the specified index.
		// @return {jetObject}
		// - 
		get: function(start, length) {
			if (core.isNumeric(start) && this[start]) {
				if (core.isNumeric(length)) {
					length = (this.length <= start + length) ? this.length : start + length;
					if (length - start > 1) {
						return jet(this.slice(start, length));
					} else {
						return jet(this[start]);
					}
				} else {
					return jet(this[start]);
				}
			}
			return new jetObject();
		},
		// - .filter(callback)
		// Reduce the set of matched elements to those that match the selector or pass the function’s test.
		// @param {Function} callback The callback function that used of filter, return true to keep the element.
		// @return {jetObject}
		// - 
		filter: function(callback) {
			var jetObj = new jetObject();
			each(this, function() {
				if (callback.call(this)) {
					jetObj.push(this);
				}
			});
			return jetObj;
		},
		// - .walk(callback)
		// Execute the user-defined callback function to each element of the set of matched elements.
		// @param {Function} callback The callback function thet will be executed.
		// @return {jetObject}
		// - 
		walk: function(callback) {
			var result = [];
			each(this, function(i, object) {
				var value = callback.call(object, i, object);
				if (core.isArray(value)) {
					result = result.concat(value);
				} else {
					result.push(value);
				}
			});
			return result;
		},
		// Event
		// - .on(event[, selector, callback])
		// Setup the live event with specify selector.
		// @param {String} event The string of event name.
		// @param {String} selector The string of the selector.
		// @param {Function} selector Alias to callback
		// @param {Function} callback The callback function thet will be applied to specified event.
		// @return {jetObject}
		// - 
		on: function(event, selector, callback) {
			if (core.isDefined(event) && event) {
				if (core.isFunction(selector))  {
					if (!core.isDefined(document.jLiveEvent)) {
						document.body.jLiveEvent = jLiveEvent(document.body);
					}
					document.body.jLiveEvent.register(this.selector, event, selector);
				} else {
					if (core.isString(selector)) {
						each(this, function() {
							if (!core.isDefined(this.jLiveEvent)) {
								this.jLiveEvent = jLiveEvent(this);
							}
							this.jLiveEvent.register(selector, event, callback);
						});
					}
				}
			}
			return this;
		},
		// Event
		// - .off(event, selector)
		// Cancel live event with specify selector.
		// @param {String} event The string of event name.
		// @param {String} selector The string of the selector.
		// @return {jetObject}
		// - 
		off: function (event, selector) {
			if (core.isDefined(event) && event) {
				each((!core.isDefined(selector)) ? [document.body] : this, function() {
					if (core.isDefined(this.jLiveEvent)) {
						this.jLiveEvent.detach(event, selector);
					}
				});
			}
		},
		// - .bind(event, callback)
		// Bind the callback function to specifed event in every matched element.
		// @param {String} event The name of the event.
		// @param {Function} callback The callback function that will be applied.
		// @return {jetObject}
		// - 
		bind: function(event, callback) {
			var evt;
			event = trim(event);
			if (evt = regex.eventname.exec(event)) {
				each(this, function() {
					if (/^(DOMContentLoaded|(on)?load)$/i.test(evt[1]) && (this == doc || this == win)) {
						core.ready(callback);
					} else {
						evt[1] = evt[1].toLowerCase();
						if (core.isElement(this) || core.isWindow(this)) {
							this.jEvent = this.jEvent || {};
							if (!this.jEvent[evt[1]]) {
								this.jEvent[evt[1]] = jEvent(this, evt[1]);
								if (this.addEventListener) {
									this.addEventListener(evt[1], this.jEvent[evt[1]].getHandler(), false);
								} else if (this.attachEvent) {
									this.attachEvent(bindmap[evt[1]] || 'on' + evt[1], this.jEvent[evt[1]].getHandler());
								} else {
									this[bindmap[evt[1]] || 'on' + evt[1]] = this.jEvent[evt[1]].getHandler();
								}
							}
							this.jEvent[evt[1]].add(evt[2], callback);
						}
					}
				});
			}
			return this;
		},
		// - .unbind(event)
		// Unbind the specifed event in every matched element.
		// @param {String} event The name of the event to unbind.
		// @return {jetObject}
		// - 
		unbind: function(event) {
			var evt;
			event = trim(event);

			if (evt = regex.eventname.exec(event)) {
				each(this, function() {
					if (core.isElement(this) || core.isWindow(this)) {
						if (this.jEvent && this.jEvent[evt[1]]) {
							this.jEvent[evt[1]].remove(evt[2]);
							if (this.jEvent[evt[1]].isEmpty()) {
								if (this.removeEventListener) {
									this.removeEventListener(evt[1], this.jEvent[evt[1]].getHandler(), false);
								} else if (this.detachevent) {
									this.detachevent(bindmap[evt[1]] || 'on' + evt[1], this.jEvent[evt[1]].getHandler());
								} else {
									this[bindmap[evt[1]] || 'on' + evt[1]] = null;
								}
								delete this.jEvent[evt[1]];
							}
						}
					}
				});
			}
			return this;
		},
		// - .trigger(event)
		// Fire the specifed event in every matched element.
		// @param {String} event The name of the event to fire.
		// @return {jetObject}
		// - 
		trigger: function(event) {
			var e, evt;
			each(this, function() {
				if (evt = regex.eventname.exec(event)) {
					evt[1] = evt[1].toLowerCase();
					var e = getEventObject(this, evt[1], evt[2]);

					if (this.dispatchEvent) {
						this.dispatchEvent(e);
					} else if (this.fireEvent) {
						this.fireEvent(bindmap[event] || 'on' + event, e);
					} else if (this[event]) {
						this[event](e);
					} else if (this['on' + event]) {
						this['on' + event](e);
					}
				}
			});
			return this;
		},
		// - .is(selector)
		// Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {Boolean}
		// - 
		is: function(selector) {
			var index = 0,
				length = this.length,
				self = this;

			function process(item) {
				if (core.isCollection(item)) {
					for (; index < length; index++) {
						if (!process(this[index])) {
							return false;
						}
					}
				} else if (core.isFunction(item)) {
					for (; index < length; index++) {
						if (!item.call(this[index])) {
							return false;
						}
					}
				} else if (core.isString(item)) {
					return !!jet(item).filter(function() {
						if (core.inArray(self, this)) {
							return true;
						}
						return false;
					}).length;
				}
				return true;
			}
			return process(selector);
		},
		// - .value(value)
		// Get the current value of the first element in the set of matched elements or set the value of every matched element.
		// @param {String} selector The value to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jetObject|String}
		// - 
		value: function(value) {
			var self = this,
				elem;
			if (core.isDefined(value)) {
				each(this, function() {
					var setValue, hook;
					hook = jHooks.value[this.type] || jHooks.value[core.nodeName(this)];
					if (hook) {
						hook.call(self, this, value);
					} else {
						if (core.isDefined(this.value)) {
							setValue = (core.isFunction(value)) ? value.call(this.value) : value;
							this.value = setValue;
							jet(this).attr('value', setValue);
						}
					}
				});
				return this;
			} else {
				elem = this[0];
				if (core.isElement(elem)) {
					hook = jHooks.value[elem.type] || jHooks.value[core.nodeName(elem)];
					if (hook) {
						return hook.call(self, elem);
					}
					return elem.value;
				}
				return '';
			}
		},
		// - .text(value)
		// Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.
		// @param {String} selector The string of content to set.
		// @param {Function} selector A function returning the value to set.
		// @return {jetObject|String}
		// - 
		text: function(value) {
			if (core.isDefined(value)) {
				each(this, function() {
					this.innerText = (core.isFunction(value)) ? value.call(this.innerText) : value;
				});
				return this;
			} else {
				var elem = this[0];
				if (core.isElement(elem)) {
					if (core.isDefined(elem.type) && elem.type.indexOf('select') !== -1) {
						return elem.options[elem.selectedIndex].innerHTML;
					}
					return elem.innerText;
				}
				return '';
			}
		},
		// - .detach()
		// Remove the set of matched elements from the DOM.
		// @return {jetObject}
		// - 
		detach: function() {
			each(this, function() {
				if (this.parentNode) {
					this.parentNode.removeChild(this);
				}
			});
			return this;
		},
		// - .isActive()
		// Check the first element of the set of matched elements is active (focus) in current document.
		// @return {Boolean}
		// - 
		isActive: function() {
			var elem = this[0];
			if (!elem || !core.isElement(elem)) return false;
			if (doc.activeElement === elem) {
				return true;
			}
			return false;
		},
		// - .getUnit(prop)
		// Get the CSS value in jUnit object from the first element's position of the set of matched elements.
		// @param {String} property The name of style to get.
		// @return {jUnit}
		// - 
		getUnit: function(property) {
			var elem = this[0];
			if (!elem || !core.isElement(elem)) return jUnit();
			return jUnit(elem, property);
		},
		// - .offset()
		// Get the first element's position of the set of matched elements.
		// @param {String} prop The name of style to get.
		// @return {PlainObject}
		// - 
		offset: function() {
			var offset = {
				top: 0,
				left: 0
			},
				offsetParent, parentOffset = {
					top: 0,
					left: 0
				},
				elem = this[0];
			if (core.isElement(elem)) {
				offsetParent = this.offsetParent();
				if (!core.nodeName(offsetParent, 'html')) {
					parentOffset = offsetParent.offset();
				}
				parentOffset.top += parseInt(this.css('border-top-width'));
				parentOffset.left += parseInt(this.css('border-left-width'));
				offset = this.boxRect();
				return {
					top: offset.top - parentOffset.top,
					left: offset.left - parentOffset.left
				};
			}
			return offset;
		},
		// - .offsetParent()
		// Get the first element's parent offset of the first of matched elements.
		// @return {jetObject}
		// @added 1.0.6-Beta
		// - 
		offsetParent: function() {
			var elem = this[0],
				offsetParent = (elem) ? elem.offsetParent : null;
			while (offsetParent) {
				if (core.nodeName(offsetParent, 'html') || jet(offsetParent).css('position') !== 'static') {
					break;
				}
				offsetParent = offsetParent.offsetParent;
			}
			return jet(offsetParent || docElem);
		},
		// - .boxRect()
		// Get the first element's BoundingClientRect() of the set of matched elements, adjust the offset in IE.
		// @return {PlainObject}
		// @added 1.0.6-Beta
		// - 
		boxRect: function() {
			var rect, box, boxrect = {},
				elem = this[0];
			if (core.isElement(elem)) {
				rect = elem.getBoundingClientRect();
				if (!core.isIE) {
					return rect;
				}
				if (core.isIE && boxAdjust === null) {
					box = jet('<div style="position:absolute;top:0;left:0"></div>').appendTo('body');
					boxAdjust = -box[0].getBoundingClientRect().top;
					box.detach();
					box = null;
				}
				return {
					left: rect.left + boxAdjust,
					right: rect.right + boxAdjust,
					top: rect.top + boxAdjust,
					bottom: rect.bottom + boxAdjust,
					height: rect.right - rect.left,
					width: rect.bottom - rect.top
				};
			}
			return null;
		},
		// - .inViewport(fullElementDisplay)
		// Get the first element's is visble in viewport or not.
		// @return {Boolean}
		// @added 1.0.7-Beta
		// - 
		inViewport: function() {
			var boxRect = this.boxRect();
			if (!boxRect) {
				return false;
			}

		    return (
				boxRect.top + boxRect.height >= 0 &&
				boxRect.left + boxRect.width >= 0 &&
				boxRect.bottom <= (win.innerHeight || docElem.clientHeight) &&
				boxRect.right <= (win.innerWidth || docElem.clientWidth)
		    );
		},

		// - .height([value])
		// Get the first element's height of the set of matched elements or set the height for every matched element.
		// @param {Number} value The value of height to set.
		// @return {jetObject|Number}
		// - 
		height: function(value) {
			var body = doc.body,
				elem = this[0];
			if (core.isDefined(value)) {
				each(this, function() {
					var el, setValue;
					if (core.isElement(this)) {
						el = jet(this);
						setValue = (core.isFunction(value)) ? value.call(this, el.css('height')) : value;
						setValue += 'px';
						el.css('height', setValue);
					}
				});
				return this;
			} else {
				if (!core.isDefined(elem) || !core.isElement(elem)) {
					return parseInt(win.innerHeight);
				} else if (core.isDocument(elem)) {
					return parseInt(docElem.clientHeight || jet('body').css('clientHeight'));
				} else {
					return parseInt(this.css('height'));
				}
			}
		},
		// - .innerHeight()
		// Get the first element's height without border, padding and margin of the set of matched elements.
		// @return {Number}
		// - 
		innerHeight: function() {
			var value = 0,
				self = this;
			each(['padding-top', 'padding-bottom'], function() {
				value += parseInt(self.css(this));
			});
			return parseInt(this.css('height')) - value;
		},
		// - .outerHeight(includeMargin)
		// Get the first element's height with padding and border, even include the margin of the set of matched elements.
		// @return {Number}
		// - 
		outerHeight: function(includeMargin) {
			var value = 0,
				self = this;
			each(['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width'], function() {
				value += parseInt(self.css(this));
			});
			if (includeMargin) {
				value += (parseInt(this.css('margin-top')) + parseInt(this.css('margin-bottom')));
			}
			return parseInt(this.css('height')) + value;
		},
		// - .width([value])
		// Get the first element's width of the set of matched elements or set the height for every matched element.
		// @param {Number} value The value of width to set.
		// @return {jetObject|Number}
		// - 
		width: function(value) {
			var body = doc.body,
				elem = this[0];
			if (core.isDefined(value)) {
				each(this, function() {
					var el, setValue;
					if (core.isElement(this)) {
						el = jet(this);
						setValue = (core.isFunction(value)) ? value.call(this, el.css('width')) : value;
						setValue += 'px';
						el.css('width', setValue);
					}
				});
				return this;
			} else {
				if (!core.isDefined(elem) || !core.isElement(elem)) {
					return parseInt(win.innerWidth);
				} else if (core.isDocument(elem)) {
					return parseInt(docElem.clientWidth || jet('body').css('clientWidth'));
				} else {
					return parseInt(this.css('width'));
				}
			}
		},
		// - .innerWidth()
		// Get the first element's width without border, padding and margin of the set of matched elements.
		// @return {Number}
		// - 
		innerWidth: function() {
			var value = 0,
				self = this;
			each(['padding-left', 'padding-right'], function() {
				value += parseInt(self.css(this));
			});
			return parseInt(this.css('width')) + value;
		},
		// - .outerWidth(includeMargin)
		// Get the first element's width with padding and border, even include the margin of the set of matched elements.
		// @return {Number}
		// - 
		outerWidth: function(includeMargin) {
			var value = 0,
				self = this;
			each(['padding-left', 'padding-right', 'border-left-width', 'border-right-width'], function() {
				value += parseInt(self.css(this));
			});
			if (includeMargin) {
				value += (parseInt(this.css('margin-left')) + parseInt(this.css('margin-right')));
			}
			return parseInt(this.css('width')) + value;
		},
		// - .parent([selector])
		// Get the parent element from first element of the set of matched element, optionally filtered by a selector.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jetObject}
		// - 
		parent: function(selector) {
			var elem = this[0],
				parent;
			if (!elem) return jet();
			while (elem = elem.parentNode) {
				if (!selector) {
					return (elem) ? jet(elem) : jet();
				} else if (jet(elem).is(selector)) {
					return jet(elem);
				}
			}
			return jet();
		},
		// - .parents([selector])
		// Get the ancestors from first element of the set of matched element, optionally filtered by a selector.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jetObject}
		// - 
		parents: function(selector) {
			var elements = [],
				elem = this[0];
			if (!elem) return null;
			while (elem = elem.parentNode) {
				if (!parent && parent.nodeType === 11) {
					break;
				}
				if (!selector || jet(elem).is(selector)) {
					elements.push(elem);
				}
			}
			return jet(elements);
		},
		// - .childs([selector])
		// Get the child elements from first element of the set of matched element, optionally filtered by a selector.
		// @param {String} selector The string of selector.
		// @param {Object} selector The jet object, array, array-like object that for filtering.
		// @param {Function} selector The callback function that execute for every matched elements.
		// @return {jetObject}
		// - 
		childs: function(selector) {
			var elements = [],
				elem = this[0];
			if (!elem) return null;
			elem = elem.childNodes[0];
			while (elem = siblingElement(elem, 'next')) {
				if (!selector || jet(elem).is(selector)) {
					elements.push(elem);
				}
			}
			return jet(elements);
		},
		// - .scrollTop([value])
		// Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.
		// @param {Number} value The value of scroll top to set.
		// @return {jetObject|Number}
		// - 
		scrollTop: function(value) {
			var y = 0,
				elem = this[0];
			if (core.isDefined(value)) {
				if (core.isJetObject(value)) {
					console.log(value.boxRect());
				} else if (core.isElement(value)) {
					value = jet(value).scrollTop();
				} else {
					value = parseInt(value);
				}
				elem.scrollTop = value;
				console.log(elem, elem.scrollTop);
				return this;
			} else {
				if (elem == doc || elem == win) {
					y = (win.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
				} else if (core.nodeName(elem, 'body')) {
					y = docElem.scrollTop || elem.scrollTop || 0;
				} else if (core.isElement(elem)) {
					y = elem.scrollTop || 0;
				}
				return (isNaN(y)) ? 0 : y;
			}
		},
		// - .scrollLeft([value])
		// Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.
		// @param {Number} value The value of scroll left to set.
		// @return {jetObject|Number}
		// - 
		scrollLeft: function(value) {
			var x = 0,
				elem = this[0];
			if (core.isDefined(value)) {
				value = parseInt(value);
				win.scrollTo(value, this.scrollTop());
				return this;
			} else {
				if (core.nodeName(elem, 'body')) {
					x = docElem.scrollLeft || elem.scrollLeft || 0;
				} else if (core.isElement(elem)) {
					x = elem.scrollLeft || 0;
				}
				return x;
			}
		},
		// - .scrollTo(x, y)
		// Scroll every matched element to specified position.
		// @param {Number} x The value of scroll left to set.
		// @param {Number} y The value of scroll top to set.
		// @return {jetObject}
		// - 
		scrollTo: function(x, y) {
			var point = {
				x: 0,
				y: 0
			};
			if (core.isJetObject(x)) {
				point = x.offset();
			} else if (core.isElement(x)) {
				point = jet(x).offset();
			} else {
				point.x = parseInt(x);
				point.y = parseInt(y);
			}
			each(this, function() {
				if (core.isFunction(this.scrollTo)) {
					this.scrollTo(x, y);
				}
			});
			return this;
		},
		// - .handler(event)
		// Get the first element's event callback function of the set of matched elements
		// @param {String} event The name of event to get.
		// @return {Function}
		// - 
		handler: function(event) {
			var elem = this[0];
			return elem[bindmap[event] || 'on' + event] || elem[event];
		},
		// - .formdata()
		// Encode a set of form elements as a FormData object
		// @return {FormData}
		formdata: function() {
			var elem = this[0], returns = {}, formset, formdata = new FormData();
			if (core.isDefined(elem)) {
				if (core.nodeName(elem, 'form') && elem.elements) {
					formset = elem.elements
				} else {
					formset = this.find('*');
				}
				jet(formset).filter(function() {
					if (regex.submitName.test(this.tagName) && !regex.submitType.test(this.type) && !this.disabled && (!regex.checkable.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).each(function(i, elem) {
					formdata.append(elem.name, elem.value);
				});
			}
			return formdata;
		},
		// - .values()
		// Encode a set of form elements as a object
		// @return {PlainObject}
		values: function() {
			var elem = this[0], returns = {}, formset;
			if (core.isDefined(elem)) {
				if (core.nodeName(elem, 'form') && elem.elements) {
					formset = elem.elements
				} else {
					formset = this.find('*');
				}
				jet(formset).filter(function() {
					if (regex.submitName.test(this.tagName) && !regex.submitType.test(this.type) && !this.disabled && (!regex.checkable.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).each(function(i, elem) {
					var value = jet(elem).value(), matches = elem.name.match(/(.+)\[(.+)\]/);
					if (matches) {
						if (!core.isDefined(returns[matches[1]])) {
							returns[matches[1]] = {};
						}
						returns[matches[1]][matches[2]] = value;
					} else {
						returns[elem.name] = value;
					}
				});
			}
			return returns;
		},

		// - .serialize()
		// Encode a set of form elements as a string for submission.
		// @return {String}
		// - 
		serialize: function() {
			var elem = this[0], formset;
			if (core.isDefined(elem)) {
				if (core.nodeName(elem, 'form') && elem.elements) {
					formset = elem.elements
				} else {
					formset = this.find('*');
				}
				return jet.buildQueryString(jet(formset).filter(function() {
					if (regex.submitName.test(this.tagName) && !regex.submitType.test(this.type) && !this.disabled && (!regex.checkable.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).walk(function(i, elem) {
					var value = jet(elem).value();
					if (core.isArray(value)) {
						return jet.walk(value, function() {
							return {
								name: elem.name + '[]',
								value: this
							};
						});
					} else {
						return {
							name: elem.name,
							value: value
						};
					}
				}));
			}
			return '';
		},

		// - jet.hasClass(classes)
		// Check the first element of the set of matched elements has included one or more classes.
		// @param {DOMElement} element The element to check the class.
		// @param {Array} list A list of class.
		// @return {Boolean}
		// - 
		hasClass: function(classes) {
			var elem = this[0];
			if (!core.isDefined(elem)) return false;
			if (core.isString(classes)) {
				classes = classes.split();
			} else if (!core.isArray(classes)) {
				classes = [];
			}
			return core.hasClass(elem, classes);
		},

		// - .hasClass(classes)
		// Check the first element of the set of matched elements is checkable or not.
		// @return {Boolean}
		// - 
		checkable: function() {
			var elem = this[0];
			return (regex.submitName.test(elem.tagName) && !elem.disabled && regex.checkable.test(elem.type));
		},

		// - .check()
		// Check a set of checkbox or radiobox.
		// @return {JetObject}
		// - 
		check: function() {
			each(this, function() {
				if (jet(this).checkable()) {
					jet(this).attr('checked', 'checked');
					jet(this).prop('checked', true);
				}
			});
			return this;
		},

		// - .uncheck()
		// Uncheck a set of checkbox or radiobox.
		// @return {JetObject}
		// - 
		uncheck: function() {
			each(this, function() {
				if (jet(this).checkable()) {
					jet(this).removeProp('checked');
					jet(this).removeAttr('checked');
				}
			});
			return this;
		},

		// - .checked()
		// Return the first element of the set of matched elements is checked or not or check or uncheck all matched elements
		// @param {Boolean} ischeck Check or Uncheck
		// @return {JetObject|Boolean}
		// - 
		checked: function(ischeck) {
			if (jet.isDefined(ischeck)) {
				if (!!ischeck) {
					this.check();
				} else {
					this.uncheck();
				}
				return this;
			} else {
				var elem = jet(this[0]);
				return elem.is(':checked') || elem.prop('checked');
			}
		}
	});
	// .first() and .last()
	// - .first()
	// Get first child element from the first element of a set of matches elements. Equivalent as jet.is(':first-child').
	// @return {JetObject}
	// @added 1.1.0
	// - 
	// - .last()
	// Get last child element from the first element of a set of matches elements. Equivalent as jet.is(':first-child').
	// @return {JetObject}
	// @added 1.1.0
	// - 
	each('first last'.split(' '), function() {
		jetObject.prototype[this] = (function(name) {
			return function() {
				var element = this[0];
				if (element && core.isElement(element)) {
					return jet(childElement(element, name));
				}
				return null;
			};
		})(this);
	});

	// .next() and .prev()
	// - .next()
	// Get next child element from the first element of a set of matches elements. Equivalent as jet.is(':first-child').
	// @return {JetObject}
	// @added 1.1.0
	// - 
	// - .prev()
	// Get previous child element from the first element of a set of matches elements. Equivalent as jet.is(':first-child').
	// @return {JetObject}
	// @added 1.1.0
	// - 
	each('next previous'.split(' '), function() {
		jetObject.prototype[this.substring(0, 4)] = (function(name) {
			return function(selector) {
				var element = this[0];
				if (core.isElement(element)) {
					while (element = siblingElement(element, name)) {
						if (!core.isDefined(selector) || jet(element).is(selector)) {
							return jet(element);
						}
					}
				}
				return jet();
			};
		})(this);
	});
	// Add event shortcut
	// - .click(callback)
	// Apply or trigger OnClick event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .dblClick(callback)
	// Apply or trigger OnDblClick event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .focus(callback)
	// Apply or trigger OnFocus event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .blur(callback)
	// Apply or trigger OnBlur event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .change(callback)
	// Apply or trigger OnChange event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .select(callback)
	// Apply or trigger OnSelect event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .mouseOver(callback)
	// Apply or trigger OnMouseOver event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .mouseOut(callback)
	// Apply or trigger OnMouseOut event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .ready(callback)
	// Apply or trigger OnLoad event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .unload(callback)
	// Apply or trigger Unload event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .submit(callback)
	// Apply or trigger OnSubmit event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// - 
	// - .mouseDown(callback)
	// Apply or trigger OnMouseDown event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// @added 1.0.2-Beta
	// - 
	// - .mouseUp(callback)
	// Apply or trigger OnMouseUp event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// @added 1.0.2-Beta
	// - 
	// - .mouseMove(callback)
	// Apply or trigger OnMouseMove event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// @added 1.0.2-Beta
	// - 
	// - .scroll(callback)
	// Apply or trigger OnScroll event to each of the set of matched elements.
	// @param {Function} callback The callback function thet will be applied.
	// @return {jetObject}
	// @added 1.0.4
	// - 
	each('click dblClick focus blur change select mouseOver mouseOut load unload submit mouseDown mouseUp mouseMove scroll'.split(' '), function() {
		(function(event) {
			jetObject.prototype[event] = function(callback) {
				if (core.isDefined(callback)) {
					return this.bind(event.toLowerCase(), callback);
				}
				this.trigger(event);
				return this;
			};
		})(this);
	});
	// Append and Preppend function

	function insertTo(target, element, isAppend, isInsert) {
		var contents, length = (target.length) ? target.length - 1 : 0;
		if (core.isCollection(element) && element.length > 0) {
			contents = element;
		} else if (core.isString(element)) {
			contents = [doc.createTextNode(element)];
		} else if (core.isElement(element)) {
			contents = [element];
		}
	
		if (contents) {
			each(target, function(i, el) {
				if (!core.isDefined(el.nodeType)) {
					return;
				}

				el = (el.nodeType === 1) ? el : core.owner(el).document.body;
				each(contents, function(j, insert) {
					var last = (length === i) ? true : false, parent;

					if (isInsert) {
						if (el.nodeType === 1) {
							parent = el.parentNode;
							if (isAppend) {
								if (parent.lastchild == el) {
									parent.appendChild((last) ? insert : insert.cloneNode(true), el.nextSibling);
								} else {
									parent.insertBefore((last) ? insert : insert.cloneNode(true), el.nextSibling);
								}
							} else {
								parent.insertBefore((last) ? insert : insert.cloneNode(true), el);
							}
						}
					} else {
						if (isAppend) {
							el.appendChild((last) ? insert : insert.cloneNode(true));
						} else {
							el.insertBefore((last) ? insert : insert.cloneNode(true), el.childNodes[0]);
						}
					}
				});
			});
		}
		return this;
	}

	extend(jetObject.prototype, {
		after: function(element) {
			insertTo(this, element, true, true);
			return this;
		},
		before: function(element) {
			insertTo(this, element, false, true);
			return this;
		},
		// - .append(element)
		// Insert content to the end of each element in the set of matched elements.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jetObject}
		// - 
		append: function(element) {
			insertTo(this, element, true);
			return this;
		},
		// - .prepend(element)
		// Insert content to the beginning of each element in the set of matched elements.
		// @param {Object} element The array, array-like object, string or DOM element that will be inserted.
		// @return {jetObject}
		// - 
		prepend: function(element) {
			insertTo(this, element);
			return this;
		},
		// - .appendTo(element)
		// Insert every element in the set of matched elements to the end of the target.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jetObject}
		// - 
		appendTo: function(element) {
			insertTo(element, this, true);
			return this;
		},
		// - .prependTo(element)
		// Insert every element in the set of matched elements to the beginning of the target.
		// @param {Object} element The target DOM element or a list of elements as an array, array-like object or jet object.
		// @return {jetObject}
		// - 
		prependTo: function(element) {
			insertTo(element, this);
			return this;
		},
		// - .prop(prop[, value])
		// Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
		// @param {String} prop The name of the property to set.
		// @param {String} prop The name of the property to get.
		// @param {Array} prop A set of property name to get.
		// @param {Object} prop An object of property-value pairs to set.
		// @param {String|Number|Boolean} value The value of the property to set.
		// @return {jetObject|String|Boolean|PlainObject}
		// - 
		prop: function(prop, value) {
			var returns = {},
				elem, self = this;
			if (core.isPlainObject(prop)) {
				each(prop, function(pp, val) {
					self.prop(pp, val);
				});
			} else if (core.isArray(prop)) {
				elem = this[0];
				if (elem) {
					each(prop, function(i, pp) {
						returns[pp] = self.prop(propmap[pp] || pp);
					});
				}
				return returns;
			} else {
				if (core.isDefined(value)) {
					each(this, function() {
						var pp = propmap[prop] || prop,
							setValue;
						if (core.isDefined(this[pp])) {
							var setValue = (core.isFunction(value)) ? value.call(this, this[pp]) : value;
							this[pp] = setValue;
						}
					});
				} else {
					elem = this[0];
					if (elem) {
						return elem[propmap[prop] || prop];
					}
					return null;
				}
			}
			return this;
		},
		// - .removeProp(prop)
		// Remove the property for every matched element.
		// @param {String} prop The name of the property that will be removed.
		// @return {jetObject}
		// - 
		removeProp: function(prop) {
			var pp = propmap[prop] || prop;
			each(this, function() {
				if (core.isElement(this)) {
					this[pp] = undefined;
					this.removeAttribute(pp);
				}
			});
			return this;
		},
		// - .css(css[, value])
		// Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.
		// @param {String} css The name of the style to set.
		// @param {String} css The name of the style to get.
		// @param {Array} css A set of style to get.
		// @param {Object} css An object of style-value pairs to set.
		// @param {String|Number|Boolean} value The value of the style to set.
		// @return {jetObject|String|Boolean|PlainObject}
		// - 
		css: function(css, value) {
			var elem, cc, returns = {},
				self = this,
				owner;
			if (core.isPlainObject(css)) {
				each(css, function(style, val) {
					self.css(style, val);
				});
			} else if (core.isArray(css)) {
				elem = this[0];
				if (core.isElement(elem)) {
					each(css, function(i, style) {
						returns[style] = self.css(style);
					});
				}
				return returns;
			} else {
				cc = core.camelCase(css);
				if (jHooks.css[cc]) {
					return jHooks[cc](this, cc, value);
				}
				if (core.isDefined(value)) {
					each(this, function() {
						if (core.isElement(this) && core.isDefined(this.style[cc])) {
							this.style[cc] = (core.isFunction(value)) ? value.call(this, this.style[cc]) : value;
						}
					});
				} else {
					elem = this[0];
					if (core.isElement(elem)) {
						owner = core.owner(elem).document;
						if (owner.defaultView && owner.defaultView.getComputedStyle) {
							return owner.defaultView.getComputedStyle(elem, '').getPropertyValue(css);
						}
						if (elem.currentStyle) {
							return elem.currentStyle[cc];
						}
						return elem.style[cc];
					}
					return null;
				}
			}
			return this;
		},
		// - .toggleClass(classname)
		// Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.
		// @param {String} class One or more class names (separated by spaces) to be toggled for each element in the matched set.
		// @return {jetObject}
		// - 
		toggleClass: function(classname) {
			var classes = [];
			each(this, function(i, elem) {
				if (core.isElement(elem)) {
					if (core.isString(classname)) {
						classes = trim(classname).split(' ');
					}
					each(classes, function() {
						if (!core.hasClass(elem, this)) {
							jet(elem).addClass(this);
						} else {
							jet(elem).removeClass(this);
						}
					});
					if (!elem.className) {
						elem.removeAttribute('class');
					}
				}
			});
			return this;
		},
		// - .addClass(classname)
		// Add one or more classes from each element in the set of matched elements.
		// @param {String} prop One or more class names (separated by spaces) to be added for each element in the matched set.
		// @return {jetObject}
		// - 
		addClass: function(classname) {
			var classes = [];
			each(this, function(i, elem) {
				if (core.isElement(elem)) {
					if (core.isString(classname)) {
						classes = trim(classname).split(' ');
					} else if (core.isArray(prop)) {
						classes = classname;
					}
					each(classes, function() {
						if (!core.hasClass(elem, this)) {
							elem.className += (elem.className) ? ' ' + this : this;
						}
					});
				}
			});
			return this;
		},
		// - .removeClass(classname)
		// Remove one or more classes from each element in the set of matched elements.
		// @param {String} prop One or more class names (separated by spaces) to be removed for each element in the matched set.
		// @return {jetObject}
		// - 
		removeClass: function(classname) {
			var classes = [];
			each(this, function(i, elem) {
				if (core.isElement(elem)) {
					if (core.isString(classname)) {
						classes = trim(classname).split(' ');
					} else if (core.isArray(prop)) {
						classes = classname;
					}
					if (classes.length > 0) {
						var elemClass = ' ' + trim(elem.className) + ' ';
						each(classname, function() {
							elemClass = elemClass.replace(new RegExp(' ' + this + ' '), ' ');
						});
						elemClass = trim(elemClass);
						if (!elemClass) {
							elem.removeAttribute('class');
						} else {
							elem.className = elemClass;
						}
					}
				}
			});
			return this;
		},
		// - .attr(attr[, value])
		// Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.
		// @param {String} attr The name of the attribute to set.
		// @param {String} attr The name of the attribute to get.
		// @param {Array} attr A set of attribute to get.
		// @param {Object} attr An object of attribute-value pairs to set.
		// @param {String|Number|Boolean} value The value of the attribute to set.
		// @return {jetObject|String|Boolean|PlainObject}
		// - 
		attr: function(attr, value) {
			var elem, returns = {},
				self = this;
			if (core.isPlainObject(attr)) {
				each(attr, function(attribute, val) {
					self.attr(attribute, val);
				});
			} else if (core.isArray(attr)) {
				elem = this[0];
				if (elem) {
					each(attr, function(i, attribute) {
						returns[attribute] = self.attr(attribute);
					});
				}
				return returns;
			} else {
				if (core.isDefined(value)) {
					each(this, function() {
						var setValue = '';
						setValue = (core.isFunction(value)) ? value.call(this, jet(this).attr(attr)) : value;
						if (this.setAttribute) {
							this.setAttribute(attr, setValue);
						} else {
							this[attrmap[attr.toLowerCase()] || attr] = setValue;
						}
					});
				} else {
					elem = this[0];
					if (elem) {
						return (core.isIE || !elem.getAttribute) ? elem[attrmap[attr.toLowerCase()] || attr] : elem.getAttribute(attr, 2);
					}
					return null;
				}
			}
			return this;
		},
		// - .removeAttr(attr)
		// Remove one or more attributes from each element in the set of matched elements.
		// @param {String} attr The name of the attribute that will be removed.
		// @return {jetObject}
		// - 
		removeAttr: function(attr) {
			each(this, function() {
				if (this.removeAttribute) {
					this.removeAttribute(attr);
				}
			});
			return this;
		},
		// - .html([value])
		// Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.
		// @param {String} value The content of the element to set.
		// @param {Function} value A function returning the value to set.
		// @return {jetObject}
		// - 
		html: function(value) {
			var elem;
			if (core.isDefined(value)) {
				each(this, function() {
					this.innerHTML = (core.isFunction(value)) ? value.call(this, this.innerHTML) : value;
				});
				return this;
			} else {
				elem = this[0];
				if (core.isElement(elem)) {
					return elem.innerHTML;
				}
				return '';
			}
		}
	});

	function getStyle(element, prop, value) {
		var target, original;
		if (!element) return 0;
		original = element.css(prop);
		if (!core.isDefined(value)) {
			target = parseFloat(original);
		} else {
			element.css(prop, value);
			target = parseFloat(element.css(prop));
			element.css(prop, original);
		}
		return isNaN(target) || target === 'auto' ? 0 : target;
	}

	// jet Color Object
	function jColor(value) {
		var self = {
			R: 0,
			G: 0,
			B: 0,
			A: 255,
			subtract: function (value) {
				var color = jColor(value);
				each(['R', 'G', 'B'], function () {
					self[this] -= color[this];
					if (self[this] <= 0) self[this] = 0;
				});
				return self;
			},
			mix: function (value) {
				var color = jColor(value);
				each(['R', 'G', 'B'], function () {
					self[this] += color[this];
					if (self[this] > 255) self[this] = 255;
				});
				return self;
			},
			diff: function (value, percentage) {
				var target = clone(value);

				percentage = parseFloat(percentage);
				percentage = (percentage > 1) ? 1 : percentage;

				each(['R', 'G', 'B'], function () {
					if (self[this] > target[this]) {
						target[this] = self[this] - Math.ceil((self[this] - target[this]) * percentage);
					} else {
						target[this] = self[this] + Math.ceil((target[this] - self[this]) * percentage);
					}
				});
				return target;
			},
			toHex: function () {
				var hex = '', self = this;
				each(['R', 'G', 'B'], function () {
					hex += ((self[this] < 16) ? '0' : '') + self[this].toString(16);
				});
				return '#' + hex;
			},
			toFullHex: function () {
				var hex = '';
				each(['R', 'G', 'B', 'A'], function () {
					hex += ((self[this] < 16) ? '0' : '') + self[this].toString(16);
				});
				return '#' + hex;
			}
		};
		if (jet.isString(value)) {
			if (regex.colorRegex.test(value) || regex.hexRegex.test(value)) {
				if (matches = regex.hexRegex.exec(jet.trim(value))) {
					self.R = parseInt(matches[1], 16);
					self.G = parseInt(matches[2], 16);
					self.B = parseInt(matches[3], 16);
					if (matches[4]) {
						self.A = parseInt(matches[4], 16);
					}
				} else if (matches = regex.colorRegex.exec(jet.trim(value))) {
					self.R = parseInt(matches[1], 10);
					self.G = parseInt(matches[2], 10);
					self.B = parseInt(matches[3], 10);
				}
			}
		}
		return self;
	};
	
	// jet Unit
	function jUnit(elem, prop) {
		var value, color, cssNumber = {
			'columnCount': true,
			'fillOpacity': true,
			'fontWeight': true,
			'lineHeight': true,
			'opacity': true,
			'order': true,
			'orphans': true,
			'widows': true,
			'zIndex': true,
			'zoom': true
		},
			self = {
				element: null,
				diff: null,
				pixel: 0,
				property: '',
				parentPx: null,
				parseDiff: function(value) {
					if (jHooks.unit[this.property] && jHooks.unit[this.property].parseDiff) {
						return jHooks.unit[this.property].parseDiff.call(this, value);
					}
					this.diff = getStyle(this.element, this.property, value) - this.pixel;

					return this;
				},
				take: function(percentage) {
					if (jHooks.unit[this.property] && jHooks.unit[this.property].take) {
						return jHooks.unit[this.property].take.call(this, percentage);
					}
					return (this.pixel + (this.diff * percentage)) + ((!cssNumber[this.property]) ? 'px' : '');
				}
			};
		if (elem.length && core.isDefined(prop)) {
			self.property = prop;
			self.element = elem;
			if (jHooks.unit[prop] && jHooks.unit[prop].init) {
				jHooks.unit[prop].init.call(self, value, elem);
			} else {
				self.pixel = getStyle(elem, prop);
			}
		}
		return self;
	};
	// Animation

	function jAnimate(element) {
		// Reset reference object
		var queue = [],
			unit = {},
			onPlaying = false,
			environmentFPS = 60,
			speed = 1,
			jetObj,
			// Easing Type
			easingType = {
				linear: function(percent) {
					return percent;
				},
				swing: function(percent) {
					return 0.5 - Math.cos(percent * Math.PI) / 2;
				},
				easingIn: function(percent) {
					return (1 - (Math.cos((percent / 2) * Math.PI)));
				},
				easingOut: function(percent) {
					return (Math.cos(((1 - percent) / 2) * Math.PI));
				}
			},
			acceptedProp = /^scroll(Left|Top)|width|height|left|top|right|bottom|opacity|fontSize|color|backgroundColor|border((Left|Right|Top|Bottom)?Width)|lineHeight|padding(Left|Right|Top|Bottom)?|margin(Left|Right|Top|Bottom)?|zoom$/,
			self = {
				apply: function(css, duration, easing, callback) {
					var index, values = {},
						porperty;
					if (core.isPlainObject(css)) {
						for (index in css) {
							if (jHooks.css[index]) {
								values[index] = jHooks.css[index](element, index);
							} else if (acceptedProp.test(core.camelCase(index))) {
								values[index] = css[index];
							}
						}
						porperty = {
							to: values,
							progress: 0,
							frames: Math.ceil(duration / (1000 / environmentFPS)),
							step: null,
							complete: null,
							easing: easing
						};
						if (core.isPlainObject(callback)) {
							if (core.isFunction(callback.step)) {
								porperty.step = callback.step;
							}
							if (core.isFunction(callback.complete)) {
								porperty.complete = callback.complete;
							}
						} else if (core.isFunction(callback)) {
							porperty.complete = callback;
						}
						queue.push(porperty);
					}
					return this;
				},
				play: function() {
					if (!onPlaying) {
						onPlaying = true;
						setTimeout(function() {
							var index, pc;
							if (queue.length) {
								if (queue[0].progress === queue[0].frames) {
									for (index in queue[0].to) {
										jetObj.css(index, queue[0].to[index]);
									}
									unit = {};
									if (queue[0].complete) queue[0].complete.call(jetObj[0]);
									queue = queue.slice(1);
									if (!queue.length) {
										onPlaying = false;
										return;
									}
								} else {
									if (queue[0].progress === 0) {
										// Start new queue, and setup
										for (index in queue[0].to) {
											unit[index] = jUnit(jetObj, index);
											unit[index].parseDiff(queue[0].to[index]);
										}
									} else {
										if (!core.isEmpty(queue[0].to)) {
											for (index in queue[0].to) {
												pc = (easingType[queue[0].easing] || easingType.linear)(queue[0].progress / (queue[0].frames || 1));
												jetObj.css(index, unit[index].take(pc));
											}
										}
									}
									if (queue[0].step) queue[0].step.call(elem);
									queue[0].progress++;
								}
								if (onPlaying) {
									setTimeout(arguments.callee, Math.ceil(1000 / (environmentFPS * speed)) || 1);
								}
							} else {
								onPlaying = false;
							}
						});
					}
					return this;
				},
				wait: function(duration, callback) {
					return this.apply({}, duration, 'linear', callback);
				},
				pause: function() {
					onPlaying = false;
					return this;
				},
				clear: function() {
					this.pause();
					queue = [];
					return this;
				}
			};
		if (core.isElement(element)) {
			jetObj = jet(element);
		}
		return self;
	};
	extend(jetObject.prototype, {
		// Animate
		// - .animate(cssObj[, duration, easing, callback])
		// Perform a custom animation of a set of CSS properties.
		// @param {PlainObject} cssObj The plain object with CSS property and value.
		// @param {Number} duration The number of duration, in millisecond.
		// @param {String} easing The string of easing type, it can be 'linear', 'swing', 'easingIn' or 'easingOut'.
		// @param {PlainObject} callback The plain object of callback function.
		// @param {Function} obj.step The callback function that will be executed in each tick.
		// @param {Function} obj.complete The callback function that will be executed when the animate is completed.
		// @return {jetObject}
		// - 
		animate: function(cssObj, duration, easing, callback) {
			var element = this[0];
			if (core.isElement(element)) {
				duration = parseInt(duration) || 400;
				if (!core.isPlainObject(cssObj)) {
					return this;
				}
				if (!element.jAnimate) {
					element.jAnimate = jAnimate(element);
				}
				element.jAnimate.apply(cssObj, duration, easing, callback);
				element.jAnimate.play();
			}
			return this;
		},
		// - .wait(callback)
		// Wait a specified period of time for next animation
		// @param {Number} duration The number of duration, in millisecond.
		// @param {Function} callback The callback function that will be executed when the wait timer is expired.
		// @return {jetObject}
		// - 
		wait: function(duration, callback) {
			var element = this[0];
			if (core.isElement(element)) {
				duration = parseInt(duration) || 400;
				if (!element.jAnimate) {
					element.jAnimate = jAnimate(element);
				}
				element.jAnimate.wait(duration, callback);
				element.jAnimate.play();
			}
			return this;
		},
		// - .abort()
		// Stop the animation and clear all animation queue
		// @return {jetObject}
		// @added 1.0.6-Beta
		// - 
		abort: function() {
			var element = this[0];
			if (element.jAnimate) {
				element.jAnimate.clear();
			}
			return this;
		}
	});
	// DateTime class
	jet.extend({
		DateTime: function(value) {
			var date = null,
				year = 0,
				month = 0,
				day = 0,
				time = {},
				monthString = {
					0: 'January',
					1: 'February',
					2: 'March',
					3: 'April',
					4: 'May',
					5: 'June',
					6: 'July',
					7: 'August',
					8: 'September',
					9: 'October',
					10: 'November',
					11: 'December'
				},
				monthMap = {
					'Jan': 0,
					'Feb': 1,
					'Mar': 2,
					'Apr': 3,
					'May': 4,
					'Jun': 5,
					'Jul': 6,
					'Aug': 7,
					'Sep': 8,
					'Oct': 9,
					'Nov': 10,
					'Dec': 11
				},
				weekdayString = {
					0: 'Sunday',
					1: 'Monday',
					2: 'Theuday',
					3: 'Wednesday',
					4: 'Thursday',
					5: 'Friday',
					6: 'Saturday'
				},
				weekdayMap = {
					Sun: 1,
					Mon: 2,
					The: 3,
					Wed: 4,
					Thu: 5,
					Fri: 6,
					Sat: 7
				},

				self = {
					parseTime: function(value) {
						var delimited, subValue;
						time = {
							hour: 0,
							minute: 0,
							second: 0,
							millis: 0
						};

						if (value) {
							delimited = value.split(':');
							if (delimited.length === 3) {
								time.hour = parseInt(delimited[0]);
								time.minute = parseInt(delimited[1]);
								if (delimited[2].indexOf('.') !== -1) {
									subValue = delimited[2].split('.');
									time.second = parseInt(subValue[0]);
									time.millis = parseInt(subValue[1]);
								} else {
									time.second = parseInt(delimited[2]);
									time.millis = 0;
								}
							}
						}
						return self;
					},
					parseDate: function(value) {
						var dateString, delimited, subValue;
						if (core.isNumeric(value)) {
							return self.parseDate(new Date(value));
						} else if (core.isFunction(value.getFullYear)) {
							date = value;
							dateReset();
							return self;
						} else if (matches = regex.timestamp.exec(value)) {
							// 2014-03-25T08:48:21Z or 2014-03-25T08:48:21+08:00
							year = parseInt(matches[1]);
							month = parseInt(matches[2]) - 1;
							day = parseInt(matches[3]);
							time = {
								hour: parseInt(matches[4]),
								minute: parseInt(matches[5]),
								second: parseInt(matches[6]),
								millis: 0
							};
						} else if (core.isString(value)) {
							dateString = value.replace(/\s*\(.*\)$/, ''); // Remove '(string)' such as '(China Standard Time)' at the end of date string
							delimited = dateString.split(' ');
							switch (delimited.length) {
							case 1:
								// 2014-03-25 date only
								if (delimited[0].indexOf('/') !== -1) {
									subValue = delimited[0].split('/');
								} else {
									subValue = delimited[0].split('-');
								}
								month = parseInt(subValue[1]) - 1;
								day = parseInt(subValue[2]);
								year = parseInt(subValue[0]);
								self.parseTime();
								break;
							case 3:
								// 2014-03-25 08:48:21.125 or 2014/03/25 08:48:21.125
								if (delimited[0].indexOf('/') !== -1) {
									subValue = delimited[0].split('/');
								} else {
									subValue = delimited[0].split('-');
								}
								month = parseInt(subValue[1]) - 1;
								day = parseInt(subValue[2]);
								year = parseInt(subValue[1]);
								self.parseTime(delimited[1]);
								break;
							case 6:
								// Tue Mar 25 2014 08:48:21 GMT+0800
								month = monthMap[delimited[1]] || '';
								day = parseInt(delimited[2]);
								year = parseInt(delimited[3]);
								self.parseTime(delimited[4]);
								break;
							default:
								// Not matched
							}
						}
						date = new Date(year, month, day, time.hour, time.minute, time.second, time.millis);
						// Reset the date to current time if date object is invalid
						if (isNaN(date.getTime())) {
							date = new Date();
							dateReset();
						}
						return self;
					},
					getFirstDate: function() {
						return new Date(year, month, 1, 0, 0, 0, 0);
					},
					getLastDate: function() {
						var date = 30;
						if (month % 7 % 2 == 0) {
							date = 31;
						} else if (month == 1) {
							date = (year % 4 == 0) ? 29 : 28;
						}
						return new Date(year, month, date, 23, 59, 59, 0);
					},
					value: function() {
						return date;
					},
					getDateTime: function() {
						return {
							year: year,
							month: month,
							day: day,
							time: time
						};	
					},
					setYear: function(value) {
						year = parseInt(value);
						date = new Date(year, month, day, time.hour, time.minute, time.second, time.millis);

						return self;
					},
					setMonth: function(value) {
						month = (core.isDefined(monthMap[value])) ? monthMap[value] : parseInt(value);
						date = new Date(year, month, day, time.hour, time.minute, time.second, time.millis);

						return self;
					},
					setDay: function(value) {
						day = parseInt(value);
						date = new Date(year, month, day, time.hour, time.minute, time.second, time.millis);

						return self;
					},
					addDay: function(value) {
						value = parseInt(value);
						date = new Date(year, month, day + value, time.hour, time.minute, time.second, time.millis);
						dateReset();

						return self;
					},
					toString: function(format) {
						var regexmap = {
							'yyyy': [false, date.getFullYear()],
							'yyy': [false, date.getFullYear()],
							'yy': [true, 'yyyy'],
							'y': [true, 'yyyy'],
							'MMMM': [false, monthString[date.getMonth()]],
							'MMM': [false, monthString[date.getMonth()].substring(0, 3)],
							'MM': [false, date.getMonth() + 1],
							'M': [true, 'MM'],
							'dddd': [false, weekdayString[date.getDay()]],
							'ddd': [true, 'dddd'],
							'dd': [false, date.getDate()],
							'd': [true, 'd'],
							'hh': [false, date.getHours()],
							'h': [true, 'hh'],
							'HH': [false, date.getHours() % 12],
							'H': [true, 'HH'],
							'mm': [false, date.getMinutes()],
							'm': [true, 'mm'],
							'ss': [false, date.getSeconds()],
							's': [true, 'ss'],
							'tt': [false, (date.getHours() >= 12) ? 'PM' : 'AM'],
							't': [false, (date.getHours() >= 12) ? 'P' : 'A'],
							'q': [false, Math.floor((date.getMonth() + 3) / 3)],
							'f': [false, date.getMilliseconds()]
						};
						return format.replace(regex.dateformat, function(str, pattern, offset, org) {
							var value;
							if (regexmap[pattern]) {
								if (regexmap[pattern][0]) {
									return regexmap[regexmap[pattern][1]][1];
								} else {
									value = regexmap[pattern][1];
									return (pattern.length === 1 || !core.isNumeric(value)) ? value : (new Array(pattern.length + 1).join('0') + value).substr((value + '').length);
								}
							}
							return pattern;
						});
					}
				};

				function dateReset() {
					year = date.getFullYear();
					month = date.getMonth();
					day = date.getDate();
					time = {
						hour: date.getHours(),
						minute: date.getMinutes(),
						second: date.getSeconds(),
						millis: date.getMilliseconds()
					};
				}
			self.parseDate(value);
			return self;
		}
	});
	// jDeferred Callback Stack object

	function Stack(options) {
		var queue = [],
			cachedOptions = {},
			delimited = null,
			memory = null,
			self = {
				add: function() {
					var index = 0,
						length = arguments.length;
					for (; index < length; index++) {
						if (core.isFunction(arguments[index]) && (!cachedOptions.unique || !core.inArray(queue, arguments[index]))) {
							if (memory) {
								arguments[index].apply(this, memory);
							} else {
								queue.push(arguments[index]);
							}
						} else if (core.isArray(arguments[index])) {
							self.add.apply(this, arguments[index]);
						}
					}
					return this;
				},
				remove: function() {},
				fire: function() {
					self.fireWith(this, arguments);
					return this;
				},
				fireWith: function(reference, args) {
					var index = 0,
						callback;
					memory = args || [];
					memory = (memory.slice) ? memory.slice() : memory;
					if (!cachedOptions.stack) {
						while (callback = queue[index++]) {
							callback.apply(reference, memory);
						}
					} else if (cachedOptions.stack) {
						while (queue.length) {
							queue.shift().apply(reference, memory);
						}
					}
					return this;
				},
				above: function() {
					queue = [];
					return this;
				}
			};
		if (core.isString(options)) {
			delimited = options.split(' ');
			each(delimited, function() {
				cachedOptions[this] = true;
			});
		}
		if (cachedOptions.each) {
			stack = core.clone(queue);
		}
		return self;
	};
	// Define Deferred class
	jet.extend({
		// - jet.Deferred(obj)
		// Create defer uses to invoke callbacks in queue or relay the success or failure state of any synchronous or asynchronous function.
		// @param {jDeferred} obj Extend the current jDeferred object to new jDeferred object
		// @param {Function} obj The callback function that will be execute after deferred
		// @return {jDeferred}
		// @added 1.0.4-Beta
		// - 
		Deferred: function(object) {
			var actions = [
				['done', 'resolve', Stack('stack')],
				['fail', 'reject', Stack('stack')],
				['step', 'process', Stack('')]
			],
				detached = {
					always: function() {
						deferred.done(arguments).fail(arguments).step(arguments);
						return this;
					},
					then: function( /* done, fail, step */ ) {
						var args = arguments;
						return jet.Deferred(function(ref) {
							core.each(actions, function(i, action) {
								deferred[action[0]](function() {
									var result = args[i] && args[i].apply(this, arguments);
									if (result && core.isFunction(result.detach)) {
										// If callback returns deferred object, queue the current deferred object
										result.detach().done(ref.resolve).fail(ref.reject).step(ref.process);
									} else {
										ref.resolveWith(ref.detach, result);
									}
								});
							});
						}).detach();
					},
					detach: function(object) {
						return (object != null) ? extend(object, this) : detached;
					}
				},
				deferred = {};
			each(actions, function() {
				detached[this[0]] = this[2].add;
				// Only non-detach deferred object can be fired.
				deferred[this[1]] = this[2].fire;
				deferred[this[1] + 'With'] = this[2].fireWith;
			});
			// If detached
			// > done, fail, notify, always, then, detach, resolve, resolveWith, reject and rejectWith
			// else
			// > done, fail, notify, always, then, detach
			detached.detach(deferred);
			if (core.isFunction(object)) {
				object.call(deferred, deferred);
			}
			return deferred;
		},
		// - jet.when()
		// Provides a way to execute callback functions based on one or more objects, usually Deferred objects that represent asynchronous events.
		// @return {jDeferred}
		// @added 1.0.4-Beta
		// - 
		when: function() {
			var deferred = jet.Deferred(),
				valuesSet = [
				// Resolve
				Array.prototype.slice.call(arguments)],
				length = valuesSet[0].length,
				deferredSet = [
				// Resolve
				new Array(length),
				// Process
				new Array(length)],
				remaining = length;
			// Process Values
			valuesSet.push(new Array(length));
			each(valuesSet[0], function(i, def) {
				if (def !== null && core.isFunction(def.detach)) { // Check object is deferred object
					each(['done', 'step'], function(set, method) {
						def[method](function(values) {
							deferredSet[set][i] = def;
							valuesSet[set][i] = (arguments.length > 1) ? slice.call(arguments) : values;
							if (set) {
								deferred.processWith(deferredSet[set], valuesSet[set]);
							} else if (!(--remaining)) {
								deferred.resolveWith(deferredSet[set], valuesSet[set]);
							}
						});
					});
					def.fail(deferred.reject);
				} else {
					remaining--;
				}
			});
			// No more deferred object need resolve, resolve the main deferred object
			if (!remaining) {
				deferred.resolveWith(resolveDeferred, resolveValues);
			}
			return deferred.detach();
		}
	});
	// Register css: Hooks
	each('scrollTop scrollLeft'.split(' '), function(method, css) {
		jet.developer(function() {
			this.registerCSSHook(css, function(elements, prop, value) {
				return jet(elements).prop(prop, value);
			});
		});
	});
	//	register Value: Hooks
	jet.developer(function() {
		this.registerValueHook('select', function(element, value) {
			var returns = [];

			if (core.isDefined(value)) {
				value = (!core.isArray(value)) ? [value] : value;
				each(element.options, function() {
					this.selected = core.inArray(value, this.value);
				});
				// Trigger Change event
				jet(element).change();

				return this;
			} else {
				if (element.multiple) {
					each(element.options, function() {
						if (this.selected && !this.disabled && (!core.nodeName(this.parentNode, 'optgroup') || !this.parentNode.disabled)) {
							returns.push(this.value);
						}
					});
					return returns;
				} else {
					return element.options[element.selectedIndex].value;
				}
			}
		});
	});
	each('checkbox radio'.split(' '), function(i, type) {
		jet.developer(function() {
			this.registerValueHook(type, function(element, value) {
				var name = element.name, values;
				
				if (core.isDefined(value)) {
					if (core.isString(value)) {
						value = [value];
					}
					if (core.inArray(value, element.value)) {
						jet(element).attr('checked', 'checked');
					} else {
						jet(element).removeAttr('checked');
					}

					// Trigger Change event
					jet(element).change();

					return this;
				} else {
					if (element.type == 'radio') {
						values = jet('input[name="' + name + '"]:checked').attr('value');
						return values || 'on';
					} else {
						return element.value || 'on';
					}
					return null;
				}
			});
		});
	});
	// Register jUnit Hooks
	each('backgroundColor color'.split(' '), function(i, prop) {
		jet.developer(function() {
			this.registerUnitHook(prop, {
				take: function(percentage) {
					return this.pixel.diff(this.diff, percentage).toHex();
				},
				parseDiff: function(value) {
					this.diff = jColor(value);
					return this;
				},
				init: function(value, element) {
					this.pixel = jColor(value);
					return this;
				}
			});
		});
	});
	each('padding margin'.split(' '), function(i, prop) {
		jet.developer(function() {
			this.registerUnitHook(prop, {
				take: function(percentage) {
					var ref = this,
						val = new Array(4);
					each(this.pixel, function(i, value) {
						val[i] = (ref.pixel[i] + (ref.diff[i] * percentage)) + 'px';
					});
					return val.join(' ');
				},
				init: function(value, element) {
					var valueSet, ref = this;
					this.pixel = new Array(4);
					this.diff = new Array(4);
					each('top right bottom left'.split(' '), function(i, side) {
						ref.pixel[i] = parseFloat(element.css(prop + '-' + side));
					});
					return this;
				},
				parseDiff: function(value) {
					var valueSet = value.split(' '),
						ref = this;
					each('top right bottom left'.split(' '), function(i, side) {
						var pos = (valueSet.length === 1) ? 0 : (valueSet.length === 2) ? 2 : i;
						ref.diff[i] = getStyle(ref.element, prop + '-' + side, valueSet[pos]) - ref.pixel[i];
					});
					return this;
				}
			});
		});
	});
	jet.developer(function() {
		each('height width'.split(' '), function(i, prop) {
			core.registerUnitHook(prop, {
				init: function(value, element) {
					this.pixel = getStyle(element, prop);

					if (isNaN(this.pixel)) this.pixel = element.boxRect()[prop];
					return this;
				}
			});
		});
	});
	// Bind DOM ready event
	(function() {
		var top;
		// Fire queued onload event

		function fire() {
			var index = 0,
				callback;
			while (callback = onLoadEvent[index++]) {
				callback.call(this);
			}
			onLoadEvent = [];
		}
		// DOM Ready on post load
		if (doc.readyState === 'complete') {
			setTimeout(fire);
		} else {
			// Setup DOM Ready Event
			if (win.addEventListener) {
				doc.addEventListener('DOMContentLoaded', function() {
					fire();
				}, false);
			} else {
				top = null;
				try {
					top = win.frameElement === null && doc.documentElement;
				} catch (e) {}
				if (top && top.doScroll) {
					(function poll() {
						if (onLoadEvent.length) {
							try {
								top.doScroll('left');
							} catch (e) {
								return setTimeout(poll, 50);
							}
							fire();
						}
					})();
				}
				doc.onreadystatechange = function() {
					if (doc.readyState === 'complete') {
						doc.onreadystatechange = null;
						fire();
					}
				};
			}
			win.onload = function() {
				fire();
				win.onload = null;
			};
		}
	})();
	win.jet = jet;
})();
