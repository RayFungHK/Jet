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

jet.Detect(obj): Return the type of object 

jet.IsWalkable(obj): Check to see if an object can be Iterated. 

jet.IsJetObject(obj): Check to see if an object is a jet object. 

jet.IsCollection(obj): Check to see if an object is a collection or an array. 

jet.IsDefined(obj): Check to see if an object is defined. 

jet.IsElement(obj): Check to see if an object is an element object. 

jet.IsArray(obj): Check to see if an object is an array. 

jet.IsObject(obj): Check to see if an object is an object. 

jet.IsFunction(obj): Check to see if an object is a callback function. 

jet.IsString(obj): Check to see if an object is a string. 

jet.IsNumeric(obj): Check to see if an object is a number. 

jet.IsPlainObject(obj): Check to see if an object is a plain object (created using "{}" or "new Object").

jet.IsDocument(obj): Check to see if an object is a document node.

jet.IsEmpty(obj): Check to see if an object or array is empty.

jet.Each(obj, callback): Seamlessly iterate each item of an array, array-like or object.

jet.InArray(obj): Check to see if an object is included in a specified array.

jet.NoConflict(): Release the jet control of the jet variable.

jet.Extend(obj): Merge the contents of the object into jet control prototype.

jet.ExtendObject(objA, objB, inherit): Merge the contents of the object specified into the first object.

jet.Install(obj, isFullSet): Install a mirroring plugin to jet.

jet.Ready(callback): Add the callback function to queue and execute when the DOM is fully loaded. Equivalent as jet(callback).

jet.Trim(text): Strip whitespace from the beginning and end of a string

jet.ChildAt(obj, type): Check to see the element is the first or the last node in current node set. Equivalent as jet.Is(obj, ':first-child') or jet.Is(obj, ':last-child').

jet.Shift(html): Convert the string into jet object.

jet.ComparePosition(a, b): Convert the string into jet object.

jet.Capitalise(text): Capital the first letter of a string.

jet.CamelCase(text): Convert from Underscore text or Hyphen text to Camel Case one.

jet.Ajax(obj): Perform an Asynchronous JavaScript and XML (Ajax) request and apply the JSON or XML object into specified callback function.

jet.Request(obj): Perform a web request with get / post method.

jet.RegisterCSSHook(name, callback): Register a Hook for jet.CSS()

jet.RegisterValueHook(name, callback): Register a Hook for jet.Value()

jet.RegisterPropHook(name, callback): Register a Hook for jet.Prop()

jet.RegisterUnitHook(name, obj): Register a Hook for jUnit calculation

jet.Walk(obj, callback): Execute the user-defined callback function to each item of the array, array-like object, plain object or object.

jet.BuildQueryString(obj): Generates a URL-encoded query string from the array or plain object provided.

.Merge(obj): Merge a set of elements into current set of matched elements that not be added or duplicate.

.Add(element): Add an element into current set of matched elements that not be added or duplicate.

.Finalize(): Reset each of the set of matched elements 'added' frag.

.Each(callback): Iterate over a jet object, executing a function for each matched element.

.Find(selector): Get the descendants of each element in the current set of matched elements, filtered by a selector, jet object, array, array-like object, or element.

.Hide(duration, callback): Hide the matched elements.

.Show(duration, callback): Show the matched elements.

.Prev(): Retuens the previous sibling element from the first element of the set of matched elements.

.Next(): Retuens the previous sibling element from the first element of the set of matched elements.

.Get(start[, length]): Returns the specified element or a number of elements with jet object.

.Filter(callback): Reduce the set of matched elements to those that match the selector or pass the function’s test.

.Walk(callback): Execute the user-defined callback function to each element of the set of matched elements.

.OnEvent(event[, callback]): Apply or trigger event to each of the set of matched elements.

.Click(callback): Apply or trigger OnClick event to each of the set of matched elements.

.DblClick(callback): Apply or trigger OnDblClick event to each of the set of matched elements.

.Focus(callback): Apply or trigger OnFocus event to each of the set of matched elements.

.Blur(callback): Apply or trigger OnBlur event to each of the set of matched elements.

.Change(callback): Apply or trigger OnChange event to each of the set of matched elements.

.Select(callback): Apply or trigger OnSelect event to each of the set of matched elements.

.MouseOver(callback): Apply or trigger OnMouseOver event to each of the set of matched elements.

.MouseOut(callback): Apply or trigger OnMouseOut event to each of the set of matched elements.

.Ready(callback): Apply or trigger OnLoad event to each of the set of matched elements.

.Unload(callback): Apply or trigger Unload event to each of the set of matched elements.

.Submit(callback): Apply or trigger OnSubmit event to each of the set of matched elements.

.Animate(callback[, duration, easing, callback]): Perform a custom animation of a set of CSS properties.

.Submit(callback): Wait a specified period of time for next animation

.Append(element) mirroring jet.Append(@obj, element): Insert content to the end of each element in the set of matched elements.

.Prepend(element) mirroring jet.Prepend(@obj, element): Insert content to the beginning of each element in the set of matched elements.

