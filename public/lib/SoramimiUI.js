var SoramimiUI = function() {
  
  var that = {};
  
  that.util = HisaishiUtil;
  
  that.timecode = function(wrapper, index) {
    var containerClass = '.timecodeContainer';
    var minuteClass = '.timecodeMinutes';
    var secondClass = '.timecodeSeconds';
    var hundthClass = '.timecodeHundredths';
    
    var container = $('<div />', {
      'class': containerClass
    });
    
    var makeField = function(className) {
      var field = $('<input />', {
        size: 2,
        maxLength: 2,
        'class': className
      });
      
      field.change(function(){
        var val = $(this).val();
        var re = /[0-9]{2}/;
        
        if (!val.match(re)) {
          var intVal = parseInt(val, 10);
          val = that.util.prePad(intVal, 2, '0');
        }
        
        $(this).val(val);
      });
      
      $(container).append(field);
    };
    
    makeField(minuteClass);
    makeField(secondClass);
    makeField(hundthClass);
    
    var returnMS = function() {
      return (
        $(hundthClass, container).val() * 10 + 
        $(secondClass, container).val() * 1000 + 
        $(minuteClass, container).val() * 6000
      );
    };
    
    var returnTimestamp = function() {
      return [
        $(minuteClass, container).val(),
        $(secondClass, container).val(),
        $(hundthClass, container).val()
      ].join(':');
    };
    
    wrapper.append(container);
  };
  
  that.wordsplitter = function(wrapper) {
    var wrapper = wrapper;
    
    var inputBoxClass = '.wordsplitterInput';
    var inputButtonClass = '.wordsplitterButton';
    var divider = "*";
    
    var wordBreaks = [];
    var timeBreaks = [];
    
    var setMarkers = function() {
      // split words
      
      wordBreaks = $(inputBoxClass, wrapper).val().split(divider);
      timeBreaks = [];
      
      for (var i = 0; i <= wordBreaks.length; i++) {
        timeBreaks.push(that.timeCode(wrapper));
      }
    };
    
    var inputBox = $('<input />', {
      'class': inputBoxClass
    });
    
    inputBox.change(function(){
      setMarkers();
    });
    
    wrapper.append(inputBox);
  };
  
  that.lyriclist = function(wrapper) {
    var wrapper = wrapper;
    
    var listClass = '.lyriclist';
    
    var list = $('<ul />', {
      'class': listClass
    });
  };
  
  return that;
  
};