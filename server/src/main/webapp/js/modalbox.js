/*
 ModalBox - The pop-up window thingie with AJAX, based on prototype and script.aculo.us.

 Copyright Andrey Okonetchnikov (andrej.okonetschnikow@gmail.com), 2006
 All rights reserved.
 
 VERSION 1.5.3
 Last Modified: 04/21/2007
 
 Changelog:

ver 1.5.3 (04/21/2007)
 Added: 	Unit and functional tests added
 Added: 	"Close window" text can be customized through the optional parameter 'closeString' [issue #41]
 Added: 	Custom effects duration in parameters [issue #21]
 Added: 	Ajax request method can be changed trough options (method) [issue #54]
 Fixed: 	Executing JS from MB content window fixed
 Fixed: 	MSIE horizontal scrolling after closing MB
 Fixed: 	Resize method now resize correctly [issue #42]
 Fixed: 	Loading string container doesn't appear on update (appears only loadingString text)
 Fixed: 	Bug with unfired afterLoad callback and not executed helpers methods due to bind(window) for evalScript section in loadContent method
 Fixed: 	Bug with beforeLoad callback return value (content loaded even with return value == false)

ver 1.5.2 (02/26/2007)
 Fixed: 	Scrolling by "space" key disabled then MB is visible
 Fixed: 	Scrolling by navigational keys (Up / Down / PageUp / PageDown / Home / End) keys disabled then MB is visible
 Changed: 	Keyboard handlers implementation re-factored (Closes issues #9, #11)
 Changed: 	Markup generated by modalbox optimized
 Changed: 	Scrolling on top removed for all modern browsers except IE6 and lower (Closes issues #1, #9, #11)

ver 1.5.1 (02/15/2007)
 Added: 	Callback 'beforeLoad' fired right before loading MB content. If the callback function returns false, loading will skipped.
 Changed: 	Implementation of callbacks calls changed. Callbacks now removes after execution. 
			Callbacks now have a return value (true | false). Default is true. Fixes: Issue 2 (http://code.google.com/p/modalbox/issues/detail?id=2&can=1&q=)

ver 1.5: (02/02/2007)
 Added: 	URL parameters are now passing to AJAX.Request. Use postOptions to pass parameters
 Added: 	Loading message can be customized through options. Use loadingString option
 Added:		Script.aculo.us 1.64 and prototype 1.5rc1 support
 Added:		Callbacks added on first showing, updating, loading content, closing modalbox
 Added:		Callback can be passed through hide method
 Added: 	resize method resize modalbox without loading any content into it
 Changed:	Evaluating contained scripts (striping HTML comments)
 Changed: 	Appearing of overlay is now animated
 Changed: 	Attaching events on window and overlay
 Changed: 	Method hide now get the callbacks as a parameter
 Changed: 	Inititalization redone with Builder class
 Changed: 	Minor fixes and refactoring done
 Changed: 	Focus loop engine redone
 Changed: 	self variables replaced to bind(this) functions
 Fixed: 	Scrolling to initial scroll position after closing MB
 Fixed: 	Fixed bug in IE with body's overflow auto
 
ver 1.4: (06/20/2006)
 Added: 	Core definitions rewriten. Modalbox can now be accessed thorugh Modalbox object with public methods show and hide
 Added: 	License added
 Changed:	kbdHandler method is now public, so it can be stopped from other functions
 Fixed: 	Stopping of event observing in hide method
 Fixed: 	Hiding selects for IE issue (was applied on element ID)
 Removed:	Redundant 'globalMB' global variable removed
 Removed:	Scroll window events observerving
 Removed:	Redundant effect ScalyTo
 Issue: 	IE display bug then hidding scrollbars. Document body should have zero margins
 
 ver 1.3: (06/18/2006)
 Added: 	ModalBox will now get focus after opening
 Added: 	Keystrokes handler added (Tab key is looped on ModalBox and closing ModalBox by pressing Esc)
 Added: 	Window scrolling disabled (known issue: content jupms on top then opening ModalBox)
 Fixed: 	All dependent event handlers now unloads then closing ModalBox
 Fixed: 	SELECT element hiding function executes now only in MSIE
 Fixed: 	'Close' button has now href attribute to receive focus
 Fixed: 	Click on 'Close' button doesn't adds an href value to URL string
 
 ver 1.2: 
 Added: Global variable 'globalMB' added to the file. Use this variable to acces one instance of ModalBox and call methods on it
 
 ver 1.1: 
 Added: Added SELECT elements hiding for IE (should be rewriten later)
 
 ver 1.0: 
 Added: Core class description
 
 
Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the Andrey Okonetchnikov nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

* http://www.opensource.org/licenses/bsd-license.php
 
See scriptaculous.js for full scriptaculous licence

*/