.AppendTo(element) mirroring jet.AppendTo(@obj, element): Insert every element in the set of matched elements to the end of the target.

.PrependTo(element) mirroring jet.PrependTo(@obj, element): Insert every element in the set of matched elements to the beginning of the target.

.Prop(prop[, value]) mirroring jet.Prop(@obj, prop[, value]): Get the value of a property for the first element in the set of matched elements or set one or more properties for every matched element.

.RemoveProp(prop) mirroring jet.RemoveProp(@obj, prop): Remove the property for every matched element.

.CSS(prop[, value]) mirroring jet.CSS(@obj, prop[, value]): Get the value of a style for the first element in the set of matched elements or set one or more styles for every matched element.

.ToggleClass(prop) mirroring jet.ToggleClass(@obj, prop): Add or remove one or more classes from each element in the set of matched elements, depending on either the class’s presence or the value of the switch argument.

.AddClass(prop) mirroring jet.AddClass(@obj, prop): Add one or more classes from each element in the set of matched elements.

.RemoveClass(prop) mirroring jet.RemoveClass(@obj, prop): Remove one or more classes from each element in the set of matched elements.

.Attr(attr[, value]) mirroring jet.Attr(@obj, attr[, value]): Get the value of an attribute for the first element in the set of matched elements or set one or more attributes for every matched element.

.RemoveAttr(attr) mirroring jet.RemoveAttr(@obj, attr): Remove one or more attributes from each element in the set of matched elements.

.Html([value]) mirroring jet.Html(@obj[, value]): Get the innerHTML content of first element of orthe set of matched elements set the innerHTML content from each element in the set of matched elements.

.Bind(event, callback) mirroring jet.Bind(@obj, event, callback): Bind the callback function to specifed event in every matched element.

.Unbind(event) mirroring jet.Unbind(@obj, event): Unbind the specifed event in every matched element.

.Trigger(event) mirroring jet.Trigger(@obj, event): Fire the specifed event in every matched element.

.Is(selector) mirroring jet.Is(@obj, selector): Check the current matched set of elements against a selector, element, or jet object . Return true if at least one of these elements matched.

.Value(value) mirroring jet.Value(@obj, value): Get the current value of the first element in the set of matched elements or set the value of every matched element.

.Text(value) mirroring jet.Text(@obj, value): Get the current text (innerText) of the first element in the set of matched elements or set the value of every matched element.

.Detach() mirroring jet.Detach(@obj): Remove the set of matched elements from the DOM.

.Sibling(type) mirroring jet.Sibling(@obj, type): Get the previous or next sibling element from the first element of the set of matched elements.

.HasClass(classNameList) mirroring jet.HasClass(@obj, classNameList): Check the first element of the set of matched elements has included one or more classes.

.IsActive() mirroring jet.IsActive(@obj): Check the first element of the set of matched elements is active (focus) in current document.

.GetUnit(prop) mirroring jet.GetUnit(@obj, prop): Get the CSS value in jUnit object from the first element's position of the set of matched elements.

.Offset() mirroring jet.Offset(@obj): Get the first element's position of the set of matched elements.

.Height([value]) mirroring jet.Height(@obj[, value]): Get the first element's height of the set of matched elements or set the height for every matched element.

.InnerHeight() mirroring jet.InnerHeight(@obj): Get the first element's height without border, padding and margin of the set of matched elements.

.OuterHeight() mirroring jet.OuterHeight(@obj): Get the first element's height with padding and border, even include the margin of the set of matched elements.

.Width([value]) mirroring jet.Width(@obj[, value]): Get the first element's width of the set of matched elements or set the width for every matched element.

.InnerWidth() mirroring jet.InnerWidth(@obj): Get the first element's width without border, padding and margin of the set of matched elements.

.OuterWidth() mirroring jet.OuterWidth(@obj): Get the first element's width with padding and border, even include the margin of the set of matched elements.

.Parent([selector]) mirroring jet.Parent(@obj[, selector]): Get the parent element from first element of the set of matched element, optionally filtered by a selector.

.Parents([selector]) mirroring jet.Parents(@obj[, selector]): Get the ancestors from first element of the set of matched element, optionally filtered by a selector.

.Childs([selector]) mirroring jet.Childs(@obj[, selector]): Get the child elements from first element of the set of matched element, optionally filtered by a selector.

.ScrollTop([value]) mirroring jet.ScrollTop(@obj[, value]): Get the first element's scroll top of the set of matched elements or set the scroll top for every matched element.

.ScrollLeft([value]) mirroring jet.ScrollLeft(@obj[, value]): Get the first element's scroll left of the set of matched elements or set the scroll left for every matched element.

.ScrollTo(x, y) mirroring jet.ScrollTo(@obj, x, y): Scroll every matched element to specified position.

.Handler(event) mirroring jet.Handler(@obj, event): Get the first element's event callback function of the set of matched elements

.Serialize() mirroring jet.Serialize(@obj): Encode a set of form elements as a string for submission.
