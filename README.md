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
// Return the type of object 
jet.Detect(obj)
```
```js
// Check to see if an object can be Iterated. 
jet.IsWalkable(obj)
```
```js
// Check to see if an object is a jet object. 
jet.IsJetObject(obj)
```
```js
// Check to see if an object is a collection or an array. 
jet.IsCollection(obj)
```
```js
// Check to see if an object is defined. 
jet.IsDefined(obj)
```
```js
// Check to see if an object is an element object. 
jet.IsElement(obj)
```
```js
// Check to see if an object is an array. 
jet.IsArray(obj)
```
```js
// Check to see if an object is an object. 
jet.IsObject(obj)
```
```js
// Check to see if an object is a callback function. 
jet.IsFunction(obj)
```
```js
// Check to see if an object is a string. 
jet.IsString(obj)
```
```js
// Check to see if an object is a number. 
jet.IsNumeric(obj)
```
```js
// Check to see if an object is a plain object (created using "{}" or "new Object").
jet.IsPlainObject(obj)
```
```js
// Check to see if an object is a document node.
jet.IsDocument(obj)
```
```js
// Check to see if an object or array is empty.
jet.IsEmpty(obj)
```
```js
// Seamlessly iterate each item of an array, array-like or object.
jet.Each(obj, callback)
```
```js
// Check to see if an object is included in a specified array.
jet.InArray(obj)
```
```js
// Release the jet control of the jet variable.
jet.NoConflict()
```
```js
// Merge the contents of the object into jet control prototype.
jet.Extend(obj)
```
```js
// Merge the contents of the object specified into the first object.
jet.ExtendObject(objA, objB, inherit)
```
```js
// Install a mirroring plugin to jet.
jet.Install(obj, isFullSet)
```
```js
// Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).
jet.Ready(callback)
```
```js
// Strip whitespace from the beginning and end of a string
jet.Trim(text)
```
```js
// Check to see the element is the first or the last node in current node set. Equivalent as jet.Is(obj, ':first-child') or jet.Is(obj, ':last-child').
jet.ChildAt(obj, type)
```
```js
// Convert the string into jet object.
jet.Shift(html)
```
```js
// Convert the string into jet object.
jet.ComparePosition(a, b)
```
```js
// Capital the first letter of a string.
jet.Capitalise(text)
```
```js
// Convert from Underscore text or Hyphen text to Camel Case one.
jet.CamelCase(text)
```
```js
// Perform an Asynchronous JavaScript and XML (Ajax) request and apply the JSON or XML object into specified callback function.
jet.Ajax(obj)
```
```js
// Perform a web request with get / post method.
jet.Request(obj)
```
```js
// Register a Hook for jet.CSS()
jet.RegisterCSSHook(name, callback)
```
```js
// Register a Hook for jet.Value()
jet.RegisterValueHook(name, callback)
```
```js
jet.RegisterPropHook(name, callback)
// Register a Hook for jet.Prop()
```
```js
jet.RegisterUnitHook(name, obj)
// Register a Hook for jUnit calculation
```
```js
jet.Walk(obj, callback)
// Execute the user-defined callback function to each item of the array, array-like object, plain object or object.
```
```js
jet.BuildQueryString(obj)
// Generates a URL-encoded query string from the array or plain object provided.
```
```js
.Merge(obj)
// Merge a set of elements into current set of matched elements that not be added or duplicate.
```
```js
.Add(element)
// Add an element into current set of matched elements that not be added or duplicate.
```
```js
.Finalize()
// Reset each of the set of matched elements 'added' frag.
```
```js
.Each(callback)
// Iterate over a jet object, executing a function for each matched element.
```
```js
.Find(selector)
// Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.
```
```js
.Hide(duration, callback)
// Hide the matched elements.
```
```js
.Show(duration, callback)
// Show the matched elements.
```
```js
.Prev()
// Retuens the previous sibling element from the first element of the set of matched elements.
```
```js
.Next()
// Retuens the previous sibling element from the first element of the set of matched elements.
```
```js
.Get(start[, length])
// Returns the specified element or a number of elements with jet object.
```
```js
.Filter(callback)
// Reduce the set of matched elements to those that match the selector or pass the function’s test.
```
```js
.Walk(callback)
// Execute the user-defined callback function to each element of the set of matched elements.
```
```js
.OnEvent(event[, callback])
// Apply or trigger event to each of the set of matched elements.
```
```js
.Click(callback)
// Apply or trigger OnClick event to each of the set of matched elements.
```
```js
.DblClick(callback)
// Apply or trigger OnDblClick event to each of the set of matched elements.
```
```js
.Focus(callback)
// Apply or trigger OnFocus event to each of the set of matched elements.
```
```js
.Blur(callback)
// Apply or trigger OnBlur event to each of the set of matched elements.
```
```js
.Change(callback)
// Apply or trigger OnChange event to each of the set of matched elements.
```
```js
.Select(callback)
// Apply or trigger OnSelect event to each of the set of matched elements.
```
```js
.MouseOver(callback)
// Apply or trigger OnMouseOver event to each of the set of matched elements.
```
```js
.MouseOut(callback)
// Apply or trigger OnMouseOut event to each of the set of matched elements.
```
```js
.Ready(callback)
// Apply or trigger OnLoad event to each of the set of matched elements.
```
```js
.Unload(callback)
// Apply or trigger Unload event to each of the set of matched elements.
```
```js
.Submit(callback)
// Apply or trigger OnSubmit event to each of the set of matched elements.
```
```js
.Animate(callback[, duration, easing, callback])
// Perform a custom animation of a set of CSS properties.
```
```js
.Submit(callback)
// Wait a specified period of time for next animation
```
```js
.Append(element) mirroring jet.Append(@obj, element)
// Insert content to the end of each element in the set of matched elements.
```
```js
.Prepend(element) mirroring jet.Prepend(@obj, element)
// Insert content to the beginning of each element in the set of matched elements.
```
```js
.AppendTo(element) mirroring jet.AppendTo(@obj, element)
// Insert every element in the set of matched elements to the end of the target.
```
```js
.PrependTo(element) mirroring jet.PrependTo(@obj, element)
// Insert every element in the set of matched elements to the beginning of the target.
```
```js
.Prop(prop[, value]) mirroring jet.Prop(@obj, prop[, value])
// Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
```
```js
.RemoveProp(prop) mirroring jet.RemoveProp(@obj, prop)
// Remove the property for every matched element.
```
```js
.CSS(prop[, value]) mirroring jet.CSS(@obj, prop[, value])
// Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.
```
```js
.ToggleClass(prop) mirroring jet.ToggleClass(@obj, prop)
// Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.
```
```js
.AddClass(prop) mirroring jet.AddClass(@obj, prop)
// Add one or more classes from each element in the set of matched elements.
```
```js
.RemoveClass(prop) mirroring jet.RemoveClass(@obj, prop)
// Remove one or more classes from each element in the set of matched elements.
```
```js
.Attr(attr[, value]) mirroring jet.Attr(@obj, attr[, value])
// Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.
```
```js
.RemoveAttr(attr) mirroring jet.RemoveAttr(@obj, attr)
// Remove one or more attributes from each element in the set of matched elements.
```
```js
.Html([value]) mirroring jet.Html(@obj[, value])
// Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.
```
```js
.Bind(event, callback) mirroring jet.Bind(@obj, event, callback)
// Bind the callback function to specifed event in every matched element.
```
```js
.Unbind(event) mirroring jet.Unbind(@obj, event)
// Unbind the specifed event in every matched element.
```
```js
.Trigger(event) mirroring jet.Trigger(@obj, event)
// Fire the specifed event in every matched element.
```
```js
.Is(selector) mirroring jet.Is(@obj, selector)
// Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.
```
```js
.Value(value) mirroring jet.Value(@obj, value)
// Get the current value of the first element in the set of matched elements or set the value of every matched element.
```
```js
.Text(value) mirroring jet.Text(@obj, value)
// Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.
```
```js
.Detach() mirroring jet.Detach(@obj)
// Remove the set of matched elements from the DOM.
```
```js
.Sibling(type) mirroring jet.Sibling(@obj, type)
// Get the previous or next sibling element from the first element of the set of matched elements.
```
```js
.HasClass(classNameList) mirroring jet.HasClass(@obj, classNameList)
// Check the first element of the set of matched elements has included one or more classes.
```
```js
.IsActive() mirroring jet.IsActive(@obj)
// Check the first element of the set of matched elements is active (focus) in current document.
```
```js
.GetUnit(prop) mirroring jet.GetUnit(@obj, prop)
// Get the CSS value in jUnit object from the first element's position of the set of matched elements.
```
```js
.Offset() mirroring jet.Offset(@obj)
// Get the first element's position of the set of matched elements.
```
```js
.Height([value]) mirroring jet.Height(@obj[, value])
// Get the first element's height of the set of matched elements or set the height for every matched element.
```
```js
.InnerHeight() mirroring jet.InnerHeight(@obj)
// Get the first element's height without border, padding and margin of the set of matched elements.
```
```js
.OuterHeight() mirroring jet.OuterHeight(@obj)
// Get the first element's height with padding and border, even include the margin of the set of matched elements.
```
```js
.Width([value]) mirroring jet.Width(@obj[, value])
// Get the first element's width of the set of matched elements or set the width for every matched element.
```
```js
.InnerWidth() mirroring jet.InnerWidth(@obj)
// Get the first element's width without border, padding and margin of the set of matched elements.
```
```js
.OuterWidth() mirroring jet.OuterWidth(@obj)
// Get the first element's width with padding and border, even include the margin of the set of matched elements.
```
```js
.Parent([selector]) mirroring jet.Parent(@obj[, selector])
// Get the parent element from first element of the set of matched element, optionally filtered by a selector.
```
```js
.Parents([selector]) mirroring jet.Parents(@obj[, selector])
// Get the ancestors from first element of the set of matched element, optionally filtered by a selector.
```
```js
.Childs([selector]) mirroring jet.Childs(@obj[, selector])
// Get the child elements from first element of the set of matched element, optionally filtered by a selector.
```
```js
.ScrollTop([value]) mirroring jet.ScrollTop(@obj[, value])
// Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.
```
```js
.ScrollLeft([value]) mirroring jet.ScrollLeft(@obj[, value])
// Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.
```
```js
.ScrollTo(x, y) mirroring jet.ScrollTo(@obj, x, y)
// Scroll every matched element to specified position.
```
```js
.Handler(event) mirroring jet.Handler(@obj, event)
// Get the first element's event callback function of the set of matched elements
```
```js
.Serialize() mirroring jet.Serialize(@obj)
// Encode a set of form elements as a string for submission.