if (!window.Modalbox)
	var Modalbox = new Object();

Modalbox.Methods = {
	focusableElements: new Array,
	
	setOptions: function(options) {
		this.options = {
			overlayClose: true, // Close modal box by clicking on overlay
			width: 400, // Default width in px
			height: 400, // Default height in px
			overlayDuration: .50, // Default overlay fade in/out duration in seconds
			slideDownDuration: .75, // Default Modalbox appear slide down effect in seconds
			slideUpDuration: .35, // Default Modalbox hiding slide up effect in seconds
			resizeDuration: .50, // Default resize duration seconds
			loadingString: "Please wait. Loading...", // Default loading string message
			closeString: "Close window", // Default title attribute for close window link
			params: {},
			method: 'get' // Default Ajax request method
		};
		Object.extend(this.options, options || {});
	},
	
	_init: function() {
		//Create the overlay
		this.MBoverlay = Builder.node("div", { id: "MB_overlay" });
		//Create the window
		this.MBwindow = Builder.node("div", {id: "MB_window", style: "display: none"}, [
			this.MBframe = Builder.node("div", {id: "MB_frame"}, [
				this.MBheader = Builder.node("div", {id: "MB_header"}, [
					this.MBcaption = Builder.node("div", {id: "MB_caption"}),
					this.MBclose = Builder.node("a", {id: "MB_close", title: this.options.closeString, href: "#"}, [
						Builder.build("<span>&times;</span>"),
					]),
				]),
				this.MBcontent = Builder.node("div", {id: "MB_content"}, [
					this.MBloading = Builder.node("div", {id: "MB_loading"}, this.options.loadingString),
				]),
			]),
		]);
		// Inserting into DOM
		document.body.insertBefore(this.MBwindow, document.body.childNodes[0]);
		document.body.insertBefore(this.MBoverlay, document.body.childNodes[0]);
		//Adding event observers
		this.hide = this.hide.bindAsEventListener(this);
		this.close = this._hide.bindAsEventListener(this);
		
		// Initial scrolling position of the window. To be used for remove scrolling effect during ModalBox appearing
		this.initScrollX = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
		this.initScrollY = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;
		
		Event.observe(this.MBclose, "click", this.close); // Close link overver
		if(this.options.overlayClose) Event.observe(this.MBoverlay, "click", this.hide); // Overlay close obersver

		this.isInitialized = true; // Mark as initialized
	},
	
	show: function(title, url, options) {
		this.title = title;
		this.url = url;
		this.setOptions(options);
		if(!this.isInitialized) this._init(); // Check for is already initialized
		Element.update(this.MBcaption, title); // Updating title of the MB
		
		if(this.MBwindow.style.display == "none") { // First modal box appearing
			this._appear();
			this.event("onShow"); // Passing onShow callback
		}
		else { // If MB already on the screen, update it
			this._update();
			this.event("onUpdate"); // Passing onShow callback
		} 
	},
	
	hide: function(options) { // External hide method to use from external HTML and JS
		if(options) Object.extend(this.options, options); // Passing callbacks
		Effect.SlideUp(this.MBwindow, { duration: this.options.slideUpDuration, afterFinish: this._deinit.bind(this) } );
	},
	
	_hide: function(event) { // Internal hide method to use inside MB class
		if(event) Event.stop(event);
		this.hide();
	},
	
	_appear: function() { // First appearing of MB
		this._toggleSelects();
		this._setOverlay();
		this._setWidth();
		this._setPosition();
		new Effect.Fade(this.MBoverlay, {
				from: 0, 
				to: 0.75, 
				duration: this.options.overlayDuration, 
				afterFinish: function() {
					new Effect.SlideDown(this.MBwindow, {
						duration: this.options.slideDownDuration, 
						afterFinish: function(){ 
							this._setPosition(); 
							this.loadContent();
						}.bind(this)
					});
				}.bind(this)
		});
		
		this._setWidthAndPosition = this._setWidthAndPosition.bindAsEventListener(this);
		Event.observe(window, "resize", this._setWidthAndPosition);
		
		this.kbdHandler = this.kbdHandler.bindAsEventListener(this);
		Event.observe(document, "keypress", this.kbdHandler);
	},
	
	resize: function(byWidth, byHeight, options) { // Change size of MB without loading content
		if(options) Object.extend(this.options, options); // Passing callbacks
		this.currentDims = [this.MBwindow.offsetWidth, this.MBwindow.offsetHeight];
		new Effect.ScaleBy(this.MBwindow, 
			(byWidth), //New width calculation
			(byHeight), //New height calculation
			{ duration: this.options.resizeDuration, 
			  afterFinish: function() { this.event("afterResize") }.bind(this) // Passing callback
			});
	},
	
	_update: function() { // Updating MB in case of wizards
		this.currentDims = [this.MBwindow.offsetWidth, this.MBwindow.offsetHeight];
		if((this.options.width + 10 != this.currentDims[0]) || (this.options.height + 5 != this.currentDims[1]))
			new Effect.ScaleBy(this.MBwindow, 
				(this.options.width + 10 - this.currentDims[0]), //New width calculation
				(this.options.height + 5 - this.currentDims[1]), //New height calculation
			{
				duration: this.options.resizeDuration, 
				afterFinish: this._loadAfterResize.bind(this), 
				beforeStart: function(effect) { 
					Element.update(this.MBcontent, "");
					this.MBcontent.appendChild(this.MBloading);
					Element.update(this.MBloading, this.options.loadingString);
				}.bind(this) 
			});
		else {
			Element.update(this.MBcontent, "");
			this.MBcontent.appendChild(this.MBloading);
			Element.update(this.MBloading, this.options.loadingString);
			this._loadAfterResize();
		}
	},
	
	loadContent: function () { // Load content into MB through AJAX
		if(this.event("beforeLoad") != false) // If callback passed false, skip loading of the content
			new Ajax.Request( this.url, { method: this.options.method.toLowerCase(), parameters: this.options.params, 
				onComplete: function(transport) {
					var response = new String(transport.responseText);
					this.MBcontent.innerHTML = response;
					this.focusableElements = this._findFocusableElements();
					this._moveFocus(); // Setting focus on first 'focusable' element in content (input, select, textarea, link or button)
					this.event("afterLoad"); // Passing callback
					response.extractScripts().map(function(script) { 
						return eval(script.replace("<!--", "").replace("// -->", ""));
					}).bind(window);
				}.bind(this)
			});
	},
	
	_loadAfterResize: function() {
		this._setWidth();
		this._setPosition();
		this.loadContent();
	},
	
	_moveFocus: function() { // Setting focus to be looped inside current MB
		if(this.focusableElements.length > 0)
			this.focusableElements.first().focus(); // Focus on first focusable element except close button
		else
			$("MB_close").focus(); // If no focusable elements exist focus on close button
	},
	
	_findFocusableElements: function(){ // Collect form elements or links from MB content
		return $A($("MB_content").descendants()).findAll(function(node){
			return (["INPUT", "TEXTAREA", "SELECT", "A", "BUTTON"].include(node.tagName));
		});
	},
	
	kbdHandler: function(e) {
		var node = Event.element(e);
		switch(e.keyCode) {
			case Event.KEY_TAB:
				if(Event.element(e) == this.focusableElements.last()) {
					Event.stop(e);
					this._moveFocus();  // Find last element in MB to handle event on it. If no elements found, uses close ModalBox button
				}
			break;			
			case Event.KEY_ESC:
				this._hide(e);
			break;
			case 32:
				this._preventScroll(e);
			break;
			case 0: // For Gecko browsers compatibility
				if(e.which == 32) this._preventScroll(e);
			break;
			case Event.KEY_UP:
			case Event.KEY_DOWN:
			case Event.KEY_PAGEDOWN:
			case Event.KEY_PAGEUP:
			case Event.KEY_HOME:
			case Event.KEY_END:
				if(!["TEXTAREA", "SELECT"].include(node.tagName) || 
				(node.tagName == "INPUT" && (node.type == "submit" || node.type == "button")) ) Event.stop(e);
			break;
		}
	},
	
	_preventScroll: function(event) { // Disabling scrolling by "space" key
		if(!["INPUT", "TEXTAREA", "SELECT", "BUTTON"].include(Event.element(event).tagName)) Event.stop(event);
	},
	
	_deinit: function()
	{	
		this._toggleSelects(); // Toggle back 'select' element in IE
		Event.stopObserving(this.MBclose, "click", this.close );
		if(this.options.overlayClose)
			Event.stopObserving(this.MBoverlay, "click", this.hide );
		Event.stopObserving(window, "resize", this._setWidthAndPosition );
		Event.stopObserving(document, "keypress", this.kbdHandler );
		Effect.toggle(this.MBoverlay, 'appear', {duration: this.options.overlayDuration, afterFinish: this._removeElements.bind(this) });
	},
	
	_removeElements: function () {
		if (navigator.appVersion.match(/\bMSIE\b/)) {
			this._prepareIE("", ""); // If set to auto MSIE will show horizontal scrolling
			window.scrollTo(this.initScrollX, this.initScrollY);
		}
		Element.remove(this.MBoverlay);
		Element.remove(this.MBwindow);
		this.isInitialized = false;
		this.event("afterHide"); // Passing afterHide callback
	},
	
	_setOverlay: function () {
		if (navigator.appVersion.match(/\bMSIE\b/)) {
			this._prepareIE("100%", "hidden");
			if (!navigator.appVersion.match(/\b7.0\b/)) window.scrollTo(0,0); // Disable scrolling on top for IE7
		}
	},
	
	_setWidth: function () { //Set size
		this.MBwindow.style.width = this.options.width + "px";
		this.MBwindow.style.height = this.options.height + "px";
	},
	
	_setPosition: function () {
		this.MBwindow.style.left = Math.round((Element.getWidth(document.body) - Element.getWidth(this.MBwindow)) / 2 ) + "px";
	},
	
	_setWidthAndPosition: function () {
		this._setWidth();
		this._setPosition();
	},
	
	_getScrollTop: function () { //From: http://www.quirksmode.org/js/doctypes.html
		var theTop;
		if (document.documentElement && document.documentElement.scrollTop)
			theTop = document.documentElement.scrollTop;
		else if (document.body)
			theTop = document.body.scrollTop;
		return theTop;
	},
	// For IE browsers -- IE requires height to 100% and overflow hidden (taken from lightbox)
	_prepareIE: function(height, overflow){
		bod = document.getElementsByTagName('body')[0];
		bod.style.height = height;
		bod.style.overflow = overflow;
  
		htm = document.getElementsByTagName('html')[0];
		htm.style.height = height;
		htm.style.overflow = overflow; 
	},
	// For IE browsers -- hiding all SELECT elements
	_toggleSelects: function() {
		if (navigator.appVersion.match(/\bMSIE\b/))
			$$("select").each( function(select) { 
				select.style.visibility = (select.style.visibility == "") ? "hidden" : "";
			});
	},
	event: function(eventName) {
		if(this.options[eventName]) {
			var returnValue = this.options[eventName](); // Executing callback
			this.options[eventName] = null; // Removing callback after execution
			if(returnValue != undefined) 
				return returnValue;
			else 
				return true;
		}
		return true;
	}
}

