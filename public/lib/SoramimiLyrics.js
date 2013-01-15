var SoramimiLyricsContainer = function() {
  return {
    numlines:       0,        // Number of active lines
    lines:          {},       // Lines involved
    words:          {},       // Words
    timecode:       {},       // Timecode
    timecodeKeys:   [],       // Timecode keys
    groups:         {},       // Vocal groups
    hasGroups:      1         // Number of vocal groups
  };
};

var SoramimiLyrics = function(params) {
  var state = {
    formatted: '',
    container: new SoramimiLyricsContainer(),
  };
  var params = {
    offset:   0,
    preroll: {
      queue:  0,
      line:   0,
      word:   0
    },
    transition: {
      line:   200,
      word:   0
    }
  };
  var that = {};
  var internal = {};
  
  /* Getters / Setters */
  
  that.getFormatted = function() {
    return state.formatted;
  };
  
  that.setFormatted = function(formatted) {
    state.formatted = formatted;
    that.parseLyricsFormat(state.formatted, function(){});
  };
  
  that.getContainer = function() {
    return state.container;
  };
  
  that.setContainer = function(container) {
    state.container = container;
    // generate lyrics dump!
  };
  
  /* Utilities */
  
  internal.util = {
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
        internal.util.prePad(secs, 2, '0'), 
        internal.util.prePad(centiSecs, 2, '0')
      ].join(':');
    }
  };
  
  /* Parser */
  
  /**
   * PushPreroll pushes a new timecode reference to dictate 
   * that something should happen to a given object with 
   * reference ident at a given time.
   * It takes the ident, and the timecode at which to trigger.
   */
  internal.PushPreroll = function(ident, time, delta) {
    if (!delta) {
      delta = 0;
    }
    if (time < 0) {
      time = 0;
    }
    
    time -= (delta - params.offset);
    
    if (!state.container.timecode[time]) {
      state.container.timecode[time] = [];
    }
    state.container.timecode[time].push(ident);
    
    if (state.container.timecodeKeys.indexOf(time) < 0) {
      state.container.timecodeKeys.push(time);
    }
  };
  
  /**
   * Parses the Soramimi lyrics format and triggers a callback
   * when done.
   */
  that.parseLyricsFormat = function(raw) {
    var re    = /\[([0-9:]+)\]([^\[]*)/g,
      fontre  = /<FONT COLOR = "(#[0-9A-F]+)">/g;
    var lines = raw.split(/[\r\n]/g);
    var i     = 0, 
      linenum = 0, 
      partnum = 0,
      pre     = params.preroll,
      trans   = params.transition,
      line, 
      parts,
      fontparts,
      time,
      timePreroll;
    
    var that = this;
    
    /* Handle line & word splitting within first loop */
    for (var i = 0; i < lines.length; i++) {
      line = internal.util.trim(lines[i]);
      if (line.length == 0) {
        continue;
      }
      
      state.container.lines[linenum] = {
        id:      'lyricsline-' + linenum,
        words:    [],
        start:    null,
        raw:    line,
        'class':  ''
      };
      
      fontre.lastIndex = 0;
      fontparts = fontre.exec(line);
      if (!!fontparts && fontparts.length > 0) {
        var group = fontparts[1].toLowerCase().replace('#', 'colourgroup-');
        
        state.container.lines[linenum]['class'] = group;
        if (!state.container.groups[group]) {
          state.container.groups[group] = {
            color: fontparts[1]
          };
          state.container.hasGroups++;
        }
        
        line = line.replace(fontparts[0], '');
        state.container.lines[linenum].raw = line;
      }
      
      var parsed = true;
      
      re.lastIndex = 0;
      do {
        parts = re.exec(line);
        if (!parts || parts.length == 0) {
          parsed = false;
          break;
        }
        
        time = internal.util.timestampToMS(parts[1]);
        
        state.container.words[partnum] = {
          id:     'lyricspart-' + partnum,
          partnum:   partnum,
          phrase:   parts[2],
          time:    time
        };
        
        state.container.lines[linenum].words.push(partnum);
        
        if (!state.container.lines[linenum].start) {
          state.container.lines[linenum].start = time;
        }
        partnum++;
      } while (re.lastIndex < line.length);
      
      if (parsed) {
        linenum++;
        state.container.numlines++;
      }
    }
    
    /* Handle timing within second loop */
    linenum = 0, partnum = 0;
    
    for (var i in state.container.lines) {
      if (state.container.lines.hasOwnProperty(i)) {
        var words     = state.container.lines[i].words,
          lastWord    = state.container.words[words[words.length - 1]],
          linePrompt   = pre.line,
          index        = parseInt(i,10),
          startTime   = state.container.lines[i].start,
          endTime      = (typeof lastWord != "undefined") ? lastWord.time : 0;
        
        /* Add three queue points per line */
        internal.PushPreroll(state.container.lines[index].id, startTime, pre.queue);
        internal.PushPreroll(state.container.lines[index].id, startTime, linePrompt);
        internal.PushPreroll(state.container.lines[index].id, endTime);
        
        /* Add two queue points per word */
        for (var j in words) {
          if (words.hasOwnProperty(j) && j != 'length') {
            var partnum = words[j];
            if (!state.container.words[partnum]) continue;
            
            var word   = state.container.words[partnum];
            internal.PushPreroll(word.id, word.time, pre.word);
            if (partnum > 0) {
              internal.PushPreroll(state.container.words[partnum-1].id, word.time, pre.word);
            }
          }
        }
      }
    }
    
    state.container.timecodeKeys.sort(function(a, b) {
      return a - b;
    });
    
    // callback();
  };
  
  $.extend(true, that, {params: params});
  
  that.init = function() {
  };
  
  that.init();
  
  return that;
};