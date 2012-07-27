var SortableList = function(selector, params) {
	
	if (!jQuery) {
		throw {
			type: 'NoJQueryException',
			message: 'Required jQuery object not found.'
		};
	}
	
	var $ = jQuery, 
	sel = $(selector);
	
	var settings = {
		containment: null,
		opacity: 0.6,
		autoInit: false,
		onInit: function(sel) {
		},
		onUpdate: function(event, ui) {
		},
		onDestroy: function(sel) {
		},
	};
	$.extend(settings, params);
	
	var sortPrefs = {
    axis: 'y',
    containment: settings.containment,
    opacity: settings.opacity,
    update: settings.onUpdate,
    placeholder: "ui-state-highlight"
  };
  
  var currentOrder = '';
	
	var pub = {
		init: function() {
			pub.serialise();
			settings.onInit(sel);
		},
		
		destroy: function() {
  		pub.serialise();
			sel.sortable('destroy');
			settings.onDestroy(sel);
		},
		
		serialise: function() {
		  sel.sortable(sortPrefs);
		  // currentOrder = sel.sortable('serialize');
		  var list = [];
		  sel.children().map(function(){
		    var parts = this.id.split('_');
		    list.push(parts[0] + '[]=' + parts[1]);
		  });
		  
		  currentOrder = list.join('&');
		  return currentOrder;
		},
		
		getOrder: function() {
		  return currentOrder;
		}
	};
	
	if (!!settings.autoInit) {
		pub.init();
	}
	
	return pub;
	
};