var HisaishiUtil = {
  trim: function(txt) {
    return txt.replace(/^[\s\r\n]+/, '').replace(/[\s\r\n]+$/, '');
  },
  
  prePad: function(str, len, padVal) {
    str = str + '';
    if (str.length >= len) {
      return str;
    }
    var arr = [];
    for (var i = 0; i < str.length - len; i++) {
      arr.push(padVal);
    }
    return arr.join('') + str;
  },
  
  timestampToMS: function(timestamp) {
    var timeParts = timestamp.split(':');
    var ms = (parseInt(timeParts[2], 10) * 10) + 
         (parseInt(timeParts[1], 10) * 1000) + 
         (parseInt(timeParts[0], 10) * 60000)
    return ms;
  },
  
  msToTimestamp: function(ms) {
    var base = ms / 10;
    var baseSecs = Math.floor(base / 100);
    
    var centiSecs = base % 100;
    var secs = baseSecs % 60;
    var mins = Math.floor(baseSecs / 60);
    
    return [
      mins, 
      HisaishiUtil.prePad(secs, 2, '0'), 
      HisaishiUtil.prePad(centiSecs, 2, '0')
    ].join(':');
  },
  
  renderCSS: function(dict) {
    var css   = [],
      value   = '',
      paramlist;
    for (var className in dict) {
      paramlist = [];
      for (param in dict[className]) {
        value = dict[className][param];
        paramlist.push(param + ': ' + value + ';');
      }
      css.push('.' + className + '{' + paramlist.join('') + '}');
    }
    return css.join('\n');
  }
};