Object.extend(Modalbox, Modalbox.Methods);

Effect.ScaleBy = Class.create();
Object.extend(Object.extend(Effect.ScaleBy.prototype, Effect.Base.prototype), {
  initialize: function(element, byWidth, byHeight, options) {
    this.element = $(element)
    var options = Object.extend({
	  scaleFromTop: true,
      scaleMode: 'box',        // 'box' or 'contents' or {} with provided values
      scaleByWidth: byWidth,
	  scaleByHeight: byHeight
    }, arguments[3] || {});
    this.start(options);
  },
  setup: function() {
    this.elementPositioning = this.element.getStyle('position');
      
    this.originalTop  = this.element.offsetTop;
    this.originalLeft = this.element.offsetLeft;
	
    this.dims = null;
    if(this.options.scaleMode=='box')
      this.dims = [this.element.offsetHeight, this.element.offsetWidth];
	 if(/^content/.test(this.options.scaleMode))
      this.dims = [this.element.scrollHeight, this.element.scrollWidth];
    if(!this.dims)
      this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
	  
	this.deltaY = this.options.scaleByHeight;
	this.deltaX = this.options.scaleByWidth;
  },
  update: function(position) {
    var currentHeight = this.dims[0] + (this.deltaY * position);
	var currentWidth = this.dims[1] + (this.deltaX * position);
	
    this.setDimensions(currentHeight, currentWidth);
  },

  setDimensions: function(height, width) {
    var d = {};
    d.width = width + 'px';
    d.height = height + 'px';
    
	var topd  = Math.round((height - this.dims[0])/2);
	var leftd = Math.round((width  - this.dims[1])/2);
	if(this.elementPositioning == 'absolute' || this.elementPositioning == 'fixed') {
		if(!this.options.scaleFromTop) d.top = this.originalTop-topd + 'px';
		d.left = this.originalLeft-leftd + 'px';
	} else {
		if(!this.options.scaleFromTop) d.top = -topd + 'px';
		d.left = -leftd + 'px';
	}
    this.element.setStyle(d);
  }
});
