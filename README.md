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
// Install a
plugin to jet.
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
// Register a Hook for jet.Prop()
jet.RegisterPropHook(name, callback)
```
```js
// Register a Hook for jUnit calculation
jet.RegisterUnitHook(name, obj)
```
```js
// Execute the user-defined callback function to each item of the array, array-like object, plain object or object.
jet.Walk(obj, callback)
```
```js
// Generates a URL-encoded query string from the array or plain object provided.
jet.BuildQueryString(obj)
```
```js
// Merge a set of elements into current set of matched elements that not be added or duplicate.
.Merge(obj)
```
```js
// Add an element into current set of matched elements that not be added or duplicate.
.Add(element)
```
```js
// Reset each of the set of matched elements 'added' frag.
.Finalize()
```
```js
// Iterate over a jet object, executing a function for each matched element.
.Each(callback)
```
```js
// Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.
.Find(selector)
```
```js
// Hide the matched elements.
.Hide(duration, callback)
```
```js
// Show the matched elements.
.Show(duration, callback)
```
```js
// Retuens the previous sibling element from the first element of the set of matched elements.
.Prev()
```
```js
// Retuens the previous sibling element from the first element of the set of matched elements.
.Next()
```
```js
// Returns the specified element or a number of elements with jet object.
.Get(start[, length])
```
```js
// Reduce the set of matched elements to those that match the selector or pass the function’s test.
.Filter(callback)
```
```js
// Execute the user-defined callback function to each element of the set of matched elements.
.Walk(callback)
```
```js
// Apply or trigger event to each of the set of matched elements.
.OnEvent(event[, callback])
```
```js
// Apply or trigger OnClick event to each of the set of matched elements.
.Click(callback)
```
```js
// Apply or trigger OnDblClick event to each of the set of matched elements.
.DblClick(callback)
```
```js
// Apply or trigger OnFocus event to each of the set of matched elements.
.Focus(callback)
```
```js
// Apply or trigger OnBlur event to each of the set of matched elements.
.Blur(callback)
```
```js
// Apply or trigger OnChange event to each of the set of matched elements.
.Change(callback)
```
```js
// Apply or trigger OnSelect event to each of the set of matched elements.
.Select(callback)
```
```js
// Apply or trigger OnMouseOver event to each of the set of matched elements.
.MouseOver(callback)
```
```js
// Apply or trigger OnMouseOut event to each of the set of matched elements.
.MouseOut(callback)
```
```js
// Apply or trigger OnLoad event to each of the set of matched elements.
.Ready(callback)
```
```js
// Apply or trigger Unload event to each of the set of matched elements.
.Unload(callback)
```
```js
// Apply or trigger OnSubmit event to each of the set of matched elements.
.Submit(callback)
```
```js
// Perform a custom animation of a set of CSS properties.
.Animate(callback[, duration, easing, callback])
```
```js
// Wait a specified period of time for next animation
.Submit(callback)
```
```js
// Insert content to the end of each element in the set of matched elements.
.Append(element)
jet.Append(obj, element)
```
```js
// Insert content to the beginning of each element in the set of matched elements.
.Prepend(element)
jet.Prepend(obj, element)
```
```js
// Insert every element in the set of matched elements to the end of the target.
.AppendTo(element)
jet.AppendTo(obj, element)
```
```js
// Insert every element in the set of matched elements to the beginning of the target.
.PrependTo(element)
jet.PrependTo(obj, element)
```
```js
// Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.
.Prop(prop[, value])
jet.Prop(obj, prop[, value])
```
```js
// Remove the property for every matched element.
.RemoveProp(prop)
jet.RemoveProp(obj, prop)
```
```js
// Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.
.CSS(prop[, value])
jet.CSS(obj, prop[, value])
```
```js
// Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.
.ToggleClass(prop)
jet.ToggleClass(obj, prop)
```
```js
// Add one or more classes from each element in the set of matched elements.
.AddClass(prop)
jet.AddClass(obj, prop)
```
```js
// Remove one or more classes from each element in the set of matched elements.
.RemoveClass(prop)
jet.RemoveClass(obj, prop)
```
```js
// Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.
.Attr(attr[, value])
jet.Attr(obj, attr[, value])
```
```js
// Remove one or more attributes from each element in the set of matched elements.
.RemoveAttr(attr)
jet.RemoveAttr(obj, attr)
```
```js
// Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.
.Html([value])
jet.Html(obj[, value])
```
```js
// Bind the callback function to specifed event in every matched element.
.Bind(event, callback)
jet.Bind(obj, event, callback)
```
```js
// Unbind the specifed event in every matched element.
.Unbind(event)
jet.Unbind(obj, event)
```
```js
// Fire the specifed event in every matched element.
.Trigger(event)
jet.Trigger(obj, event)
```
```js
// Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.
.Is(selector)
jet.Is(obj, selector)
```
```js
// Get the current value of the first element in the set of matched elements or set the value of every matched element.
.Value(value)
jet.Value(obj, value)
```
```js
// Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.
.Text(value)
jet.Text(obj, value)
```
```js
// Remove the set of matched elements from the DOM.
.Detach()
jet.Detach(obj)
```
```js
// Get the previous or next sibling element from the first element of the set of matched elements.
.Sibling(type)
jet.Sibling(obj, type)
```
```js
// Check the first element of the set of matched elements has included one or more classes.
.HasClass(classNameList)
jet.HasClass(obj, classNameList)
```
```js
// Check the first element of the set of matched elements is active (focus) in current document.
.IsActive()
jet.IsActive(obj)
```
```js
// Get the CSS value in jUnit object from the first element's position of the set of matched elements.
.GetUnit(prop)
jet.GetUnit(obj, prop)
```
```js
// Get the first element's position of the set of matched elements.
.Offset()
jet.Offset(obj)
```
```js
// Get the first element's height of the set of matched elements or set the height for every matched element.
.Height([value])
jet.Height(obj[, value])
```
```js
// Get the first element's height without border, padding and margin of the set of matched elements.
.InnerHeight()
jet.InnerHeight(obj)
```
```js
// Get the first element's height with padding and border, even include the margin of the set of matched elements.
.OuterHeight()
jet.OuterHeight(obj)
```
```js
// Get the first element's width of the set of matched elements or set the width for every matched element.
.Width([value])
jet.Width(obj[, value])
```
```js
// Get the first element's width without border, padding and margin of the set of matched elements.
.InnerWidth()
jet.InnerWidth(obj)
```
```js
// Get the first element's width with padding and border, even include the margin of the set of matched elements.
.OuterWidth()
jet.OuterWidth(obj)
```
```js
// Get the parent element from first element of the set of matched element, optionally filtered by a selector.
.Parent([selector])
jet.Parent(obj[, selector])
```
```js
// Get the ancestors from first element of the set of matched element, optionally filtered by a selector.
.Parents([selector])
jet.Parents(obj[, selector])
```
```js
// Get the child elements from first element of the set of matched element, optionally filtered by a selector.
.Childs([selector])
jet.Childs(obj[, selector])
```
```js
// Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.
.ScrollTop([value])
jet.ScrollTop(obj[, value])
```
```js
// Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.
.ScrollLeft([value])
jet.ScrollLeft(obj[, value])
```
```js
// Scroll every matched element to specified position.
.ScrollTo(x, y)
jet.ScrollTo(obj, x, y)
```
```js
// Get the first element's event callback function of the set of matched elements
.Handler(event)
jet.Handler(obj, event)
```
```js
// Encode a set of form elements as a string for submission.
.Serialize()
jet.Serialize(obj)
