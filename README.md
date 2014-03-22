[Jet](http://js-jet.com/) - JavaScript Framwork Library
==================================================

Environments
--------------------------------------

- [Browser support] IE7+, Firefox, Opera, Safari, Webkit and Chrome

Installation and Configuration
--------------------------------------
1. Download the jet.js from http://js-jet.com or https://github.com/RayFungHK/Jet
2. Put insert the following script tag inside <html>
```html
<script type="text/javascript" src="{path of jet.js}"></script>
```

Function in Jet
--------------------------------------
```js
\\ Return the type of object 
jet.Detect(obj)
```
```js
\\ Check to see if an object can be Iterated. 
jet.IsWalkable(obj)
```
```js
\\ Check to see if an object is a jet object. 
jet.IsJetObject(obj)
```
```js
\\ Check to see if an object is a collection or an array. 
jet.IsCollection(obj)
```
```js
\\ Check to see if an object is defined. 
jet.IsDefined(obj)
```
```js
\\ Check to see if an object is an element object. 
jet.IsElement(obj)
```
```js
\\ Check to see if an object is an array. 
jet.IsArray(obj)
```
```js
\\ Check to see if an object is an object. 
jet.IsObject(obj)
```
```js
\\ Check to see if an object is a callback function. 
jet.IsFunction(obj)
```
```js
\\ Check to see if an object is a string. 
jet.IsString(obj)
```
```js
\\ Check to see if an object is a number. 
jet.IsNumeric(obj)
```
```js
\\ Check to see if an object is a plain object (created using "{}" or "new Object").
jet.IsPlainObject(obj)
```
```js
\\ Check to see if an object is a document node.
jet.IsDocument(obj)
```
```js
\\ Check to see if an object or array is empty.
jet.IsEmpty(obj)
```
```js
\\ Seamlessly iterate each item of an array, array-like or object.
jet.Each(obj, callback)
```
```js
\\ Check to see if an object is included in a specified array.
jet.InArray(obj)
```
```js
\\ Release the jet control of the jet variable.
jet.NoConflict()
```
```js
\\ Merge the contents of the object into jet control prototype.
jet.Extend(obj)
```
```js
\\ Merge the contents of the object specified into the first object.
jet.ExtendObject(objA, objB, inherit)
```
```js
\\ Install a mirroring plugin to jet.
jet.Install(obj, isFullSet)
```
```js
\\ Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).
jet.Ready(callback)
```
```js
\\ Strip whitespace from the beginning and end of a string
jet.Trim(text)
```
```js
\\ Check to see the element is the first or the last node in current node set. Equivalent as jet.Is(obj, ':first-child') or jet.Is(obj, ':last-child').
jet.ChildAt(obj, type)
```
```js
\\ Convert the string into jet object.
jet.Shift(html)
```
```js
\\ Convert the string into jet object.
jet.ComparePosition(a, b)
```
```js
\\ Capital the first letter of a string.
jet.Capitalise(text)
```
```js
\\ Convert from Underscore text or Hyphen text to Camel Case one.
jet.CamelCase(text)
```
```js
\\ Perform an Asynchronous JavaScript and XML (Ajax) request and apply the JSON or XML object into specified callback function.
jet.Ajax(obj)
```
```js
\\ Perform a web request with get / post method.
jet.Request(obj)
```
```js
\\ Register a Hook for jet.CSS()
jet.RegisterCSSHook(name, callback)
```
```js
\\ Register a Hook for jet.Value()
jet.RegisterValueHook(name, callback)
```
