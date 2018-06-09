(function(global) {
	"use strict";
	var win = window,
		doc = document,
		nav = navigator,
		scriptLoad = doc.getElementsByTagName('script'),
		jetScript = scriptLoad[scriptLoad.length - 1],
		queryString = jetScript.src.replace(/^[^\?]+\??/, ''),
		docElem = doc.documentElement,
		JetObject = function() {},
		ary = Array.prototype,
		slice = ary.slice,
		some = ary.some,
		toString = Object.prototype.toString,
		fnToString = Function.prototype.toString,
		Jet, fn,
		onLoadEvent = [],
		onHold = false,
		conflict = null,
		styles = win.getComputedStyle(docElem, ''),
		container = doc.createElement('div'),
		allType = '*/'.concat('*'),
		eventBindmap = {
			'DOMContentLoaded': 'onload'
		},
		propBindmap = {
			'for': 'htmlFor',
			'class': 'className'
		},
		wrapMap = {
			'thead': [1, '<table>', '</table>'],
			'col': [2, '<table><colgroup>', '</colgroup></table>'],
			'tr': [2, '<table><tbody>', '</tbody></table>'],
			'td': [3, '<table><tbody><tr>', '</tr></tbody></table>']
		},
		attrBindmap = {
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
		easingType = '(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|cubic-bezier\\(-?\\d*(?:\\.\\d+)?,\\s?-?\\d*(?:\\.\\d+)?,\\s?-?\\d*(?:\\.\\d+)?,\\s?-?\\d*(?:\\.\\d+)?\\))',
		transitionFormula = new RegExp('([\\w-]+)\\s(\\d*(?:\\.\\d+)?m?s)\\s' + easingType + '\\s(\\d*(?:\\.\\d+)?m?s),?', 'g'),
		regexUnit = /^\s*(?:(\d+(?:\.\d+)?)\s*(em|ex|%|px|cm|mm|in|pt|pc|ch|rem|vh|vw|vmin|vmax)|(auto))\s*$/,
		regexCheckable = /^(checkbox|radio)$/i,
		regexSubmitType = /^(submit|button|image|reset|file)$/i,
		regexSubmitName = /^(input|select|textarea|keygen)$/i,
		regexConstructor = /^\[object .+?Constructor\]$/,
		regexNative = new RegExp('^' + String(toString).replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&').replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'),
		regexTimestamp = /([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})([+-][0-9]{2}:[0-9]{2}|Z)?/,
		regexValidDateTime = /([0-9]{4})-([0-9]{2})-([0-9]{2})(\s([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]{1,3})?)?/,
		regexUTCGMT = /(UTC|GMT)([+-](?:\d+))?/,
		regexTransformMethod = /^(css|backface|duration|delay|easing|rotate(X|Y|Z|3d)?|move(X|Y|Z|3d)?|scale(X|Y|Z|3d)?|skew(X|Y)?)$/;

	wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
	wrapMap.th = wrapMap.td;

	// Implement JetObject become an Array-Like object
	JetObject.prototype = {
		constructor: JetObject,
		push: ary.push,
		indexOf: ary.indexOf,
		forEach: ary.forEach,
		some: ary.some,
		length: 0
	};

	// Search DOMElement by CSS Selector
	function process(selector, context, results) {
		var JetObj = new JetObject();
		results = results || new JetObject();
		context = (context && context.nodeType && context.querySelectorAll) ? context : doc;
		if (results.constructor === JetObject) {
			// If the passed result is a JetObject, define it as current DOM element list
			JetObj = results;
		} else if (fn.isIterator(results)) {
			// If the passed result is an iterator object, extract it
			fn.each(results, function() {
				if (fn.isDOMElement(this)) {
					JetObj.push(this);
				}
			});
		} else if (fn.isDOMElement(results)) {
			// If the passed result is a DOM element, add to current DOM element list
			JetObj.push(results);
		}

		if (fn.isString(selector) && selector) {
			selector = selector.trim();
			if (/^<.+>$/.test(selector)) {
				fn.each(fn.build(selector), function() {
					JetObj.push(this);
				});
			} else {
				// If selector is a string, search target elements by css selector
				fn.each(context.querySelectorAll(selector), function() {
					if (!this._added) {
						// Mark the found DOM element as added to avoid duplicated
						this._added = true;
						JetObj.push(this);
					}
				});
			}
		} else if (fn.isDOMElement(selector) || fn.isWindow(selector) || fn.isDocument(selector)) {
			// If the selector is a DOM element, add to current DOM element list
			if (!selector._added) {
				selector._added = true;
				JetObj.push(selector);
			}
		} else if (typeof selector === 'object' && selector !== null) {
			// If the selector is an iterator object, extract it
			fn.each(selector, function() {
				JetObj = process(this, context, JetObj);
			});
		} else if (fn.isCallable(selector)) {
			// If the selector is a callback, put it into DOMReady Pool
			fn.ready(selector);
		}
		return JetObj;
	}

	Jet = function(selector, context, results) {
		var JetObj = process(selector, context, results);
		// Remove all added marker
		fn.each(JetObj, function() {
			delete this._added;
		});
		return JetObj;
	};

	/** @namespace Jet */
	fn = {
		constructor: Jet,

		/**
		 * Get the excetly object type
		 *
		 * @param      {*}       object  An object you need to identify the
		 *                               object type.
		 * @return     {String}  The type name.
		 */
		getType: function(object) {
			var dataType = toString.call(object);
			dataType = dataType.substr(1, dataType.length - 2);
			return dataType.split(' ')[1];
		},
		/**
		 * Check the object's type
		 *
		 * @param      {*}        object    An object you need to identify for.
		 * @param      {String}   datatype  A string for identitfy.
		 * @return     {Boolean}  True if type, False otherwise.
		 */
		isType: function(object, datatype) {
			return this.getType(object).toLowerCase() == datatype.toLowerCase();
		},
		/**
		 * Check to see if an object is an object
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's an object
		 * @return     {Boolean}  True if object, False otherwise.
		 */
		isObject: function(object) {
			return typeof object == 'object';
		},
		/**
		 * Check to see if an object is a plain object (created using “{}” or
		 * “new Object”).
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a plaing object
		 * @return     {Boolean}  True if plain object, False otherwise.
		 */
		isPlainObject: function(object) {
			if (typeof object == 'object' && object !== null) {
				if (typeof Object.getPrototypeOf == 'function') {
					var proto = Object.getPrototypeOf(object);
					return proto === Object.prototype || proto === null;
				}
				return toString.call(object) == '[object Object]';
			}
			return false;
		},
		isArray: function(object) {
			return (object && Array.isArray(object));
		},
		/**
		 * Check to see if an object is a DOM element
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a DOM Element
		 * @return     {Boolean}  True if dom element, False otherwise.
		 */
		isDOMElement: function(object) {
			return object && (object.nodeType == 1 || object.nodeType == 9 || object.nodeType == 11);
		},
		/**
		 * Check to see if an object is a valid number. NaN and infinite is not
		 * a valid number
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a number
		 * @return     {Boolean}  True if number, False otherwise.
		 */
		isNumber: function(object) {
			return (typeof object == 'number' && isFinite(object));
		},
		/**
		 * Check to see if an object is a string
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a string
		 * @return     {Boolean}  True if string, False otherwise.
		 */
		isString: function(object) {
			return (typeof object == 'string');
		},
		/**
		 * Check to see if an object is a boolean
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a boolean
		 * @return     {Boolean}  True if boolean, False otherwise.
		 */
		isBoolean: function(object) {
			return (typeof object == 'boolean');
		},
		/**
		 * Check the element is callable function or not
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a callable function
		 * @return     {Boolean}  True if callable, False otherwise.
		 */
		isCallable: function(object) {
			return (typeof object == 'function');
		},
		/**
		 * Check to see if an object is a native function
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a native function
		 * @return     {Boolean}  True if native, False otherwise.
		 */
		isNative: function(object) {
			var type = typeof object;
			return type == 'function' ? regexNative.test(fnToString.call(object)) : (object && type == 'object' && regexConstructor.test(toString.call(object))) || false;
		},
		/**
		 * Check to see if an object is iterable
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a iterable object.
		 * @return     {Boolean}  True if iterator, False otherwise.
		 */
		isIterator: function(object) {
			return (object && (fn.isNative(object.some) || fn.isNative(object.forEach)));
		},
		/**
		 * Check to see if an object is defined
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's defined
		 * @return     {Boolean}  True if defined, False otherwise.
		 */
		isDefined: function(object) {
			return (typeof object != 'undefined');
		},
		/**
		 * Check to see if an object is a Document
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a document element
		 * @return     {Boolean}  True if document, False otherwise.
		 */
		isDocument: function(object) {
			return (object && object.nodeType && object.nodeType === 9);
		},
		/**
		 * Check to see if an object is a Window
		 *
		 * @param      {*}        object  The object that will be checked to see
		 *                                if it's a window element
		 * @return     {Boolean}  True if window, False otherwise.
		 */
		isWindow: function(object) {
			return object && object.document && object.location && object.alert && object.setInterval;
		},
		/**
		 * Executes a provided function once per iterator element or plain
		 * object element.
		 *
		 * @param      {*}         object    The iterator object you need to
		 *                                   walk through
		 * @param      {Function}  callback  The function to execute for each
		 *                                   element
		 */
		each: function(object, callback) {
			if (fn.isNative(object.some)) {
				object.some(function(element, index, object) {
					var result = callback.call(element, index, element, object);
					return (!fn.isDefined(result)) ? false : !result;
				});
			} else if (fn.isNative(object.forEach)) {
				var skip = false;
				object.forEach(function(element, index, object) {
					if (!skip) {
						var result = callback.call(element, index, element, object);
						if (fn.isDefined(result) && !result) {
							skip = true;
						}
					}
				});
			} else if (fn.isNative(object.item)) {
				fn.each(slice.call(object), callback);
			} else if (this.isObject(object)) {
				for (var index in object) {
					var result = callback.call(object[index], index, object[index], object);
					if (fn.isDefined(result) && !result) {
						break;
					}
				}
			}
		},
		/**
		 * Convert a string to camel case. Space, Hyphen or Underscore will be removed and convert the next character to upper case
		 *
		 * @param      {String}   text    A text to convert camel case
		 * @return     {Boolean}  { description_of_the_return_value }
		 */
		camelCase: function(text) {
			return (text) ? text.toLowerCase().replace(/[\-_\s]([\da-z])/gi, function(str, match) {
				return match.toUpperCase();
			}) : '';
		},
		/**
		 * Find the element's document and window
		 *
		 * @param      {*}   element  A DOMElement to obtain their owner
		 * @return     {*}   document & window
		 */
		owner: function(element) {
			var ownerDoc = element.ownerDocument || doc;
			return {
				document: ownerDoc,
				window: ownerDoc.defaultView || ownerDoc.parentWindow
			};
		},
		/**
		 * Get the current selected text
		 *
		 * @return     {String}
		 */
		getSelection: function() {
			var activeEl = doc.activeElement,
				activeElTagName = (activeEl) ? activeEl.tagName.toLowerCase() : null;

			if (/(?:textarea|input)/.test(activeElTagName) && /^(?:text|search|password|tel|url)$/i.test(activeEl.type) && (fn.isNumber(activeEl.selectionStart))) {
				return activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
			} else if (window.getSelection) {
				return window.getSelection().toString();
			}
			return '';
		},
		/**
		 * Create a deep copy of the object
		 *
		 * @param      {*}   object  The object you need to clone for.
		 * @return     {*}   Copy of this object.
		 */
		clone: function(object) {
			var newObject;
			if (!fn.isDefined(object) || !object) return object;
			if (object instanceof Date) {
				return new Date(object.getTime());
			} else if (fn.isDefined(object.cloneNode)) {
				return object.cloneNode(true);
			} else if (fn.isArray(object)) {
				return slice.call(object);
			} else if (fn.isObject(object)) {
				if (object.constructor) {
					newObject = object.constructor();
				} else {
					newObject = {};
				}
				fn.each(object, function(key, val) {
					newObject[key] = fn.clone(val);
				});
				return newObject;
			} else {
				return object;
			}
		},
		/**
		 * Make html dom element by string
		 *
		 * @param      {String}     html    A HTML string to convert as DOM
		 *                                  element
		 * @param      {boolean}    [deep]    If true, all DOM element will be
		 *                                  added to list, else the top level
		 *                                  only
		 * @return     {JetObject}  The Jet Object
		 */
		build: function(html, deep) {
			var object = new JetObject(),
					matches = (/<([\w:]+)/.exec(html)),
					tagname = ((matches !== null) ? matches[1] : '').toLowerCase(),
					wrap = wrapMap[tagname],
					cont = container,
					i = 0;

			if (wrap) {
				html = wrap[1] + html + wrap[2];
			}

			cont.innerHTML = html;
			if (wrap) {
				for (; i < wrap[0]; i++) {
					cont = cont.firstChild;
				}
			}
			fn.each((deep) ? cont.querySelectorAll('*') : cont.children, function() {
				object.push(this.cloneNode(true));
			});
			container.innerHTML = '';
			return object;
		},
		/**
		 * Takes a well-formed JSON string and returns the resulting JavaScript
		 * value.
		 *
		 * @param      {String}  text    The JSON string to parse.
		 * @return     {object}  { description_of_the_return_value }
		 */
		parseJSON: function(text) {
			if (!text || !fn.isString(text)) {
				return null;
			}

			try {
				return JSON.parse(text);
			} catch (e) {
				return null;
			}
		},
		/**
		 * Parses a string into an XML document.
		 *
		 * @param      {String}  text    a well-formed XML string to be parsed
		 * @return     {XMLDOM}  { description_of_the_return_value }
		 */
		parseXML: function(text) {
			var parser;
			if (!text || !fn.isString(text)) {
				return null;
			}
			try {
				parser = new DOMParser();
			} catch ( e ) {
				parser = undefined;
			}
			return (!parser || (parser = parser.parseFromString(text, 'text/xml')).getElementsByTagName('parsererror').length) ? null : parser;
		},
		/**
		 * Executes a provided function once per iterator element or plain
		 * object element, collect all result to output as an Array.
		 *
		 * @param      {object}    object    The object to iterate over.
		 * @param      {Function}  callback  The callback
		 * @return     {Array}     { description_of_the_return_value }
		 */
		walk: function(object, callback) {
			var result = [];
			fn.each(object, function(key) {
				var value = callback.call(this, key, this);
				result.push(value);
			});
			return result;
		},
		comparePosition: function(a, b) {
			return a.compareDocumentPosition ? a.compareDocumentPosition(b) : a.contains ? (a != b && a.contains(b) && 16) + (a != b && b.contains(a) && 8) + (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1) : 0;
		},
		/**
		 * Jet Thread Object provides asynchronous
		 *
		 * @class      Thread (name)
		 * @this       {Thread}
		 * @param      {...(Function|Thread)}  [callback]  The function to be
		 *                                               executed
		 * @return     {Thread}                { description_of_the_return_value }
		 */
		Thread: function(callback) {
			var context,
				subThread = [],
				taskQueue = [],
				status = 'pending',
				bindThread = function(thread) {
					// If this element is a Jet Thread, put it to sub thread list
					thread.wakeup = function() {
						fn.each(subThread, function(key, val) {
							if (val.getStatus() == 'completed') {
								subThread.splice(key, 1);
							}
						});
						finalize();
					};
					subThread.push(thread);
				},
				// Thread finalize action, trigger 'finally' handler when all task is done
				finalize = function() {
					if ((!taskQueue || taskQueue.length === 0) && (!subThread || subThread.length === 0) && pool.length > 0) {
						if (trigger.finally) {
							// If no more task in queue and the 'finally' handler was added, execute it
							var results = [];
							fn.each(pool, function() {
								results.push(this.result);
							});
							trigger.finally.apply((fn.isDefined(context)) ? context : results, results);
						}
						// Clean the pool and reset the binded arguments
						pool = [];
						boundArgs = null;
						status = 'completed';
						// Wake the parent thread up
						if (promise.wakeup) {
							promise.wakeup();
						}
					}
				},
				promise = {
					/**
					 * Add handler to be called when the thread has finished all the
					 * job. Rejected task will return null as result
					 * @memberof   Thread
					 *
					 * @param      {Function}  callback  The callback function to execute
					 *                                   when the thread has completed
					 * @return     {Thread}    { description_of_the_return_value }
					 */
					finally: function(callback) {
						if (fn.isCallable(callback)) {
							trigger.finally = callback;
							finalize();
						}
						return promise;
					},

					/**
					 * Add new callback or Thread
					 * @memberof   Thread
					 *
					 * @param      {Function}  callback  The callback function to
					 *                                   execute, or other Thread to bind
					 *                                   for
					 * @return     {Thread}    { description_of_the_return_value }
					 */
					add: function(callback) {
						if (promise.getStatus() !== 'complete') {
							if (fn.isCallable(callback)) {
								taskQueue.push(seal(callback));
							} else if (callback.constructor == fn.Thread) {
								bindThread(callback);
							}
						}
						return promise;
					},

					/**
					 * Return the status of thread in 'pending', 'running', 'running (on
					 * hold)' and 'completed'
					 * @memberof   Thread
					 *
					 * @return     {String}  The status.
					 */
					getStatus: function() {
						return status;
					}
				},
				boundArgs = null,
				bypass = false,
				trigger = {
					done: null,
					fail: null,
					always: null,
					finally: null
				},
				pool = [],
				pump = function() {
					(function callee(args) {
						if (taskQueue && taskQueue.length) {
							var task = taskQueue.shift();
							if (!bypass) {
								// Take the first job and execute it
								task.apply(callee, args);
							} else {
								task.rejected = task.done = true;
							}
						} else {
							// If no more task in queue, trigger finalize stage
							finalize();
						}
					})(arguments);
				},
				seal = function(closure) {
					// Seal the function into package
					var sealed = function() {
						var action = {
							wait: function() {
								// Pause the task
								sealed.pause = true;
								status = 'running (on hold)';
								return action;
							},
							resume: function() {
								// Resume the task, and trigger 'done' and 'always' handler
								if (sealed.pause) {
									sealed.pause = false;
									status = 'running';
									// If the task has marked as done, trigger 'done' handler
									if (sealed.done) {
										if (arguments.length > 0) {
											sealed.result = slice.call(arguments);
										}
										if (!fn.isArray(sealed.result)) {
											sealed.result = [sealed.result];
										}
										if (trigger.done) {
											trigger.done.apply((fn.isDefined(context)) ? context : sealed.result, sealed.result);
										}
										// Roll the pump
										pump.apply(this, boundArgs);
									}
									if (trigger.always) {
										trigger.always.apply((fn.isDefined(context)) ? context : sealed);
									}
								}
								return action;
							},
							reject: function() {
								// Mark the task as rejected
								sealed.rejected = true;
								sealed.rejectedArg = arguments;
								// Trigger 'fail' and 'always' handler
								if (trigger.fail) {
									trigger.fail.apply((fn.isDefined(context)) ? context : arguments);
								}
								if (trigger.always) {
									trigger.always.apply((fn.isDefined(context)) ? context : sealed);
								}
								return action;
							}
						},
						// Execute the task and get the result
						result = closure.apply(action, arguments);

						// Mark the sealed package has done
						sealed.done = true;
						// Add the sealed package to pool
						pool.push(sealed);
						// If the task is not rejected, put the result to the list for 'finally' handler
						if (!sealed.rejected) {
							sealed.result = result;
							// If the task is not paused, trigger 'done' and 'always' handler
							if (!sealed.pause) {
								if (trigger.done) {
									trigger.done.apply((fn.isDefined(context)) ? context : result, [result]);
								}
								if (trigger.always) {
									trigger.always.apply((fn.isDefined(context)) ? context : sealed);
								}
							}
						}
						// If the task is not paused, pump next task
						if (!sealed.pause) {
							this.apply(this, [arguments]);
						}
					};
					// Define the default property
					sealed.done = false;
					sealed.rejected = false;
					sealed.result = null;
					sealed.pause = false;
					sealed.rejectedArg = null;
					return sealed;
				};
			promise.constructor = fn.Thread;
			fn.each('done fail always'.split(' '), function() {
				var self = this;
				/**
				 * Add handlers to be called when the Thread object is resolved.
				 *
				 * @memberof   Thread
				 * @name       done
				 * @param      {Function}  callback  The callback function to execute
				 *
				 * @return     {Thread}    { description_of_the_return_value }
				 */
				/**
				 * Add handlers to be called when the Thread object is rejected.
				 *
				 * @memberof   Thread
				 * @name       reject
				 * @param      {Function}  callback  The callback function to execute
				 *
				 * @return     {Thread}    { description_of_the_return_value }
				 */
				/**
				 * Add handlers to be called when the Thread object is either
				 * resolved or rejected.
				 *
				 * @memberof   Thread
				 * @name       always
				 * @param      {Function}  callback  The callback function to execute
				 *
				 * @return     {Thread}    { description_of_the_return_value }
				 */
				promise[self] = function(callback) {
					if (fn.isCallable(callback)) {
						// If always handler was added, exeute it either done or fail
						if (self == 'always') {
							fn.each(pool, function() {
								if (this.done && !this.pause) {
									callback.apply(this.result);
								}
							});
							trigger.always = callback;
						} else {
							fn.each(pool, function() {
								// If sealed closure has done and not paused, throw it to handler
								if (this.done && !this.pause) {
									// .fail() will be called if the job has rejected
									// .done() will be called if the job has not rejected
									if (!this.rejected && self == 'done') {
										callback.apply(this.result);
									} else if (this.rejected && self == 'fail') {
										callback.apply(this.rejectedArg);
									}
								}
							});
							trigger[self] = callback;
						}
					}
					return promise;
				};
			});
			fn.each('resolve resolveWith'.split(' '), function() {
				var self = this;
				/**
				 * Resolve a Thread object and call any doneCallbacks with the given
				 * args.
				 *
				 * @memberof   Thread
				 * @name       resolve
				 * @param      {...Object}  [args]  Optional arguments that are
				 *                                  passed to the doneCallbacks.
				 *
				 * @return     {Thread}     { description_of_the_return_value }
				 */
				/**
				 * Resolve a Thread object and call any doneCallbacks with the given
				 * args and refer the object as this.
				 *
				 * @memberof   Thread
				 * @name       resolveWith
				 * @param      {Object}     object  A object refer to doneCallbacks
				 * @param      {...Object}  [args]  Optional arguments that are
				 *                                  passed to the doneCallbacks.
				 *
				 * @return     {Thread}     { description_of_the_return_value }
				 */
				promise[self] = function() {
					var args = slice.call(arguments);
					if (!boundArgs) {
						status = 'running';
						if (self == 'resolveWith' && args.length) {
							context = args.shift();
						}
						boundArgs = args;
						pump.apply(promise, boundArgs);
					}
					return promise;
				};
			});
			// Put all arguments to task list
			fn.each(arguments, function() {
				if (this.constructor == fn.Thread) {
					bindThread(this);
				} else if (fn.isCallable(this)) {
					taskQueue.push(seal(this));
				}
			});
			return promise;
		},
		/**
		 * Create a serialized representation of an array, a plain object, or a
		 * JetObject object suitable for use in a URL query string or Ajax
		 * request.
		 *
		 * @param      {object}  data    An array, a plain object, or a
		 *                               JetObject object to serialize.
		 * @return     {String}  { description_of_the_return_value }
		 */
		param: function(data) {
			var params = [];
			function build(key, value) {
				value = (fn.isCallable(value)) ? value() : value;
				params.push(encodeURIComponent(key) + '=' + encodeURIComponent(value || ''));
			}
			(function run(data, prefix) {
				fn.each(data, function(key, val) {
					if (fn.isIterator(val) || fn.isPlainObject(val)) {
						run(val, (prefix) ? prefix + '[' + ((typeof val == 'object' && val !== null) ? key : '') + ']' : key);
					} else {
						build((prefix) ? prefix + '[' + key + ']' : key, val);
					}
				});
			})(data, '');
			return params.join('&');
		},

		/**
		 * Parse query string into an object
		 *
		 * @param      {String}       query   A query string convert to object
		 * @return     {PlainObject}  { description_of_the_return_value }
		 */
		parseQuery: function(query) {
			var params = {};
			if (!query || !fn.isString(query)) {
				return params;
			}
			var pairs = query.split(/[;&]/);
			fn.each(pairs, function(k) {
				var keyValuePair = this.split('=');
				if (keyValuePair) {
					if (keyValuePair.length == 1) {
						params[unescape(keyValuePair[0])] = true;
					} else {
						params[unescape(keyValuePair[0])] = unescape(keyValuePair[1]).replace(/\+/g, ' ');
					}
				}
			});
			return params;
		},
		/**
		 * Specify a function to execute when the web page is fully loaded.
		 *
		 * @param      {Function}   callback  A function to execute after the
		 *                                    DOM is ready.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		ready: function(callback) {
			var self = this;
			if (fn.isIterator(callback)) {
				fn.each(callback, function() {
					self.ready(this);
				});
			} else {
				if (fn.isCallable(callback)) {
					onLoadEvent.push(callback);
				}
			}
			return this;
		},
		/**
		 * Holds or releases the execution of Jet’s ready event.
		 *
		 * @param      {Boolean}    enable  Indicates whether the ready hold is
		 *                                  being requested or released
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		holdReady: function(enable) {
			if (enable) {
				onHold = true;
			} else {
				if (onHold) {
					onHold = false;
					triggerOnLoad();
				}
			}
			return this;
		},
		/**
		 * Relinquish Jet's control of the Jet variable.
		 *
		 * @return	 {Jet}
		 */
		noConflict: function() {
			if (conflict) {
				global.Jet = conflict;
			}
			return this;
		}
	};

	/**
	 * Contains flags for the useragent, read from navigator.userAgent
	 * @namespace             Jet
	 * @property   {Boolean}  browser.chrome   True if broswer is Chrome, False
	 *                                         otherwise.
	 * @property   {Boolean}  browser.opera    True if broswer is Opera, False
	 *                                         otherwise.
	 * @property   {Boolean}  browser.safari   True if broswer is Safari, False
	 *                                         otherwise.
	 * @property   {Boolean}  browser.firefox  True if broswer is FireFox, False
	 *                                         otherwise.
	 * @property   {Boolean}  browser.msie     True if broswer is Microsoft
	 *                                         Internet Explore, False
	 *                                         otherwise.
	 * @property   {Boolean}  browser.edge     True if broswer is Microsoft
	 *                                         Edge, False otherwise.
	 * @property   {Boolean}  browser.webkit   True if broswer is support webkit
	 *                                         engine, False otherwise.
	 * @property   {String}   browser.vendor   Returns broswer vendor
	 * @property   {String}   browser.prefix   Returns broswer vendor css prefix
	 * @property   {Double}   browser.version  Returns the broswer engine
	 *                                         version
	 */
	fn.browser = {
		chrome: !!win.chrome && !!win.chrome.webstore,
		opera: (!!win.opr && !!win.opr.addons) || !!win.opera || nav.userAgent.indexOf(' OPR/') >= 0,
		safari: toString.call(win.HTMLElement).indexOf('Constructor') > 0 || (!win.safari || safari.pushNotification).toString() === '[object SafariRemoteNotification]',
		firefox: nav.userAgent.indexOf(' Firefox/') >= 0,
		msie: nav.userAgent.indexOf(' MSIE') >= 0,
		edge: nav.userAgent.indexOf(' Edge/') >= 0,
	};
	fn.browser.webkit = 'WebkitAppearance' in docElem.style;
	fn.browser.vendor = (slice.call(win.getComputedStyle(docElem, '')).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
	fn.browser.prefix = '-' + fn.browser.vendor + '-';
	fn.browser.version = (function() {
		var ua = nav.userAgent, matches, webkitVersion;
		if (win.opera){
			return win.opera.version();
		} else {
			if (!!(matches = /AppleWebKit\/(\S+)/.exec(ua))) {
				webkitVersion = matches[1];
				if (!!(matches = /(?:Chrome|Version)\/(\S+)/.exec(ua))) {
					return matches[1];
				} else {
					if (fn.browser.safari) {
						if (webkitVersion < 100){
							return 1;
						} else if (webkitVersion < 312){
							return 1.2;
						} else if (webkitVersion < 412){
							return 1.3;
						} else {
							return 2;
						}
					}
				}
			} else if (!!(matches = (/KHTML\/(\S+)/.exec(ua) || /Konqueror\/([^;]+)/.exec(ua)))) {
				return matches[1];
			} else if (!!(matches = /rv:([^\)]+)\) Gecko\/\d{8}/.exec(ua))) {
				return matches[1];
			} else if (!!(matches = /MSIE ([^;]+)/.exec(ua))) {
				return matches[1];
			}
		}
		return 0;
	})();


	/**
	 * Representation of date and time.
	 *
	 * @class      DateTime (name)
	 * @param      {String|Date|Number}   value   The formated date string,
	 *                                            number or Date object
	 * @return     {(Array|Date|Number)}  { description_of_the_return_value }
	 */
	fn.DateTime = function(value) {
		var dateObject = null,
			datetime = {
				year: 0,
				month: 0,
				day: 0,
				hour: 0,
				minute: 0,
				second: 0,
				millis: 0,
				timezoneOffset: (fn.isDefined(fn.DateTime.defaultTimezoneOffset)) ? fn.DateTime.defaultTimezoneOffset : (new Date()).getTimezoneOffset() / 60
			},
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
			monthMap = {},
			weekdayString = {
				0: 'Sunday',
				1: 'Monday',
				2: 'Theuday',
				3: 'Wednesday',
				4: 'Thursday',
				5: 'Friday',
				6: 'Saturday'
			},
	  		self;

			fn.each(monthString, function(num, month) {
				monthMap[month.substr(0, 3)] = num;
			});

			function parse(value) {
				var dateString, dateDelimited, timeDelimited, subValue, matches, adjustment;
				if (!fn.isDefined(value)) {
					return parse(Date.now());
				} else if (fn.isNumber(value)) {
					return parse(new Date(value));
				} else if (value.constructor == Date) {
					dateObject = value;
					datetime.year = dateObject.getFullYear();
					datetime.month = dateObject.getMonth();
					datetime.day = dateObject.getDate();
					datetime.hour = dateObject.getHours();
					datetime.minute = dateObject.getMinutes();
					datetime.second = dateObject.getSeconds();
					datetime.millis = dateObject.getMilliseconds();
					return self;
				} else if (!!(matches = regexTimestamp.exec(value))) {
					// 2014-03-25T08:48:21Z or 2014-03-25T08:48:21+08:00
					datetime.year = parseInt(matches[1]);
					datetime.month = parseInt(matches[2]) - 1;
					datetime.day = parseInt(matches[3]);
					datetime.hour = parseInt(matches[4]);
					datetime.minute = parseInt(matches[5]);
					datetime.second = parseInt(matches[6]);
					datetime.millis = 0;
					if (matches[7] != 'Z') {
						adjustment = -parseInt(matches[7].split(':')[0]);
					}
				} else if (fn.isString(value)) {
					dateString = value.replace(/\s*\(.*\)$/, ''); // Remove '(string)' such as '(China Standard Time)' at the end of date string
					if (!regexValidDateTime.test(dateString)) {
						return parse(Date.now());
					}
					dateDelimited = dateString.replace(/\s+/, '\s').split(' ');

					if (dateDelimited.length == 1 || dateDelimited.length == 2) {
						subValue = dateDelimited[0].split((dateDelimited[0].indexOf('/') !== -1) ? '/' : '-');
						datetime.month = parseInt(subValue[1]) - 1;
						datetime.day = parseInt(subValue[2]);
						datetime.year = parseInt(subValue[0]);
					} else if (dateDelimited.length == 6) {
						datetime.month = monthMap[dateDelimited[1]] || '';
						datetime.day = parseInt(dateDelimited[2]);
						datetime.year = parseInt(dateDelimited[3]);
					}

					if (dateDelimited.length == 2 || dateDelimited.length == 6) {
						timeDelimited = ((dateDelimited.length == 6) ? dateDelimited[4] : dateDelimited[1]).split(':');
						if (timeDelimited.length > 1) {
							datetime.hour = parseInt(timeDelimited[0]);
							datetime.minute = parseInt(timeDelimited[1]);
							if (timeDelimited.length > 2) {
								subValue = timeDelimited[2].split('.');
								datetime.second = parseInt(subValue[0]);
								datetime.millis = (subValue.length > 1) ? parseInt(subValue[1]) : 0;
							}
						}
					}
				}

				update(adjustment);
				return self;
			}

			self = {
				constructor: fn.DateTime,

				/**
				 * Determines if the date is leap year.
				 * @memberof   DateTime
				 *
				 * @return     {Number}  True if leap year, False otherwise.
				 */
				isLeapYear: function() {
					var year = dateObject.getFullYear();
					return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
				},

				/**
				 * Gets the week of year.
				 * @memberof   DateTime
				 *
				 * @return     {Number}  The week of year.
				 */
				getWeekOfYear: function() {
					var newDate = new Date(dateObject);
					newDate.setHours(0, 0, 0, 0);
					newDate.setDate(newDate.getDate() + 4 - (newDate.getDay() || 7));
					return Math.ceil((((newDate - new Date(newDate.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
				},

				/**
				 * Gets the day of year.
				 * @memberof   DateTime
				 *
				 * @return     {Number}  The day of year.
				 */
				getDayOfYear: function() {
					var month,
						day,
						isLeap = self.isLeapYear(),
						dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334],
						dayOfYear;

					month = dateObject.getMonth();
					day = dateObject.getDate();
					dayOfYear = dayCount[month] + day;
					if (month > 1 && isLeap) {
						dayOfYear++;
					}
					return dayOfYear;
				},

				/**
				 * Gets the frist day.
				 * @memberof   DateTime
				 *
				 * @return     {Date}  The frist day.
				 */
				getFristDay: function() {
					return new Date(datetime.year, datetime.month, 1, 0, 0, 0, 0);
				},

				/**
				 * Gets the last day.
				 * @memberof   DateTime
				 *
				 * @return     {Date}  The last day.
				 */
				getLastDay: function() {
					var dayOfEnd = 30;
					if (datetime.month % 7 % 2 === 0) {
						dayOfEnd = 31;
					} else if (datetime.month == 1) {
						dayOfEnd = (self.isLeapYear()) ? 29 : 28;
					}
					return new Date(datetime.year, datetime.month, dayOfEnd, 23, 59, 59, 0);
				},

				/**
				 * Gets the date object.
				 * @memberof   DateTime
				 *
				 * @return     {Date}  The date.
				 */
				getDate: function() {
					return dateObject;
				},

				/**
				 * Gets the plain object contain year, month, day, hour, minute,
				 * second and millisecond.
				 * @memberof   DateTime
				 *
				 * @return     {PlainObject}  The value.
				 */
				getValue: function() {
					return datetime;
				},

				/**
				 * Sets the timezone offset. If the timezone offset is not equal as
				 * current timezone, the date time will be adjusted
				 * @memberof   DateTime
				 *
				 * @param      {Number}    value   The timezone offset
				 * @return     {DateTime}  { description_of_the_return_value }
				 */
				setTimezoneOffset: function(value) {
					var newTz = -getTimezoneOffset(value), diff = datetime.timezoneOffset - newTz;
					if (diff !== 0) {
						dateObject.setHours(dateObject.getHours() + diff);
						datetime.hour = dateObject.getHours();
						datetime.timezoneOffset = newTz;
					}
					return self;
				},

				/**
				 * Returns date formatted according to given format, stardard or PHP
				 * style
				 * @memberof   DateTime
				 *
				 * @param      {String}  format  The format
				 * @param      {String}  type    The type, php or else
				 * @return     {String}  { description_of_the_return_value }
				 */
				format: function(format, type) {
					if (format && fn.isString(format)) {
						var replacementMap = {};
						if (type == 'php') {
							replacementMap = {
								d: ('0' + dateObject.getDate()).slice(-2),
								D: weekdayString[dateObject.getDay()].substring(0, 3),
								j: dateObject.getDate(),
								l: weekdayString[dateObject.getDay()],
								N: dateObject.getDay() + 1,
								S: (function(day) {
									if (day >= 10 && day <= 19) {
										return 'th';
									} else {
										switch (day % 10) {
											case 1:
												return 'st';
											case 2:
												return 'nd';
											case 3:
												return 'rd';
											default:
												return 'th';
										}
									}
								})(dateObject.getDate()),
								z: self.getDayOfYear(),
								W: self.getWeekOfYear(),
								F: monthString[dateObject.getMonth()],
								m: ('0' + (dateObject.getMonth() + 1)).slice(-2),
								M: monthString[dateObject.getMonth()].substring(0, 3),
								n: dateObject.getMonth() + 1,
								t: (function(month) {
									if (month == 2) {
										return 28 + (self.isLeapYear() ? 1 : 0);
									} else if ([4, 6, 9, 11].indexOf(month) != -1) {
										return 30;
									}
									return 31;
								})(dateObject.getMonth()),
								L: (self.isLeapYear()) ? 1 : 0,
								Y: dateObject.getFullYear(),
								y: ('0' + dateObject.getFullYear()).slice(-2),
								a: (dateObject.getHours() >= 12) ? 'pm' : 'am',
								A: (dateObject.getHours() >= 12) ? 'PM' : 'AM',
								h: ('0' + (dateObject.getHours() % 12)).slice(-2),
								H: ('0' + dateObject.getHours()).slice(-2),
								g: (dateObject.getHours() % 12),
								G: dateObject.getHours(),
								i: ('0' + dateObject.getMinutes()).slice(-2),
								s: ('0' + dateObject.getSeconds()).slice(-2),
								u: dateObject.getMilliseconds(),
								Z: datetime.timezoneOffset * 60 * 60 * -1,
								U: Math.round(dateObject.getTime() / 1000)
							};
							replacementMap.c = [replacementMap.Y, replacementMap.m, replacementMap.d].join('-') + 'T' + [replacementMap.H, replacementMap.i, replacementMap.s].join(':');
							replacementMap.r = replacementMap.D + ', ' + replacementMap.d + ' ' + replacementMap.M + ' ' + replacementMap.Y + ' ' + [replacementMap.H, replacementMap.i, replacementMap.s].join(':') + getTimezone(true) + '00';
						} else {
							replacementMap = {
								yyyy: ('000' + dateObject.getFullYear()).slice(-4),
								yyy: ('00' + dateObject.getFullYear()).slice(-4),
								yy: ('0' + dateObject.getFullYear()).slice(-2),
								y: ('' + dateObject.getFullYear()).slice(-2),
								MMMM: monthString[dateObject.getMonth()],
								MMM: monthString[dateObject.getMonth()].substring(0, 3),
								MM: ('0' + (dateObject.getMonth() + 1)).slice(-2),
								M: dateObject.getMonth() + 1,
								dddd: weekdayString[dateObject.getDay()],
								ddd: weekdayString[dateObject.getDay()].substring(0, 3),
								dd: ('0' + (dateObject.getDate())).slice(-2),
								d: dateObject.getDate(),
								hh: ('0' + ((dateObject.getHours() % 12))).slice(-2),
								h: (dateObject.getHours() % 12),
								HH: ('0' + dateObject.getHours()).slice(-2),
								H: dateObject.getHours(),
								mm: ('0' + dateObject.getMinutes()).slice(-2),
								m: dateObject.getMinutes(),
								ss: ('0' + dateObject.getSeconds()).slice(-2),
								s: dateObject.getSeconds(),
								tt: (dateObject.getHours() >= 12) ? 'PM' : 'AM',
								t: (dateObject.getHours() >= 12) ? 'P' : 'A',
								q: Math.floor((dateObject.getMonth() + 3) / 3),
								f: dateObject.getMilliseconds()
							};
						}

						return format.replace(new RegExp("((?:\\\\\\\\)*(?:\\\\.)?)(" + Object.keys(replacementMap).join('|') + ')', 'g'), function(fullmatch, escaped, pattern, offset, original) {
							if (fn.isDefined(replacementMap[pattern])) {
								return escaped + replacementMap[pattern];
							}
							return fullmatch;
						});
					}
					return '';
				}
			};

		fn.each(['day', 'month', 'year', 'hour', 'minute', 'second', 'millis'], function(i) {
			var name = this.charAt(0).toUpperCase() + this.slice(1), prop = this;
			/**
			 * Resets the current year of the DateTime object to a different
			 * year.
			 * @memberof   DateTime
			 *
			 * @name       setYear
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current month of the DateTime object to a different
			 * month.
			 * @memberof   DateTime
			 *
			 * @name       setMonth
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current day of the DateTime object to a different day.
			 * @memberof   DateTime
			 *
			 * @name       setDay
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current hour of the DateTime object to a different
			 * hour.
			 * @memberof   DateTime
			 *
			 * @name       setHour
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current minute of the DateTime object to a different
			 * minute.
			 * @memberof   DateTime
			 *
			 * @name       setMinute
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current second of the DateTime object to a different
			 * second.
			 * @memberof   DateTime
			 *
			 * @name       setSecond
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Resets the current millisecond of the DateTime object to a
			 * different millisecond.
			 * @memberof   DateTime
			 *
			 * @name       setMillis
			 * @param      {Number}  value   { parameter_description }
			 * @return     {String}  { description_of_the_return_value }
			 */
			self['set' + name] = function(value) {
				datetime[prop] = parseInt(value);
				update();

				return self;
			};
			/**
			 * Adds the specified year to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addYear
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified month to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addMonth
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified day to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addDay
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified hour to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addHour
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified minute to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addMinute
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified second to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addSecond
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			/**
			 * Adds the specified millisecond to the current DateTime object.
			 * @memberof   DateTime
			 *
			 * @name       addMillis
			 * @param      {Number}  value
			 * @return     {String}  { description_of_the_return_value }
			 */
			self['add' + name] = function(value) {
				datetime[prop] += parseInt(value);
				update();

				return self;
			};
		});

		function getTimezone(stringformat) {
			var tz = datetime.timezoneOffset;
			if (stringformat) {
				tz = (tz < 0) ? '+' + ('0' + (tz * -1)).slice(-2) : '+' + ('0' + tz).slice(-2);
			}
			return tz;
		}

		function update(adjustment) {
			dateObject = new Date(datetime.year, datetime.month, datetime.day, datetime.hour, datetime.minute, datetime.second, datetime.millis);
			if (fn.isDefined(adjustment)) {
				dateObject.setHours(dateObject.getHours() + adjustment);
				dateObject.setHours(dateObject.getHours() - datetime.timezoneOffset);
			}

			datetime.year = dateObject.getFullYear();
			datetime.month = dateObject.getMonth();
			datetime.day = dateObject.getDate();
			datetime.hour = dateObject.getHours();
			datetime.minute = dateObject.getMinutes();
			datetime.second = dateObject.getSeconds();
			datetime.millis = dateObject.getMilliseconds();
		}

		parse(value);
		return self;
	};

	function getTimezoneOffset(value) {
		var matches;
		if (value == 'EST') {
			value = -3;
		} else if (!!(matches = regexUTCGMT.exec(value))) {
			value = (matches[2]) ? parseInt(matches[2]) : 0;
		} else if (value == 'ET') {
			value = -4;
		} else if (value == 'PST') {
			value = -8;
		} else {
			value = parseInt(value);
			value = (isNaN(value)) ? 0 : value;
		}
		return value;
	}

	// CSS3 Animation
	var support3D = null,
		transformStyle = null,
		transformKeyframe = null;

	/**
	 * The class of CSS3 KeyFrame Rule
	 *
	 * @class      Keyframe (name)
	 * @param      {String}    name    The animation name
	 * @return     {KeyFrame}  { description_of_the_return_value }
	 */
	fn.Keyframe = function(name) {
		if (transformKeyframe === null) {
			transformKeyframe = {};
			doc.head.appendChild(doc.createElement('style'));
			transformStyle = document.styleSheets[document.styleSheets.length - 1];

			var ss = doc.styleSheets;
			fn.each(ss, function() {
				if (this.cssRules) {
					fn.each(this.cssRules, function() {
						if (this.type == win.CSSRule.KEYFRAMES_RULE || this.type == win.CSSRule.WEBKIT_KEYFRAMES_RULE) {
							transformKeyframe[this.name] = this;
						}
					});
				}
			});
		}

		if (!fn.isDefined(transformKeyframe[name])) {
			var keyframesSyntax = '@' + (fn.browser.webkit ? '-webkit-' : '') + 'keyframes ' + name + '{}', index = transformStyle.cssRules.length;
			transformStyle.insertRule(keyframesSyntax, index);
			transformKeyframe[name] = transformStyle.cssRules[index];
		}

		return (function(keyform) {
			var action = {
				constructor: fn.Keyframe,

				/**
				 * Gets the animation name.
				 *
				 * @name       getName
				 * @memberof   Keyframe
				 *
				 * @return     {String}  The name.
				 */
				getName: function() {
					return name;
				},

				/**
				 * Add 1 Transform object the specified frame
				 *
				 * @name       add
				 * @memberof   Keyframe
				 *
				 * @param      {Number}     frame   The index of the frame (0-100)
				 * @param      {Transform}  object  The Transform object
				 * @return     {Keyframe}   { description_of_the_return_value }
				 */
				add: function(frame, object) {
					if (object && object.constructor == fn.Transform) {
						frame = parseFloat(frame);
						if (frame < 0) {
							frame = 0;
						}
						keyform.appendRule(frame + '% { ' + object.getRule() + '}');
					}
					return action;
				},

				/**
				 * Remove the specified frame
				 *
				 * @name       remove
				 * @memberof   Keyframe
				 *
				 * @param      {Number}    frame   The index of the frame (0-100)
				 * @return     {Keyframe}  { description_of_the_return_value }
				 */
				remove: function(frame) {
					frame = parseFloat(frame);
					if (frame < 0) {
						frame = 0;
					}
					keyform.deleteRule(frame + '%');
					return action;
				}
			};
			return action;
		})(transformKeyframe[name]);
	};

	/**
	 * The Transform class uses in Keyframe or animate
	 *
	 * @class      Transform (name)
	 * @param      {Function}   settings  The Transform settings in Plain Object
	 * @return     {Transform}  { description_of_the_return_value }
	 */
	fn.Transform = function(settings) {
		var cssProp = {},
			backface = null,
			duration = 0,
			delay = 0,
			easing = 'linear',
			elements = null,
			self = {
				constructor: fn.Transform,

				/**
				 * Set the Transform setting by a Plain Object
				 * @memberof   Transform
				 *
				 * @param      {PlainObject}  settings  A set of Transform setting
				 * @return     {Transform}    { description_of_the_return_value }
				 */
				set: function(settings) {
					if (fn.isPlainObject(settings)) {
						fn.each(settings, function(name, val) {
							if (regexTransformMethod.test(name)) {
								self[name].apply(self, (fn.isArray(val)) ? val : [val]);
							}
						});
					}
					commit();
					return self;
				},

				/**
				 * Set the animation time
				 * @memberof   Transform
				 *
				 * @param      {Number}  value   A string or number determining how
				 *                               long the transform animation will
				 *                               run.
				 * @return     {Transform}  { description_of_the_return_value }
				 */
				duration: function(value) {
					duration = parseInt(value) || 0;
					commit();
					return self;
				},


				/**
				 * Set the delay time
				 * @memberof   Transform
				 *
				 * @param      {Number}  value   A string or number determining how
				 *                               long the transform animation will
				 *                               delay to run.
				 * @return     {Transform}  { description_of_the_return_value }
				 */
				delay: function(value) {
					delay = parseInt(value) || 0;
					commit();
					return self;
				},


				/**
				 * Set the easing function to use for the transition.
				 * @memberof   Transform
				 *
				 * @param      {String}  value   A string indicating which easing
				 *                               function to use for the transition.
				 * @return     {Transform}  { description_of_the_return_value }
				 */
				easing: function(value) {
					if (!value || !(new RegExp(easingType)).test(value)) {
						easing = 'linear';
					} else {
						easing = value;
					}
					commit();
					return self;
				},

				/**
				 * Gets the CSS rules including css style and transform style.
				 * @memberof   Transform
				 *
				 * @param      {DOMElement}  elem    Used to call in from callback
				 *                                   function
				 * @return     {String}      The rule.
				 */
				getRule: function(elem) {
					var cssRule = fn.browser.prefix + 'transform: ' + getTransformSyntax() + ';';
					fn.each(cssProp, function(prop, value) {
						if (!fn.isCallable(value) || (fn.isCallable(value) && fn.isDOMElement(elem))) {
							cssRule += prop + ': ' + ((fn.isCallable(value)) ? value.call(elem) : value);
						}
					});
					return cssRule;
				},

				/**
				 * Set ot get the backface visibility setting
				 * @memberof   Transform
				 *
				 * @param      {boolean}  enable  A Boolean indicating whether to
				 *                                show the backface
				 * @return     {Transform}   { description_of_the_return_value }
				 */
				backface: function(enable) {
					if (fn.isDefined(enable)) {
						backface = !!enable;
						commit();
						return self;
					} else {
						return backface;
					}
				},

				/**
				 * Set one or more CSS properties for every matched element in
				 * Transform. Only works n Keyframe
				 * @memberof   Transform
				 *
				 * @param      {String}           css     A CSS property or an array
				 *                                        of one or more CSS
				 *                                        properties.
				 * @param      {object|callback}  value   A value to set for the
				 *                                        property or a function
				 *                                        returning the value to
				 *                                        set. this is the element
				 *                                        passed from getRule.
				 * @return     {Transform}        { description_of_the_return_value }
				 */
				css: function(css, value) {
					if (elements) {
						elements.css(css, value);
					} else {
						if (fn.isPlainObject(css)) {
							fn.each(css, function(style, val) {
								self.css(style, val);
							});
						} else {
							if (fn.isDefined(value)) {
								fn.each(this, function() {
									cssProp[css] = value;
								});
							}
						}
					}
					return self;
				},


				/**
				 * Bind to specified elements
				 * @memberof   Transform
				 *
				 * @param      {DOMElement}  elem    One or more element to bind for
				 * @return     {Transform}    { description_of_the_return_value }
				 */
				bind: function(elem) {
					if (fn.isDOMElement(elem)) {
						elem = Jet(elem);
					}
					if (elem.constructor == JetObject) {
						elements = elem;
						elem.data('transform', self, true);
						commit();
					}
					return self;
				}
			},
			property = {
				rotate: {},
				skew: {},
				move: {},
				scale: {}
			};

		function getTransformSyntax() {
			var cssList = [];
			fn.each(property, function(param, values) {
				var keys = Object.keys(values), dimension;

				param = (param == 'move') ? 'translate' : param;
				// Use 3D
				if (keys.length > 0) {
					if (fn.isDefined(values.Z) && support3D) {
						if (param == 'rotate' && values.degree) {
							cssList.push(param + '3d(' + values.X + ', ' + values.Y + ', ' + values.Z + ', ' + values.degree + ')');
						} else {
							cssList.push(param + '3d(' + values.X + ', ' + values.Y + ', ' + values.Z + ')');
						}
					} else {
						if (keys.length == 1) {
							dimension = Object.keys(values)[0];
							cssList.push(param + dimension + '(' + values[dimension] + ')');
						} else {
							cssList.push(param + '(' + values.X + ', ' + values.Y + ')');
						}
					}
				}
			});
			return cssList.join(' ');
		}

		function commit() {
			// When the Transform has bound elements, update the css style when value has changed
			if (elements) {
				elements.css('transform', getTransformSyntax());

				if (backface !== null) {
					elements.css(((fn.browser.webkit) ? '-webkit-' : '') + 'backface-visibility', (!backface) ? 'hidden' : '');
				}

				if (Object.keys(cssProp).length > 0) {
					elements.css(cssProp);
				}

				if (duration > 0) {
					// Fix some browser will play the animation from default value if the duration is set
					setTimeout(function() {
						fn.each(elements, function() {
							var matches, transition = {};
							while (!!(matches = transitionFormula.exec(Jet(this).css('transition')))) {
								transition[matches[1]] = matches[0];
							}
							transition.transform = 'transform ' + (((duration > 0) ? duration : 0) / 1000) + 's ' + easing + ' ' + (((delay > 0) ? delay : 0) / 1000) + 's';
							delete transition.all;
							transition = Object.keys(transition).map(function (key) {
								return transition[key];
							}).join(', ');
							Jet(this).css('transition', transition);
						});
					}, 0);
				}
			}
		}

		if (support3D === null) {
			var div = doc.createElement('div');

			support3D = false;

			if (fn.isDefined(div.style.perspective)) {
				support3D = true;
			} else {
				fn.each(support3D, function() {
					if (fn.isDefined(div.style[this + 'Perspective'])) {
						support3D = true;
						return false;
					}
				});
			}
		}

		fn.each(['rotate', 'skew', 'move', 'scale'], function(i, method) {
			var unit = '';
			if (method == 'rotate' || method == 'skew') {
				unit = 'deg';
			} else if (method == 'move') {
				unit = 'px';
			}
			/**
			 * Set the X and Y value on rotate
			 * @memberof   Transform
			 *
			 * @name       rotate
			 *
			 * @param      {Number}  x    X-asis value
			 * @param      {Number}  y    Y-asis value
			 * @return     {Transform}    { description_of_the_return_value }
			 */
			/**
			 * Set the X and Y value on skew
			 * @memberof   Transform
			 *
			 * @name       skew
			 *
			 * @param      {Number}  x    X-asis value
			 * @param      {Number}  y    Y-asis value
			 * @return     {Transform}    { description_of_the_return_value }
			 */
			/**
			 * Set the X and Y value on scale
			 * @memberof   Transform
			 *
			 * @name       scale
			 *
			 * @param      {Number}  x    X-asis value
			 * @param      {Number}  y    Y-asis value
			 * @return     {Transform}    { description_of_the_return_value }
			 */
			/**
			 * Set the X and Y value on translate
			 * @memberof   Transform
			 *
			 * @name       move
			 *
			 * @param      {Number}  x    X-asis value
			 * @param      {Number}  y    Y-asis value
			 * @return     {Transform}    { description_of_the_return_value }
			 */
			self[method] = function(x, y) {
				property[method].X = (parseFloat(x) || 0) + unit;
				property[method].Y = (parseFloat(y) || 0) + unit;
				commit();
				return self;
			};
			fn.each(['X', 'Y', 'Z'], function(i, dimension) {
				if (this != 'Z' || (this == 'Z' && (method == 'move' || method == 'scale'))) {
					/**
					 * Set the X value on rotateX
					 * @memberof   Transform
					 *
					 * @name       rotateX
					 *
					 * @param      {Number}     x       X-asis value
					 * @return     {Transform}  { description_of_the_return_value }
					 */
					/**
					 * Set the Y value on rotateY
					 * @memberof   Transform
					 *
					 * @name       rotateY
					 *
					 * @param      {Number}  y    Y-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Z value on rotateZ
					 * @memberof   Transform
					 *
					 * @name       rotateZ
					 *
					 * @param      {Number}  z    Z-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the X value on skewX
					 * @memberof   Transform
					 *
					 * @name       skewX
					 *
					 * @param      {Number}  x    X-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Y value on skewY
					 * @memberof   Transform
					 *
					 * @name       skewY
					 *
					 * @param      {Number}  y    Y-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the X value on scaleX
					 * @memberof   Transform
					 *
					 * @name       scaleX
					 *
					 * @param      {Number}  x    X-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Y value on scaleY
					 * @memberof   Transform
					 *
					 * @name       scaleY
					 *
					 * @param      {Number}  y    Y-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Z value on scaleZ
					 * @memberof   Transform
					 *
					 * @name       scaleZ
					 *
					 * @param      {Number}  z    Z-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the X value on translateX
					 * @memberof   Transform
					 *
					 * @name       moveX
					 *
					 * @param      {Number}  x    X-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Y value on translateY
					 * @memberof   Transform
					 *
					 * @name       moveY
					 *
					 * @param      {Number}  y    Y-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					/**
					 * Set the Z value on translateZ
					 * @memberof   Transform
					 *
					 * @name       moveZ
					 *
					 * @param      {Number}  z    Z-asis value
					 * @return     {Transform}    { description_of_the_return_value }
					 */
					self[method + dimension] = function(value) {
						value = (parseFloat(value) || 0) + unit;
						property[method][dimension] = value;
						commit();
						return self;
					};
					if (this == 'Z') {
						/**
						 * Set the X, Y, Z value on skew3d
						 * @memberof   Transform
						 *
						 * @name       skew3d
						 *
						 * @param      {Number}     x       X-asis value
						 * @param      {Number}     y       Y-asis value
						 * @param      {Number}     z       Z-asis value
						 * @return     {Transform}  { description_of_the_return_value }
						 */
						/**
						 * Set the X, Y, Z value on scale3d
						 * @memberof   Transform
						 *
						 * @name       scale3d
						 *
						 * @param      {Number}     x       X-asis value
						 * @param      {Number}     y       Y-asis value
						 * @param      {Number}     z       Z-asis value
						 * @return     {Transform}  { description_of_the_return_value }
						 */
						/**
						 * Set the X, Y, Z value on translate3d
						 * @memberof   Transform
						 *
						 * @name       move3d
						 *
						 * @param      {Number}  x    X-asis value
						 * @param      {Number}  y    Y-asis value
						 * @param      {Number}  z    Z-asis value
						 * @return     {Transform}    { description_of_the_return_value }
						 */
						self[method + '3d'] = function(x, y, z) {
							property[method].X = (parseFloat(x) || 0) + unit;
							property[method].Y = (parseFloat(y) || 0) + unit;
							property[method].Z = (parseFloat(z) || 0) + unit;
							commit();
							return self;
						};
					}
				}
			});
		});

		/**
		 * Set the X, Y, Z and degree value on rotate3d
		 * @memberof   Transform
		 * @name       rotate3d
		 *
		 * @param      {Number}     x       X-asis value
		 * @param      {Number}     y       Y-asis value
		 * @param      {Number}     z       Z-asis value
		 * @param      {Number}     degree  Rotate degree
		 * @return     {Transform}  { description_of_the_return_value }
		 */
		self.rotate3d = function(x, y, z, degree) {
			property.rotate.X = (parseFloat(x) || 0);
			property.rotate.Y = (parseFloat(y) || 0);
			property.rotate.Z = (parseFloat(z) || 0);
			property.rotate.degree = (parseFloat(degree) || 0) + 'deg';
			commit();
			return self;
		};

		if (settings) {
			var boundSetting = null;
			if (fn.isDOMElement(settings)) {
				settings = Jet(settings);
			}
			if (settings.constructor == JetObject) {
				if (!!(boundSetting = settings.data('transform'))) {
					return boundSetting;
				}
				return self.bind(settings);
			}
		}

		return self.set(settings);
	};

	/**
	 * Sets the default timezone offset.
	 *
	 * @name       setDefaultTimezoneOffset
	 * @memberof   DateTime
	 *
	 * @param      {Number}  value   The timezone offset in hour
	 */
	fn.DateTime.setDefaultTimezoneOffset = function(value) {
		fn.DateTime.defaultTimezoneOffset = -getTimezoneOffset(value);
	};

	var ajaxSettings = {
		cached: {},
		default: {
			url: location.href,
			type: 'GET',
			processData: true,
			async: true,
			contentType: 'application/x-www-form-urlencoded; charset=UTF-8',

			/* Default Null */
			timeout: 0,
			data: null,
			dataType: null,
			username: null,
			password: null,
			cache: null,
			headers: {},

			accepts: {
				'*': allType,
				text: 'text/plain',
				html: 'text/html',
				xml: 'application/xml, text/xml',
				json: 'application/json, text/javascript'
			},
			converters: {
				'* text': win.String,
				'text html': true,
				'text json': fn.parseJSON,
				'text xml': fn.parseXML
			}
		}
	};
	ajaxSettings._default = fn.clone(ajaxSettings.default);

	/**
	 * Setup the default ajax setting
	 *
	 * @name       ajaxSetup
	 *
	 * @param      {String}     param   The setting parameter
	 * @param      {*}          value   The setting value
	 * @return     {JetObject}  { description_of_the_return_value }
	 */
	fn.ajaxSetup = function(param, value) {
		if (fn.isPlainObject(param)) {
			fn.each(param, fn.ajaxSetup);
		} else {
			if (fn.isDefined(ajaxSettings.default[param])) {
				ajaxSettings.default[param] = value;
			}
		}
		return this;
	};

	/**
	 * Resets to default ajax setting
	 * @name       ajaxReset
	 *
	 * @return     {JetObject}  { description_of_the_return_value }
	 */
	fn.ajaxReset = function() {
		ajaxSettings.default = fn.clone(ajaxSettings._default);
		return this;
	};

	/**
	 * Perform an asynchronous HTTP (Ajax) request.
	 *
	 * @name       ajax
	 *
	 * @param      {String}       url       A url to perform an asynchronous
	 *                                      HTTP
	 * @param      {PlainObject}  settings  A plain object including url and
	 *                                      setting
	 * @return     {Thread}       { description_of_the_return_value }
	 */
	fn.ajax = function(url, settings) {
		if (fn.isPlainObject(url)) {
			settings = url;
			url = settings.url;
		}
		if (!fn.isPlainObject(settings)) {
			settings = ajaxSettings.default;
		} else {
			fn.each(ajaxSettings.default, function(key, val) {
				if (key != 'headers' && key != 'accepts' && key != 'converters') {
					if (!fn.isDefined(settings[key])) {
						settings[key] = val;
					}
				}
			});
		}
		url = url || ajaxSettings.default.url;

		var thread = fn.Thread(function() {
			var xmlHttp = null,
				action = this,
				converters = {};

			action.wait();

			// settings.beforeSend
			if (fn.isCallable(settings.beforeSend)) {
				if (!settings.beforeSend.call(xmlHttp, xmlHttp)) {
					action.reject();
				}
			}

			function callComplete() {
				// settings.complete
				if (!fn.isIterator(settings.complete)) {
					settings.complete = [settings.complete];
				}
				fn.each(settings.complete, function() {
					if (fn.isCallable(this)) {
						this.call(this, xmlHttp, xmlHttp.statusText);
					}
				});
			}

			// settings.crossDomain
			if (settings.crossDomain || settings.dataType == 'script') {
				if (settings.dataType != 'script') {
					// settings.jsonp
					var jsonpFunc = '';
					if (settings.jsonp && fn.isString(settings.jsonp)) {
						jsonpFunc = settings.jsonp;
					} else {
						jsonpFunc = Math.random().toString(36).replace(/\d/g, '').slice(2, 7);
						if (!win._ajaxCallback) {
							win._ajaxCallback = {};
						}
						win._ajaxCallback[jsonpFunc] = (fn.isCallable(settings.jsonpCallback)) ? settings.jsonpCallback : action.resume;
						jsonpFunc = 'window._ajaxCallback.' + jsonpFunc;
					}
					url = url + ((/\?/).test(url) ? '&' : '?') + 'callback=' + jsonpFunc;
				}

				var tag = doc.createElement('script');
				// settings.data
				if (settings.data) {
					settings.data = fn.param(settings.data);
					url += '&' + settings.data;
				}

				// settings.scriptCharset
				if (settings.scriptCharset) {
					tag.charset = settings.scriptCharset;
				}

				tag.src = url;
				doc.getElementsByTagName('head')[0].appendChild(tag);
				tag.onload = function() {
					callComplete();
				};
			} else {
				xmlHttp = new XMLHttpRequest();
				// settings.method
				if (!settings.method) {
					settings.method = settings.method || settings.type || 'GET';
				}
				settings.method = settings.method.toUpperCase();

				// settings.data
				if (settings.data) {
					if (settings.processData && !fn.isString(settings.data) && (settings.method == 'GET' || settings.data.constructor != FormData)) {
						settings.data = fn.param(settings.data);
					}
					if (settings.method == 'GET') {
						url += ((/\?/).test(url) ? '&' : '?') + settings.data;
					}
				}

				// settings.cache
				if (!settings.cache && (!settings.dataType || settings.dataType == 'jsonp' || settings.dataType == 'script')) {
					url = url + ((/\?/).test(url) ? '&' : '?') + (new Date()).getTime();
				}

				if (!fn.isDefined(settings.async)) {
					settings.async = true;
				}
				xmlHttp.open(settings.method, url, settings.async, settings.username, settings.password);

				// settings.timeout
				if (parseInt(settings.timeout) > 0) {
					xmlHttp.timeoutTimer = setTimeout(function() {
						xmlHttp.abort('timeout');
					}, parseInt(settings.timeout));
				}

				// settings.accepts
				if (!fn.isPlainObject(settings.accepts)) {
					settings.accepts = {};
				}
				fn.extend(settings.accepts, ajaxSettings.default.accepts);
				xmlHttp.setRequestHeader('Accept', (settings.dataType && settings.accepts[settings.dataType]) ? settings.accepts[settings.dataType] + ((settings.dataType !== '*') ? ', ' + allType + '; q=0.01' : '') : settings.accepts['*']);

				// settings.contentType
				if (settings.data && settings.data.constructor == FormData) {
					settings.contentType = 'multipart/form-data; charset=UTF-8';
				} else {
					if (!fn.isDefined(settings.contentType)) {
						settings.contentType = 'application/x-www-form-urlencoded; charset=UTF-8';
					}
					if (settings.contentType !== false) {
						xmlHttp.setRequestHeader('Content-Type', settings.contentType);
					}
				}

				// settings.converters
				if (fn.isPlainObject(settings.converters)) {
					fn.each(settings.converters, function(name, callback) {
						name = name.trim();
						if (/[\w-]+\s[\w-]/.test(name) && (fn.isCallable(callback) || callback === true)) {
							converters[name] = callback;
						}
					});
				}
				fn.extend(converters, ajaxSettings.default.converters);

				// settings.headers
				if (fn.isPlainObject(settings.headers)) {
					fn.each(settings.headers, function(name, value) {
						xmlHttp.setRequestHeader(name.trim(), value);
					});
				}

				// settings.mimeType
				if (settings.mimeType && fn.isString(settings.mimeType)) {
					xmlHttp.overrideMimeType(settings.mimeType);
				}

				xmlHttp.onreadystatechange = function() {
					if (xmlHttp.readyState != 4) return;

					// settings.statusCallback
					if (fn.isCallable(settings.statusCallback)) {
						if (settings.statusCallback[xmlHttp.status]) {
							settings.statusCallback[xmlHttp.status].call(xmlHttp);
						}
					}
					if (xmlHttp.status == 200) {
						var header = xmlHttp.getResponseHeader('Content-Type'),
							delimited = header.split(';')[0].split('/'),
							contentType = delimited[0],
							outputFormat = delimited[1],
							response = xmlHttp.response,
							convertName = contentType + ' ' + ((settings.dataType) ? settings.dataType : outputFormat),
							modifiedCheck = {};

						// settings.ifModified
						if (settings.ifModified) {
							modifiedCheck.etag = xmlHttp.getResponseHeader('ETag');
							modifiedCheck.lastModified = xmlHttp.getResponseHeader('Last-Modified');
							if (ajaxSettings.cached[url]) {
								if (ajaxSettings.cached[url].lastModified != modifiedCheck.lastModified || (modifiedCheck.etag && ajaxSettings.cached[url].eTag == modifiedCheck.etag)) {
									ajaxSettings.cached[url] = modifiedCheck;
								} else {
									action.reject({
										status: 304,
										text: 'Not modified'
									});
									callComplete();
									return;
								}
							}
						}

						// settings.afterDataReceive
						if (fn.isCallable(settings.afterDataReceive)) {
							response = settings.afterDataReceive.call(response, response);
						}

						if (converters[convertName]) {
							if (converters[convertName] !== true) {
								response = converters[convertName](response);
							}
						}
						action.resume(response);
						callComplete();
					} else {
						action.reject({
							status: xmlHttp.status,
							text: xmlHttp.statusText
						});
						callComplete();
					}
				};

				xmlHttp.send(settings.data);
			}
		});
		return (settings.context) ? thread.resolveWith(settings.context) : thread.resolve();
	};

	// Get Event Object
	function getEventObject(element, event) {
		var evtobj;
		if (CustomEvent) {
			evtobj = new CustomEvent(event, {
				'bubbles': true,
				// Whether the event will bubble up through the DOM or not
				'cancelable': true // Whether the event may be canceled or not
			});
		} else if (doc.createEvent) {
			if (/(mouse.+)|(((un)?click)|over|down|up)/i.test(event)) {
				evtobj = doc.createEvent('MouseEvents');
			} else {
				evtobj = doc.createEvent('HTMLEvents');
			}
			evtobj.initEvent(event, true, true);
		} else if (element.createEventObject) {
			evtobj = element.createEventObject();
		}
		return evtobj;
	}

	/**
	 * Merge the contents of two or more objects together into the first object.
	 * @name       extend
	 *
	 * @param      {*}         object        The object you need to identify
	 *                                       for.
	 * @param      {...Mixed}  extendObject  Additional objects containing
	 *                                       properties to merge in.
	 * @return     {Jet}       { description_of_the_return_value }
	 */
	fn.extend = function(object, extendObject) {
		var args = slice.call(arguments);
		args.shift();
		fn.each(args, function() {
			if (typeof this == 'object' && this !== null) {
				fn.each(this, function(key, val) {
					if (typeof object[key] == 'undefined') {
						object[key] = val;
					}
				});
			}
		});
		return this;
	};

	/**
	 * Merge the contents or Hook the plugins into the JetObject Prototype.
	 * @namespace  {Jet}
	 * @name       hook
	 *
	 * @param      {...Mixed}   object  - Additional objects containing
	 *                                  properties to merge in.
	 * @return     {Jet}  { description_of_the_return_value }
	 */
	fn.hook = function(object) {
		fn.each(arguments, function() {
			fn.each(this, function(key, val) {
				if (typeof JetObject.prototype[key] == 'undefined') {
					JetObject.prototype[key] = val;
				}
			});
		});
		return this;
	};

	fn.extend(Jet, fn);

	/** @namespace JetObject */
	fn.hook({
		/**
		 * Iterate over a Jet object, executing a function for each matched
		 * element.
		 *
		 * @param      {Function}   callback  A function to execute for each
		 *                                    matched element.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		each: function(callback) {
			fn.each(this, callback);
			return this;
		},
		/**
		 * Get the value of a computed style property for the first element in
		 * the set of matched elements or set one or more CSS properties for
		 * every matched element.
		 *
		 * @param      {String}            css     A CSS property or an array of
		 *                                         one or more CSS properties.
		 * @param      {object|callback}   value   A value to set for the
		 *                                         property or a function
		 *                                         returning the value to set.
		 *                                         this is the current element.
		 *                                         Receives the index position
		 *                                         of the element in the set and
		 *                                         the old value as arguments.
		 * @return     {JetObject|string}  { description_of_the_return_value }
		 */
		css: function(css, value) {
			var elem, cc, owner, self = this, cssObj = {};
			if (fn.isPlainObject(css)) {
				// If the css is An array of CSS properties, iterate and execute one by one
				fn.each(css, function(style, val) {
					self.css(style, val);
				});
			} else if (fn.isIterator(css)) {
				fn.each(css, function() {
					cssObj[this] = self.css(this);
				});
				return cssObj;
			} else {
				// Cover to camcel case
				cc = fn.camelCase(css);
				// If the value is defined,
				if (fn.isDefined(value)) {
					fn.each(this, function(i) {
						if (fn.isDefined(this.style[cc])) {
							this.style[cc] = (fn.isCallable(value)) ? value.call(this, i, this.style[cc]) : value;
						}
					});
				} else {
					if (fn.isDefined(this[0])) {
						elem = this[0];
						owner = fn.owner(elem).document;
						if (owner.defaultView && owner.defaultView.getComputedStyle) {
							return owner.defaultView.getComputedStyle(elem, '').getPropertyValue(css);
						} else if (elem.currentStyle) {
							return elem.currentStyle[cc];
						}
						return elem.style[cc];
					}
					return null;
				}
			}
			return this;
		},
		/**
		 * Removes a css style.
		 *
		 * @param      {String}  css     The css name to remove
		 * @return     {Object}  { description_of_the_return_value }
		 */
		removeCss: function(css) {
			if (fn.isString(css)) {
				fn.each(this, function() {
					if (fn.isDefined(this.style[css])) {
						this.style[css] = null;
					}
				});
			}
			return this;
		},

		/**
		 * Determines if the class name is exists.
		 *
		 * @param      {String}   classname  The class name
		 * @return     {boolean}  True if has class exists, False otherwise.
		 */
		hasClass: function(classname) {
			var found = false;
			if (fn.isString(classname)) {
				fn.each(this, function() {
					if (!found) {
						var classes = ' ' + this.className + ' ';
						if (classes.indexOf(' ' + classname + ' ') >= 0) {
							found = true;
						}
					}
				});
			}
			return found;
		},

		/**
		 * Add or remove one or more classes from each element in the set of
		 * matched elements, depending on either the class’s presence or the
		 * value of the state argument.
		 *
		 * @param      {String}  classname    One or more class names (separated by spaces) to be toggled for each element in the matched set.
		 * @param      {boolean}  addorremove  A Boolean (not just truthy/falsy) value to determine whether the class should be added or removed.
		 * @return     {Object}  { description_of_the_return_value }
		 */
		toggleClass: function(classname, addorremove) {
			fn.each(this, function(i, elem) {
				classname = (fn.isCallable(classname)) ? classname.call(this.className, i, this.className) : classname;
				if ((fn.isDefined(addorremove) && addorremove) || (!fn.isDefined(addorremove) && !Jet(elem).hasClass(classname))) {
					Jet(elem).addClass(classname);
				} else {
					Jet(elem).removeClass(classname);
				}
				if (!elem.className) {
					elem.removeAttribute('class');
				}
			});
			return this;
		},

		/**
		 * Get the HTML contents of the first element in the set of matched
		 * elements or set the HTML contents of every matched element.
		 *
		 * @param      {String}  html    A string of HTML to set as the content
		 *                               of each matched element.
		 * @param      {function}  html    A function returning the HTML content to set.
		 *                                 Receives the index position of the element in
		 *                                 the set and the old HTML value as arguments.
		 * @return     {Object}  { description_of_the_return_value }
		 */
		html: function(html) {
			if (fn.isDefined(html)) {
				fn.each(this, function(i) {
					this.innerHTML = (fn.isCallable(html)) ? html.call(this.innerHTML, i, this.innerHTML) : html;
				});
				return this;
			} else {
				return (this[0]) ? this[0].innerHTML : '';
			}
		},
		/**
		 * Encode a set of form elements as a string for submission.
		 *
		 * @return     {String}  { description_of_the_return_value }
		 */
		serialize: function() {
			var result = [], elem = this[0], formData;
			if (elem && elem.tagName.toLowerCase() == 'form') {
				formData = new FormData(elem);
				fn.each(formData, function(key, value) {
					result.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
				});
			}
			return result.join('&');
		},
		/**
		 * Encode a set of form elements as an array of names and values.
		 *
		 * @return     {Array}  { description_of_the_return_value }
		 */
		serializeArray: function() {
			var result = [], elem = this[0], formData;
			if (elem && elem.tagName.toLowerCase() == 'form') {
				formData = new FormData(elem);
				fn.each(formData, function(key, value) {
					result.push({
						name: encodeURIComponent(key),
						value: encodeURIComponent(value)
					});
				});
			}
			return result;
		},
		/**
		 * Select the first matched DOM element.
		 *
		 * @returns {JetObject}
		 */
		first: function() {
			if (this.length === 0) return this;
			return Jet(this[0]);
		},
		/**
		 * Select a range of matched DOM element.
		 *
		 * @returns {JetObject}
		 */
		get: function(start, length) {
			if (this.length === 0) return this;
			start = parseInt(start);
			if (isNaN(start) || start <= 0) {
				start = 0;
			}

			length = parseInt(length);
			if (isNaN(length) || length <= 0) {
				length = 1;
			}
			var jetObj = new JetObject();
			for (;length > 0 && start < this.length; length--) {
				jetObj.push(this[start]);
				start++;
			}
			return jetObj;
		},
		/**
		 * Select the last matched DOM element.
		 *
		 * @returns {JetObject}
		 */
		last: function() {
			if (this.length === 0) return this;
			return Jet(this[this.length - 1]);
		},
		/**
		 * Check the current matched set of elements against a selector, element
		 * and return true if at least one of these elements matches the given
		 * arguments.
		 *
		 * @param      {*}        selector  A selector string to search another
		 *                                  matched elements for identitfy.
		 * @return     {boolean}  { description_of_the_return_value }
		 */
		is: function(selector) {
			var found = false;
			if (fn.isString(selector)) {
				fn.each(this, function(key, elem) {
					if (!found) {
						fn.each(Jet(selector), function() {
							if (this == elem) {
								found = true;
							}
						});
					}
				});
			} else if (fn.isCallable(selector)) {
				fn.each(this, function(key, elem) {
					if (!found) {
						found = selector.call(this);
					}
				});
			} else if (fn.isIterator(selector)) {
				fn.each(this, function(key, elem) {
					if (!found) {
						fn.each(selector, function() {
							if (this == elem) {
								found = true;
							}
						});
					}
				});
			}
			return found;
		},
		/**
		 * Execute all handlers and behaviors attached to the matched elements for the given event type.
		 *
		 * @param      {String}  event   Event name to fire
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		trigger: function(event) {
			if (event && /^[\w-.]+$/.test(event)) {
				var namespaces = event.split('.'),
					eventName = namespaces.shift().toLowerCase();

				fn.each(this, function(i, elem) {
					if (eventName == 'submit') {
						elem.submit();
					} else {
						var evt = getEventObject(this, eventName);
						evt.namespaces = namespaces;

						if (document.createEvent) {
							elem.dispatchEvent(evt);
						} else {
							elem.fireEvent('on' + eventName, evt);
						}
					}
				});
			}
			return this;
		},
		/**
		 * Attach an event handler function for one or more events to the
		 * selected elements.
		 *
		 * @param      {String}     event     Event name with optional
		 *                                    namespace.
		 * @param      {String}     selector  A selector string to filter the
		 *                                    descendants of the selected
		 *                                    elements that trigger the event.
		 * @param      {Function}   callback  An event handler.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		on: function(event, selector, callback) {
			var elements = this;
			event = event.split(' ');
			fn.each(event, function() {
				if (/^[\w-.]+$/.test(this)) {
					var namespaces = this.split('.'),
						eventName = namespaces.shift().toLowerCase();

					if (fn.isCallable(selector)) {
						callback = selector;
						selector = '';
					} else if (!fn.isString(selector)) {
						selector = '';
					}
					if (fn.isCallable(callback)) {
						fn.each(elements, function() {
							if (!fn.isDefined(this.events)) {
								this.events = {};
							}
							if (!fn.isDefined(this.events[eventName])) {
								// Event Level
								(function(elem) {
									var storage = [],
										runEvent = function(e) {
											if (this.selector) {
												if (!Jet(e.target).is(this.selector)) {
													return;
												}
											}
											this.callback.call(this.selector ? e.target : elem, e);
										};
									elem.events[eventName] = {
										add: function(namespaces, selector, callback) {
											if (namespaces.length === 0) {
												namespaces.push(null);
											}
											fn.each(namespaces, function() {
												storage.push({
													namespace: this,
													selector: selector,
													callback: callback
												});
											});
										},
										remove: function(namespace) {
											if (!namespace) {
												storage = [];
											} else {
												fn.each(storage, function(key) {
													if (namespace == '**' && !this.namespace || this.namespace == namespace) {
														delete storage[key];
													}
												});
											}
										},
										trigger: function(e) {
											fn.each(storage, function(key, val) {
												if (!e.namespaces || (e.namespaces.length === 0 || e.namespaces.indexOf(this.namespace) >= 0)) {
													runEvent.call(this, e);
												}
											});
										}
									};
									elem.events[eventName].default = elem[eventName];
									(function(evt) {
										elem[evt] = function(e) {
											elem.events[evt].trigger.call(this, e);
										};
										if (/^(DOMContentLoaded|(on)?load)$/i.test(eventName) && (fn.isDocument(elem) || fn.isWindow(elem))) {
											fn.ready(callback);
										} else {
											if (elem.addEventListener) {
												elem.addEventListener(evt, elem[evt], false);
											} else if (this.attachEvent) {
												elem.attachEvent(eventBindmap[evt] || 'on' + evt, elem[evt]);
											} else {
												elem[eventBindmap[evt] || 'on' + evt] = elem[evt];
											}
										}
									})(eventName);
								})(this);
							}
							this.events[eventName].add(namespaces, selector, callback);
						});
					}
				}
			});
			return this;
		},

		/**
		 * Remove an event handler.
		 *
		 * @param      {String}  event     The event name
		 * @param      {String}  selector  The selector which has defined
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		off: function(event, selector) {
			var matches;
			if (!!(matches = /^([\w-]+)(?:\.([\w-]+|\*\*))?$/.exec(event))) {
				fn.each(this, function() {
					if (this.events && this.events[matches[1]]) {
						if (this.events[matches[1]]) {
							this.events[matches[1]].remove(matches[2]);
						}
					}
				});
			}
			return this;
		},
		/**
		 * Get the descendants of each element in the current set of matched
		 * elements, filtered by a selector, or element.
		 *
		 * @param      {mixed}      selector  A string containing a selector
		 *                                    expression, an element or an
		 *                                    iterate object to match elements
		 *                                    against.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		find: function(selector) {
			var JetObj = new JetObject(),
				elems = this;
			if (fn.isString(selector)) {
				fn.each(this, function() {
					fn.each(this.querySelectorAll(selector), function() {
						if (!this._added) {
							this._added = true;
							JetObj.push(this);
						}
					});
				});
			} else {
				(function run(element) {
					if (fn.isIterator(element)) {
						fn.each(element, function() {
							run(this);
						});
					} else if (fn.isDOMElement(element)) {
						fn.each(elems, function() {
							if (!this._added && fn.comparePosition(this, element) === 20) {
								this.added = true;
								JetObj.push(element);
							}
						});
					}
				})(selector);
			}
			fn.each(JetObj, function() {
				delete this._added;
			});
			return JetObj;
		},

		/**
		 * Get the children of each element in the set of matched elements,
		 * optionally filtered by a selector.
		 *
		 * @param      {String}     selector  A string containing a selector
		 *                                    expression to match elements
		 *                                    against.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		children: function(selector) {
			var JetObj = new JetObject();
			fn.each(this, function() {
				fn.each(this.children, function() {
					JetObj.push(this);
				});
			});
			return JetObj;
		},

		/**
		 * Get the combined text contents of each element in the set of matched
		 * elements, including their descendants, or set the text contents of
		 * the matched elements.
		 *
		 * @param      {String}           value   The text to set as the content
		 *                                        of each matched element. When
		 *                                        Number or Boolean is supplied,
		 *                                        it will be converted to a
		 *                                        String representation.
		 * @param      {Function}  value   A function returning the text content to set.
		 *                                 Receives the index position of the element in
		 *                                 the set and the old text value as arguments.
		 * @return     {string|JetObject}  { description_of_the_return_value }
		 */
		text: function(value) {
			if (fn.isDefined(value)) {
				fn.each(this, function() {
					this.innerText = (fn.isCallable(value)) ? value.call(this.innerText) : value;
				});
				return this;
			} else {
				if (this.length) {
					if (fn.isDefined(this[0].type) && this[0].type.indexOf('select') !== -1) {
						return this[0].options[this[0].selectedIndex].innerHTML;
					}
					return this[0].innerText;
				}
				return '';
			}
		},

		/**
		 * Remove the set of matched elements from the DOM.
		 *
		 * @return     {Object}  { description_of_the_return_value }
		 */
		detach: function() {
			fn.each(this, function() {
				if (this.parentNode) {
					this.parentNode.removeChild(this);
				}
			});
			return this;
		},

		/**
		 * Determines if the matched elements is active (focus).
		 *
		 * @return     {boolean}  True if active, False otherwise.
		 */
		isActive: function() {
			if (this.length) {
				if (doc.activeElement === this[0]) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Get the current coordinates of the first element,
		 * or get the current coordinates from specified parent, default is body
		 *
		 *
		 * @return     {Object}  { description_of_the_return_value }
		 */
		offset: function() {
			var offset = {
					top: 0,
					left: 0
				},
				elem = this[0],
				boxRect, owner;

			if (elem) {
				boxRect = Jet(elem).boxRect();
				owner = fn.owner(this).window;
				return {
			    left: boxRect.left + owner.scrollX,
			    top: boxRect.top + owner.scrollY
			  }
			}

			return offset;
		},

		/**
		 * Get the closest ancestor element that is positioned.
		 *
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		offsetParent: function() {
			var offsetParent = (this.length) ? this[0].offsetParent : null;
			while (offsetParent) {
				if (offsetParent.nodeName.toLowerCase() != 'html' || Jet(offsetParent).css('position') !== 'static') {
					break;
				}
				offsetParent = offsetParent.offsetParent;
			}
			return Jet(offsetParent || docElem);
		},

		/**
		 * Returns the size of matched element and its position relative to the viewport.
		 *
		 * @return     {PlainObject}  { description_of_the_return_value }
		 */
		boxRect: function() {
			var rect, boxrect = {}, margin, padding, border;
			if (this.length) {
				rect = this[0].getBoundingClientRect();
				margin = this.margin();
				padding = this.padding();
				border = this.borderWidth();

				boxrect = {
					left: rect.left + margin.left,
					right: rect.right + margin.right,
					top: rect.top + margin.top,
					bottom: rect.bottom + margin.bottom
				};
				boxrect.width = rect.right - rect.left;
				boxrect.height = rect.bottom - rect.top;
				return rect;
			}
			return null;
		},

		/**
		 * Determines if the matched elements within the viewport
		 *
		 * @return     {boolean}  { description_of_the_return_value }
		 */
		inViewport: function() {
			var boxRect = this.boxRect();
			if (!boxRect) {
				return false;
			}
			return (
				boxRect.top + boxRect.height > 0 &&
				boxRect.left + boxRect.width > 0 &&
				boxRect.bottom <= (win.innerHeight || docElem.clientHeight) &&
				boxRect.right <= (win.innerWidth || docElem.clientWidth)
			);
		},

		/**
		 * Get the current computed inner height (including padding but not
		 * border) for the first element in the set of matched elements or set
		 * the inner height of every matched element.
		 *
		 * @param      {Number}     value   THe height including padding but not
		 *                                  border
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		innerHeight: function(value) {
			return getWidthHeight(this, 'height', ['padding-top', 'padding-bottom'], value);
		},

		/**
		 * Get the current computed outer height (including padding, border, and
		 * optionally margin) for the first element in the set of matched
		 * elements or set the outer height of every matched element.
		 *
		 * @param      {Number}     value          THe height including padding,
		 *                                         border, and optionally
		 *                                         margin)
		 * @param      {boolean}    includeMargin  A Boolean indicating whether
		 *                                         to include the element's
		 *                                         margin in the calculation.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		outerHeight: function(value, includeMargin) {
			var list = ['padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width'];

			if ((fn.isBoolean(value) && value) || includeMargin) {
				list.push.apply(list, ['margin-top', 'margin-bottom']);
			}
			if (fn.isBoolean(value) || !fn.isDefined(value)) {
				value = undefined;
			}
			return getWidthHeight(this, 'height', list, value);
		},

		/**
		 * Get the current computed inner width (including padding but not
		 * border) for the first element in the set of matched elements or set
		 * the inner height of every matched element.
		 *
		 * @param      {Number}     value   The width including padding but not
		 *                                  border
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		innerWidth: function(value) {
			return getWidthHeight(this, 'width', ['padding-left', 'padding-right'], value);
		},

		/**
		 * Get the current computed outer width (including padding, border, and
		 * optionally margin) for the first element in the set of matched
		 * elements or set the outer height of every matched element.
		 *
		 * @param      {Number}     value          The width including padding,
		 *                                         border, and optionally
		 *                                         margin)
		 * @param      {boolean}    includeMargin  A Boolean indicating whether
		 *                                         to include the element's
		 *                                         margin in the calculation.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		outerWidth: function(value, includeMargin) {
			var list = ['padding-left', 'padding-right', 'border-left-width', 'border-right-width'];

			if ((fn.isBoolean(value) && value) || includeMargin) {
				list.push.apply(list, ['margin-left', 'margin-right']);
			}
			if (fn.isBoolean(value) || !fn.isDefined(value)) {
				value = undefined;
			}
			return getWidthHeight(this, 'width', list, value);
		},

		/**
		 * Get the parent of each element in the current set of matched
		 * elements, optionally filtered by a selector.
		 *
		 * @param      {String}     selector  A string containing a selector
		 *                                    expression to match elements
		 *                                    against.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		parent: function(selector) {
			var elem = this[0];
			if (!elem) return Jet();

			while (!!(elem = elem.parentNode)) {
				if (!selector || Jet(elem).is(selector)) {
					return Jet(elem);
				}
			}
			return Jet();
		},

		/**
		 * Get the ancestors of each element in the current set of matched
		 * elements, optionally filtered by a selector, stop scanning by another
		 * selector
		 *
		 * @param      {String}     selector  A string containing a selector
		 *                                    expression to match elements
		 *                                    against.
		 * @param      {String}     until     A string containing a selector
		 *                                    expression to match elements
		 *                                    against to stop scanning.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		parents: function(selector, until) {
			var elements = [],
				elem = this[0];
			if (!elem) return null;

			while (!!(elem = elem.parentNode)) {
				if (!parent && parent.nodeType === 11) {
					break;
				}
				if (!selector || Jet(elem).is(selector)) {
					elements.push(elem);
				}
				if (!until || Jet(elem).is(until)) {
					break;
				}
			}
			return Jet(elements);
		},

		/**
		 * Get the current position of the scroll bar for the first element in
		 * the set of matched elements or set the position of the scroll bar for
		 * every matched element by specfied value or DOMElement.
		 *
		 * @param      {Number}            x       A number indicating the new
		 *                                         position to set the horizonal
		 *                                         scroll bar to.
		 * @param      {Number}            y       A number indicating the new
		 *                                         position to set the vertical
		 *                                         scroll bar to.
		 * @return     {Object|JetObject}  { description_of_the_return_value }
		 */
		scrollTo: function(x, y) {
			if (fn.isDefined(x)) {
				if (x.constructor == JetObject || fn.isDOMElement(x)) {
					this.scrollTop(x);
					this.scrollLeft(x);
				} else {
					if (fn.isDefined(y)) {
						this.scrollTop(parseInt(y));
					}
					this.scrollLeft(parseInt(x));
				}
				return this;
			} else {
				return {
					x: this.scrollLeft(),
					y: this.scrollTop()
				};
			}
		},

		/**
		 * Reduce the set of matched elements to those that match the selector
		 * or pass the function’s test.
		 *
		 * @param      {String}    selector  A string containing a
		 *                                            selector expression to
		 *                                            match the current set of
		 *                                            elements against.
		 * @param      {Function}  selector  A function used as a test for each element in
		 *                                   the set. this is the current DOM element.
		 * @return     {(Array|JetObject)}  { description_of_the_return_value }
		 */
		filter: function(selector) {
			var JetObj = new JetObject();
			if (fn.isCallable(selector)) {
				fn.each(this, function() {
					if (selector.call(this)) {
						JetObj.push(this);
					}
				});
			} else if (fn.isString(selector)) {
				fn.each(this, function() {
					if (Jet(this).is(selector)) {
						JetObj.push(this);
					}
				});
			}
			return JetObj;
		},

		/**
		 * Returns the FormData object from the first of the matched elements
		 *
		 * @return     {FormData}  { description_of_the_return_value }
		 */
		formdata: function() {
			var elem = this[0], formset, formdata = new FormData();
			if (fn.isDefined(elem)) {
				if (elem.nodeName.toLowerCase() == 'form' && elem.elements) {
					formset = elem.elements;
				} else {
					formset = this.find('*');
				}
				Jet(formset).filter(function() {
					if (regexSubmitName.test(this.tagName) && !regexSubmitType.test(this.type) && !this.disabled && (!regexCheckable.test(this.type)) || this.checked) {
						return true;
					}
					return false;
				}).each(function(i, elem) {
					formdata.append(elem.name, elem.value);
				});
			}
			return formdata;
		},

		/**
		 * Get the value of an attribute for the first element in the set of
		 * matched elements or set one or more attributes for every matched
		 * element.
		 *
		 * @param      {String}       attr    The name of the attribute to get.
		 * @param      {PlainObject}  value   An object of attribute-value pairs
		 *                                    to set.
		 * @param      {String}    value   The value
		 * @param      {Function}  value   A function returning the value to set. this is
		 *                                 the current element. Receives the index position
		 *                                 of the element in the set and the old attribute
		 *                                 value as arguments.
		 * @return     {JetObject}    { description_of_the_return_value }
		 */
		attr: function(attr, value) {
			var elem,
				self = this;
			if (fn.isPlainObject(attr)) {
				fn.each(attr, function(attribute, val) {
					self.attr(attribute, val);
				});
			} else {
				if (fn.isDefined(value)) {
					if (value === null) {
						this.removeAttr(attr);
					} else {
						fn.each(this, function() {
							var newValue = (fn.isCallable(value)) ? value.call(Jet(this).attr(attr)) : value;
							if (this.setAttribute) {
								this.setAttribute(attr, newValue);
							} else {
								this[attrBindmap[attr.toLowerCase()] || attr] = newValue;
							}
						});
					}
				} else {
					elem = this[0];
					if (elem) {
						return (fn.isIE || !elem.getAttribute) ? elem[attrBindmap[attr.toLowerCase()] || attr] : elem.getAttribute(attr, 2);
					}
					return null;
				}
			}
			return this;
		},

		/**
		 * Remove an attribute from each element in the set of matched elements.
		 *
		 * @param      {String}     attr    The name of the attribute to remove.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		removeAttr: function(attr) {
			if (fn.isString(attr)) {
				fn.each(this, function() {
					if (this.removeAttribute) {
						this.removeAttribute(attr);
					}
				});
			}
			return this;
		},


		/**
		 * Get the value of a property for the first element in the set of
		 * matched elements or set one or more properties for every matched
		 * element.
		 *
		 * @param      {String}       prop    The name of the property to get.
		 * @param      {PlainObject}  value   An object of property-value pairs
		 *                                    to set.
		 * @param      {String}    value   An object of property-value pairs to set.
		 * @param      {Function}  value   A function returning the value to set. Receives
		 *                                 the index position of the element in the set and
		 *                                 the old property value as arguments. Within the
		 *                                 function, the keyword this refers to the current
		 *                                 element.
		 * @return     {JetObject}    { description_of_the_return_value }
		 */
		prop: function(prop, value) {
			var elem, self = this;
			if (fn.isPlainObject(prop)) {
				fn.each(prop, function(pp, val) {
					self.prop(pp, val);
				});
			} else {
				if (fn.isDefined(value)) {
					fn.each(this, function() {
						var pp = propBindmap[prop] || prop;
						this[pp] = (fn.isCallable(value)) ? value.call(this) : value;
					});
				} else {
					elem = this[0];
					if (elem) {
						return elem[propBindmap[prop] || prop];
					}
					return null;
				}
			}
			return this;
		},

		/**
		 * Remove a property from each element in the set of matched elements.
		 *
		 * @param      {String}  prop    The name of the property to remove.
		 * @return     {Object}  { description_of_the_return_value }
		 */
		removeProp: function(prop) {
			if (fn.isString(prop)) {
				fn.each(this, function() {
					delete this[prop];
				});
			}
			return this;
		},

		/**
		 * Determines if the property is exists in the first of matched elements.
		 *
		 * @param      {String}   prop    The name of the property to determine
		 * @return     {boolean}  True if has property, False otherwise.
		 */
		hasProp: function(prop) {
			var elem = this[0];
			return elem && (fn.isDefined(elem[propBindmap[prop] || prop]) || elem.hasOwnProperty(propBindmap[prop] || prop));
		},

		/**
		 * Get the check status from the first element in the set of matched
		 * elements or set the check status for every matched element.
		 *
		 * @param      {boolean}            value   A Boolean indicating whether
		 *                                          to the elements is checked
		 *                                          or not
		 * @return     {JetObject|boolean}  { description_of_the_return_value }
		 */
		checked: function(value) {
			if (fn.isDefined(value)) {
				fn.each(this.filter(function() {
					if (regexCheckable.test(this.type)) {
						return true;
					}
					return false;
				}), function() {
					Jet(this).prop('checked', (value) ? true : false);
				});
				return this;
			} else {
				return Jet(this).attr('checked') || !!(Jet(this).prop('checked'));
			}
		},

		/**
		 * Get the current value of the first element in the set of matched
		 * elements or set the value of every matched element.
		 *
		 * @param      {String|Function}  value   A string of text, a number, or
		 *                                        an array of strings
		 *                                        corresponding to the value of
		 *                                        each matched element to set as
		 *                                        selected/checked. Or a
		 *                                        function returning the value
		 *                                        to set. this is the current
		 *                                        element. Receives the index
		 *                                        position of the element in the
		 *                                        set and the old value as
		 *                                        arguments.
		 * @return     {*}                { description_of_the_return_value }
		 */
		val: function(value) {
			if (fn.isDefined(value)) {
				fn.each(this, function() {
					var parent;
					if (regexCheckable.test(this.type)) {
						parent = Jet(fn.owner(this).document.body);
						parent.find('input[type=' + Jet(this).prop('type') + '][name="' + Jet(this).prop('name') + '"]').checked(false).filter(function() {
							return value.indexOf(Jet(this).prop('value')) != -1;
						}).checked(true);
					} else if (regexSubmitName.test(this.tagName)) {
						this.value = (fn.isCallable(value)) ? value.call(this) : value;
						Jet(this).attr('value', value);
					} else if (this.tagName.toLowerCase() == 'select') {
						if (this.type == 'select-multiple') {
							if (!fn.isIterator(value)) {
								value = [value];
							}
						} else {
							if (fn.isIterator(value)) {
								value.slice(0, 1);
							}
						}
						Jet(this).find('option').prop('selected', false).filter(function() {
							return value.indexOf(Jet(this).prop('value')) != -1;
						}).prop('selected', true);
					} else {
						Jet(this).prop('value', value).attr('value', value);
					}
					// Trigger onChange event
					Jet(this).change();
				});
				return this;
			} else {
				if (this.length) {
					var elem = this[0], parent, selector = 'input[type=' + Jet(elem).prop('type') + '][name="' + Jet(elem).prop('name') + '"]:checked';
					if (regexCheckable.test(elem.type)) {
						parent = Jet(fn.owner(this).document.body);
						return parent.find(selector).prop('value');
					} else if (regexSubmitName.test(elem.tagName)) {
						return elem.value;
					} else if (elem.tagName.toLowerCase() == 'select') {
						if (elem.type == 'select-multiple') {
							return fn.walk(Jet(elem).find('option:checked'), function() {
								return Jet(this).prop('value');
							});
						} else {
							return Jet(elem).find('option:checked').prop('value');
						}
					} else {
						return Jet(elem).prop('value');
					}
				}
				return null;
			}
		},

		/**
		 * Store arbitrary data associated with the matched elements or return
		 * the value at the named data store for the first element in the set of
		 * matched elements.
		 *
		 * @param      {String}   name    A string naming the piece of data to
		 *                                set.
		 * @param      {object}   object  The new data value; this can be any
		 *                                Javascript type except undefined.
		 * @param      {boolean}  clone   A Boolean indicating whether to clone
		 *                                the new value object
		 * @return     {*}        { description_of_the_return_value }
		 */
		data: function(name, object, clone) {
			function createDataSet(element) {
				element.dataset = {};
				fn.each(element.attributes, function() {
					if (this.indexOf('data-') === 0) {
						element.dataset[this.substr(5)] = element[this];
					}
				});
			}

			if (!fn.isDefined(name)) {
				return this[0].dataset;
			} else {
				if (fn.isDefined(object)) {
					fn.each(this, function() {
						if (!fn.isDefined(this.dataset)) {
							createDataSet(this);
						}
						this.dataset[name] = (clone) ? fn.clone(object) : object;
					});
					return this;
				} else {
					var value, dataset;
					if (fn.isString(name)) {
						name = name.trim();
						if (!fn.isDefined(this[0].dataset)) {
							createDataSet(this[0]);
						}
						value = this[0].dataset[name];

						if (value) {
							if (fn.isString(value)) {
								try {
									return JSON.parse(value);
								} catch(e) {
									return value;
								}
							}
							return value;
						}
					}
					return null;
				}
			}
		},

		/**
		 * Set a delay timer for next animation
		 *
		 * @param      {Number}     duration  The duration of delay timer in
		 *                                    millisecond
		 * @param      {Function}   callback  A function to call once the
		 *                                    animation is complete, called
		 *                                    once per matched element.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		wait: function(duration, callback) {
			fn.each(this, function() {
				var elem = this;
				defineAnimateThread(elem);

				this.animateThread.add(function() {
					var action = this;
					action.wait();
					setTimeout(function() {
						action.resume();
						if (fn.isCallable(callback)) {
							callback.call(elem);
						}
					}, duration);
				});
			});
			return this;
		},

		/**
		 * Perform a custom animation of a set of CSS properties.
		 *
		 * @param      {PlainObject}  css       An object of CSS properties and
		 *                                      values that the animation will
		 *                                      move toward.
		 * @param      {Number}       duration  A string or number determining
		 *                                      how long the animation will run.
		 * @param      {String}       easing    A string indicating which easing
		 *                                      function to use for the
		 *                                      transition.
		 * @param      {Function}     callback  A function to call once the
		 *                                      animation is complete, called
		 *                                      once per matched element.
		 * @return     {JetObject}    { description_of_the_return_value }
		 */
		animate: function(css, duration, easing, callback) {
			fn.each(this, function() {
				var elem = this, transition = {};
				if (!easing || !(new RegExp(easingType)).test(easing.replace(/\s+/g, '', easing))) {
					easing = 'linear';
				}

				transition = defineAnimateThread(elem);

				this.animateThread.add(function() {
					var action = this, allType = true, delay = 0, isKeyframe = false, animationObj = {};
					action.wait();

					if (css.constructor == fn.Keyframe) {
						// Reset the animate
						animationObj[fn.browser.prefix + 'animation-duration'] = (duration / 1000) + 's';
						animationObj[fn.browser.prefix + 'animation-timing-function'] = easing;
						animationObj[fn.browser.prefix + 'animation-name'] = css.getName();
						animationObj[fn.browser.prefix + 'animation-iteration-count'] = 1;
						Jet(elem).css(animationObj);
						isKeyframe = true;
					} else {
						if (css.constructor == fn.Transform) {
							css.set({
								duration: duration,
								easing: easing
							});
							css.bind(elem);
						} else {
							fn.each(css, function(cssprop, value) {
								if (fn.isPlainObject(value)) {
									if (value.value) {
										if (!value.easing || !(new RegExp(easingType)).test(value.easing)) {
											value.easing = 'linear';
										}
										transition[cssprop] = cssprop + ' ' + ((value.duration || duration) / 1000) + 's ' + (value.easing || easing) + ' '  + ((value.delay || 0) / 1000) + 's';
										Jet(elem).css(cssprop, value.value);
										allType = false;
										if (value.delay > delay) {
											delay = value.delay;
										}
										if (value.duration > duration) {
											duration = value.duration;
										}
									}
								} else {
									if (cssprop == 'transform') {
										value.bind(elem);
									} else {
										Jet(elem).css(cssprop, value);
									}
									transition[cssprop] = cssprop + ' ' + (duration / 1000) + 's ' + easing + ' 0s';
								}
							});

							if (allType) {
								transition = 'all ' + (duration / 1000) + 's ' + easing + ' 0s';
							} else {
								delete transition.all;
								transition = Object.keys(transition).map(function (key) {
									return transition[key];
								}).join(', ');
							}
							Jet(elem).css('transition', transition);
						}
					}

					setTimeout(function() {
						if (isKeyframe) {
							Jet(elem).removeCss('animation-duration').removeCss('animation-timing-function').removeCss('animation-name').removeCss('animation-iteration-count');
						}
						if (fn.isCallable(callback)) {
							callback.call(elem);
						}
						action.resume();
					}, duration + delay);
				});

				if (this.animateThread.getStatus() == 'pending') {
					this.animateThread.resolve();
				}
			});
			return this;
		},

		/**
		 * Hide the matched elements.
		 *
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		hide: function() {
			fn.each(this, function(i, elem) {
				var JetObj = Jet(elem);
				if (JetObj.css('display') !== 'none') {
					elem.defaultDisplay = JetObj.css('display');
					JetObj.css('display', 'none');
				}
			});
			return this;
		},

		/**
		 * Show the matched elements.
		 *
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		show: function() {
			fn.each(this, function(i, elem) {
				var JetObj = Jet(elem);
				if (JetObj.css('display') === 'none') {
					JetObj.css('display', elem.defaultDisplay || 'block');
				}
			});
			return this;
		}
	});

	fn.each(['after', 'before', 'append', 'prepend', 'appendTo', 'prependTo'], function() {
		var method = this, noTo = (method.indexOf('To') == -1);
		/**
		 * Insert content, specified by the parameter, after each element in the
		 * set of matched elements.
		 *
		 * @name       after
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Insert content, specified by the parameter, before each element in
		 * the set of matched elements.
		 *
		 * @name       before
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Insert content, specified by the parameter, to the end of each
		 * element in the set of matched elements.
		 *
		 * @name       append
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Insert content, specified by the parameter, to the beginning of each
		 * element in the set of matched elements.
		 *
		 * @name       prepend
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Insert every element in the set of matched elements to the end of the
		 * target.
		 *
		 * @name       appendTo
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Insert every element in the set of matched elements to the beginning
		 * of the target.
		 *
		 * @name       prependTo
		 * @param      {*}          element  HTML string, DOM element, text
		 *                                   node, array of elements and text
		 *                                   nodes, or Jet object to insert
		 *                                   after each element in the set of
		 *                                   matched elements.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		JetObject.prototype[method] = function(element) {
			insertTo((noTo) ? this : element, (noTo) ? element : this, (method[0] == 'a'), (method.indexOf('p') == -1));
			return this;
		};
	});

	function defineAnimateThread(elem) {
		var transition = {}, matches;
		if (!fn.isDefined(elem.animateThread) || elem.animateThread.getStatus() == 'completed') {
			elem.animateThread = fn.Thread();
			while (!!(matches = transitionFormula.exec(Jet(elem).css('transition')))) {
				transition[matches[1]] = matches[0];
			}
			elem.animateThread.default = fn.clone(transition);
			elem.animateThread.finally(function() {
				Jet(elem).css('transition', elem.animateThread.default);
			});
		}
		return transition;
	}
	fn.each('click dblClick focus blur change select mouseEnter mouseLeave mouseOver mouseOut submit mouseDown mouseUp mouseMove scroll wheel resize'.split(' '), function() {
		(function(event) {
			/**
			 * Bind an event handler to the "focus" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       click
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "dblClick" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       dblClick
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "focus" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       focus
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "blur" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       blur
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "change" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       change
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "select" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       select
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseEnter" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       mouseEnter
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseLeave" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       mouseLeave
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseOver" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       mouseOver
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseOut" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       mouseOut
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseUp" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       mouseUp
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseDown" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       mouseDown
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "submit" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       submit
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "mouseMove" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       mouseMove
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "scroll" JavaScript event, or trigger that
			 * event on an element.
			 *
			 * @name       scroll
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "wheel" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       wheel
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			/**
			 * Bind an event handler to the "resize" JavaScript event, or trigger
			 * that event on an element.
			 *
			 * @name       resize
			 * @param      {Function}   callback  A function to execute each time the
			 *                                    event is triggered.
			 * @return     {JetObject}  { description_of_the_return_value }
			 */
			JetObject.prototype[event] = function(callback) {
				if (fn.isDefined(callback)) {
					this.on(event, callback);
				} else {
					this.trigger(event);
				}
				return this;
			};
		})(this);
	});

	fn.each(['Width', 'Height'], function(key, name) {
		var prop = name.toLowerCase();
		/**
		 * Get the current computed height for the first element in the set of
		 * matched elements or set the height of every matched element.
		 *
		 * @name       height
		 * @param      {String|Function}  value   An integer representing the number
		 *                                        of pixels, or an integer with an
		 *                                        optional unit of measure appended
		 *                                        (as a string). Or a function
		 *                                        returning the height to set.
		 *                                        Receives the index position of the
		 *                                        element in the set and the old
		 *                                        height as arguments. Within the
		 *                                        function, this refers to the
		 *                                        current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		/**
		 * Get the current computed width for the first element in the set of
		 * matched elements or set the width of every matched element.
		 *
		 * @name       width
		 * @param      {String|Function}  value   An integer representing the number
		 *                                        of pixels, or an integer with an
		 *                                        optional unit of measure appended
		 *                                        (as a string). Or a function
		 *                                        returning the height to set.
		 *                                        Receives the index position of the
		 *                                        element in the set and the old
		 *                                        height as arguments. Within the
		 *                                        function, this refers to the
		 *                                        current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		JetObject.prototype[prop] = function(value) {
			if (fn.isDefined(value)) {
				fn.each(this, function(i) {
					var el, newValue;
					el = Jet(this);
					newValue = (fn.isCallable(value)) ? value.call(this, i, el.css(prop)) : value;
					if (!regexUnit.test(newValue)) {
						newValue += 'px';
					}
					el.css(prop, newValue);
				});
				return this;
			} else {
				if (!this.length || fn.isWindow(this[0])) {
					return parseInt(win['inner' + name]);
				} else if (fn.isDocument(this[0])) {
					return parseInt(this[0].documentElement['client' + name] || Jet(this[0]).css('client' + name));
				} else {
					return parseInt(this.css(prop));
				}
			}
		};
	});

	fn.each(['margin', 'padding', 'border-width'], function(key, name) {
		/**
		 * Get the current margin for the first element in the set of
		 * matched elements or set the margin of every matched element.
		 *
		 * @name       margin
		 * @param      {String|Function}  value   An integer representing the number
		 *                                        of pixels, or an integer with an
		 *                                        optional unit of measure appended
		 *                                        (as a string). Or a function
		 *                                        returning the height to set.
		 *                                        Receives the index position of the
		 *                                        element in the set and the old
		 *                                        height as arguments. Within the
		 *                                        function, this refers to the
		 *                                        current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		/**
		 * Get the current padding for the first element in the set of
		 * matched elements or set the padding of every matched element.
		 *
		 * @name       padding
		 * @param      {String|Function}  value   An integer representing the number
		 *                                        of pixels, or an integer with an
		 *                                        optional unit of measure appended
		 *                                        (as a string). Or a function
		 *                                        returning the height to set.
		 *                                        Receives the index position of the
		 *                                        element in the set and the old
		 *                                        height as arguments. Within the
		 *                                        function, this refers to the
		 *                                        current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		/**
		 * Get the current border-width for the first element in the set of
		 * matched elements or set the border-width of every matched element.
		 *
		 * @name       borderWidth
		 * @param      {String|Function}  value   An integer representing the number
		 *                                        of pixels, or an integer with an
		 *                                        optional unit of measure appended
		 *                                        (as a string). Or a function
		 *                                        returning the height to set.
		 *                                        Receives the index position of the
		 *                                        element in the set and the old
		 *                                        height as arguments. Within the
		 *                                        function, this refers to the
		 *                                        current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		JetObject.prototype[fn.camelCase(name)] = function(value) {
			var result,
				object = {
					top: 0,
					right: 0,
					bottom: 0,
					left: 0
				},
				self = this,
				pos;
			if (fn.isDefined(value)) {
				if (fn.isPlainObject(value)) {
					fn.each(['top', 'right', 'bottom', 'left'], function() {
						if (fn.isDefined(value[this])) {
							if (!regexUnit.test(value[this])) {
								value[this] += 'px';
							}
							self.css(((pos = name.indexOf('-')) >= 0) ? name.substr(0, pos) + '-' + this + '-' + name.substr(pos + 1) : name + '-' + this, value[this]);
						}
					});
				} else if (fn.isString(value) || fn.isNumber(value)) {
					if (!regexUnit.test(value)) {
						value += 'px';
					}
					this.css(name, value);
				}
				return this;
			} else {
				result = this.css(name).split(' ');
				object.top = parseInt(result[0]);
				object.right = parseInt(result[1] || result[0]);
				object.bottom = parseInt(result[2] || result[0]);
				object.left = parseInt(result[3] || result[1] || result[0]);
				return object;
			}
		};
	});

	fn.each(['addClass', 'removeClass'], function(key, name) {
		/**
		 * Adds the specified class(es) to each element in the set of matched
		 * elements.
		 *
		 * @name       addClass
		 * @param      {String|Function}  classname  One or more space-separated
		 *                                           classes to be added to the
		 *                                           class attribute of each matched
		 *                                           element. Or a function
		 *                                           returning one or more
		 *                                           space-separated class names to
		 *                                           be added to the existing class
		 *                                           name(s). Receives the index
		 *                                           position of the element in the
		 *                                           set and the existing class
		 *                                           name(s) as arguments. Within
		 *                                           the function, this refers to
		 *                                           the current element in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		/**
		 * Remove a single class, multiple classes, or all classes from each element
		 * in the set of matched elements.
		 *
		 * @name       removeClass
		 * @param      {String|Function}  classname  One or more space-separated
		 *                                           classes to be removed to the
		 *                                           class attribute of each matched
		 *                                           element. Or a function
		 *                                           returning one or more
		 *                                           space-separated class names to
		 *                                           be removed to the existing
		 *                                           class name(s). Receives the
		 *                                           index position of the element
		 *                                           in the set and the existing
		 *                                           class name(s) as arguments.
		 *                                           Within the function, this
		 *                                           refers to the current element
		 *                                           in the set.
		 * @return     {JetObject}        { description_of_the_return_value }
		 */
		JetObject.prototype[name] = function(classname) {
			if (classname) {
				fn.each(this, function(i) {
					var classes = [], cn;
					fn.each(this.className.split(' '), function() {
						classes[this] = true;
					});
					cn = (fn.isCallable(classname)) ? classname.call(this.className, i, this.className) : classname;
					if (fn.isString(cn)) {
						cn = cn.split(' ');
					}

					if (fn.isIterator(cn)) {
						fn.each(cn, function() {
							if (name == 'addClass') {
								classes[this] = true;
							} else {
								delete classes[this];
							}
						});
						this.className = Object.keys(classes).join(' ').trim();
					}
				});
			}
			return this;
		};
	});

	fn.each({
		scrollTop: 'height',
		scrollLeft: 'width'
	}, function(name, prop) {
		var direction = name.replace('scroll', '').toLowerCase(),
			xyOffset = (direction == 'top') ? 'pageYOffset' : 'pageXOffset';

		/**
		 * Get the current vertical position of the scroll bar for the first element
		 * in the set of matched elements or set the vertical position of the scroll
		 * bar for every matched element.
		 *
		 * @name       scrollTop
		 * @param      {Number}     value   A number indicating the new position to
		 *                                  set the scroll bar to.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		/**
		 * Get the current horizortal position of the scroll bar for the first
		 * element in the set of matched elements or set the vertical position of
		 * the scroll bar for every matched element.
		 *
		 * @name       scrollLeft
		 * @param      {Number}     value   A number indicating the new position to
		 *                                  set the scroll bar to.
		 * @return     {JetObject}  { description_of_the_return_value }
		 */
		JetObject.prototype[name] = function(value) {
			var position = 0,
				elem = this[0];
			if (fn.isDefined(value)) {
				if (value.constructor == JetObject) {
					value = value[0];
				}

				if (fn.isDOMElement(value)) {
					value = Jet(value).offset()[direction] + this[name]() - this.offset()[direction];
					if (value < 0) {
						value = 0;
					}
				} else {
					value = parseInt(value);
				}

				if (fn.isWindow(elem)) {
					elem[xyOffset] = value;
				} else if (fn.isDocument(elem)) {
					elem.body[name] = value;
				} else if (fn.isDOMElement(elem)) {
					elem[name] = value;
				}
				return this;
			} else {
				if (fn.isWindow(elem)) {
					position = elem[xyOffset];
				} else if (fn.isDocument(elem)) {
					position = elem.documentElement[name] || elem.body[name] || 0;
				} else if (fn.isDOMElement(elem)) {
					position = elem[name] || 0;
				}
				return (isNaN(position)) ? 0 : position;
			}
		};
	});

	function siblingElement(object, type) {
		var direction = type + 'Sibling',
			elementDirection = type + 'ElementSibling';
		if (!object) return null;
		if (object[elementDirection]) {
			return object[elementDirection];
		} else if (object[direction]) {
			while (!!(object = object[direction])) {
				if (fn.isDOMElement(object)) {
					return object;
				}
			}
		}
		return null;
	}

	fn.each('next previous'.split(' '), function() {
		var name = this;
		JetObject.prototype[name.substring(0, 4)] = function(selector) {
			var element = this[0];
			if (element) {
				while (!!(element = siblingElement(element, name))) {
					if (!fn.isDefined(selector) || Jet(element).is(selector)) {
						return Jet(element);
					}
				}
			}
			return Jet();
		};

		JetObject.prototype[name.substring(0, 4) + 'All'] = function(selector, until) {
			var element = this[0], domList = [];
			if (element) {
				while (!!(element = siblingElement(element, name))) {
					if (fn.isDefined(until) && Jet(element).is(until)) {
						break;
					}
					if (!fn.isDefined(selector) || Jet(element).is(selector)) {
						domList.push(element);
					}
				}
			}
			return Jet(domList);
		};
	});

	function getWidthHeight(JetObj, type, cssprops, value) {
		var matches,
			el,
			newValue = 0,
			adjustValue = 0;

		fn.each(cssprops, function() {
			adjustValue += parseInt(JetObj.css(this));
		});

		if (fn.isDefined(value)) {
			if (fn.isDefined(JetObj[0])) {
				el = Jet(JetObj[0]);
				if (fn.isString(value)) {
					matches = regexUnit.exec(value.trim());
					// If the value equal 'auto'
					if (fn.isDefined(matches[3])) {
						el.css(type, matches[3]);
					} else if (fn.isDefined(matches[1])) {
						if (fn.isDefined(matches[2])) {
							newValue = el.css(type, value).css(type);
							newValue -= adjustValue;
						} else {
							newValue = parseInt(matches[1]) - adjustValue;
						}
						el.css(type, (newValue < 0 || isNaN(newValue) ? 0 : newValue) + 'px');
					}
				} else if (fn.isNumber(value)) {
					newValue = value - adjustValue;
					el.css(type, (newValue < 0 || isNaN(newValue) ? 0 : newValue) + 'px');
				} else if (fn.isCallable(value)) {
					getWidthHeight(JetObj, type, cssprops, value.call(JetObj, el.css(type)));
				}
			}
			return JetObj;
		} else {
			value = parseInt(JetObj.css(type));
			if (value) {
				value += adjustValue;
			}
			return value;
		}
	}

	function insertTo(target, element, isAppend, isInsert) {
		var contents, length = (target.length) ? target.length - 1 : 0;
		if (fn.isIterator(element) && element.length > 0 || element.constructor == JetObject) {
			contents = element;
		} else if (fn.isString(element)) {
			contents = [doc.createTextNode(element)];
		} else if (fn.isDOMElement(element)) {
			contents = [element];
		}

		if (contents) {
			fn.each(target, function(i, el) {
				if (!fn.isDefined(el.nodeType)) {
					return;
				}

				el = (el.nodeType === 1) ? el : fn.owner(el).document.body;
				fn.each(contents, function(j, insert) {
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
	}

	function triggerOnLoad() {
		if (!onHold) {
			fn.each(onLoadEvent, function() {
				this.call(win);
			});
			onLoadEvent = [];
		}
	}

	// DOM Ready on post load
	if (doc.readyState === 'complete') {
		setTimeout(triggerOnLoad);
	} else {
		// Setup DOM Ready Event
		if (win.addEventListener) {
			doc.addEventListener('DOMContentLoaded', triggerOnLoad, false);
		} else {
			var top = !win.frameElement && doc.documentElement;
			// If the top view can be scrolled, trigger onLoadEvent
			if (top && top.doScroll) {
				(function poll() {
					if (onLoadEvent.length) {
						try {
							top.doScroll('left');
						} catch (e) {
							// Re-call until doScroll is work
							return setTimeout(poll, 50);
						}
						triggerOnLoad();
					}
				})();
			}

			doc.onreadystatechange = function() {
				if (doc.readyState === 'complete') {
					doc.onreadystatechange = null;
					triggerOnLoad();
				}
			};
		}

		win.onload = function() {
			triggerOnLoad();
			win.onload = null;
		};
	}

	var variableBinding = fn.parseQuery(queryString)['v'] || 'Jet';

	if (global[variableBinding]) {
		conflict = global[variableBinding];
	}
	global[variableBinding] = Jet;
})((typeof window !== 'undefined') ? window : this);
