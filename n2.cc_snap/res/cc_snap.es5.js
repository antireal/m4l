"use strict";

inlets = 2;
outlets = 1;
var in_cc_val = 0;
var out_cc_val = 0;
var last_out_cc_val = 0;
var cc_target = 0;
var fader_vals = [];
var mousedown = false;
var last_fader_val = 0;
var preview_latch = false;
var deadzone = 5;
var slur = 1.0;

var lerp = function lerp(a, b, t) {
  return a + (b - a) * t;
};

var get_nearest_snap_index = function get_nearest_snap_index(val) {
  var index = -1;

  if (fader_vals) {
    for (var i = 0; i < fader_vals.length; i++) {
      var f = fader_vals[i];

      if (Math.abs(f - val) < deadzone) {
        index = i;
        break;
      }
    }

    if (val < fader_vals[0]) index = 0;
    if (val > fader_vals[fader_vals.length - 1]) index = fader_vals.length - 1;
  }

  return index;
};

var snap_cc = function snap_cc(val) {
  if (fader_vals) {
    var index = get_nearest_snap_index(val);
    if (index >= 0) cc_target = fader_vals[index];
  } else {
    cc_target = val;
  }
};

var update_state = function update_state(_mousedown) {
  try {
    mousedown = !!_mousedown;

    if (preview_latch) {
      if (!mousedown) {
        // fader released, so we're done previewing
        preview_latch = false;
        snap_cc(in_cc_val);
      } else {
        // slider is being moved, preview the new value
        out_cc_val = last_fader_val;
      }
    } else {
      out_cc_val = lerp(out_cc_val, cc_target, slur);
      if (Math.abs(cc_target - out_cc_val) < 0.5) out_cc_val = cc_target;
    } // filter out redundant messages


    if (last_out_cc_val != out_cc_val) outlet(0, out_cc_val);
    last_out_cc_val = out_cc_val;
  } catch (e) {
    post(e.stack);
  }
};

var deadzone_change = function deadzone_change(_deadzone) {
  deadzone = _deadzone;
};

var slur_change = function slur_change(_slur) {
  slur = 1 - _slur / 101;
};

var cc_change = function cc_change(val) {
  in_cc_val = val;
  snap_cc(val);
}; // fader change


var list = function list() {
  if (inlet !== 1) return; // separate into an array of fader objects

  var faders = [{
    val: arguments.length <= 0 ? undefined : arguments[0],
    on: !!(arguments.length <= 1 ? undefined : arguments[1])
  }, {
    val: arguments.length <= 2 ? undefined : arguments[2],
    on: !!(arguments.length <= 3 ? undefined : arguments[3])
  }, {
    val: arguments.length <= 4 ? undefined : arguments[4],
    on: !!(arguments.length <= 5 ? undefined : arguments[5])
  }, {
    val: arguments.length <= 6 ? undefined : arguments[6],
    on: !!(arguments.length <= 7 ? undefined : arguments[7])
  }, {
    val: arguments.length <= 8 ? undefined : arguments[8],
    on: !!(arguments.length <= 9 ? undefined : arguments[9])
  }, {
    val: arguments.length <= 10 ? undefined : arguments[10],
    on: !!(arguments.length <= 11 ? undefined : arguments[11])
  }, {
    val: arguments.length <= 0 ? undefined : arguments[0],
    on: !!(arguments.length <= 13 ? undefined : arguments[13])
  }, {
    val: arguments.length <= 12 ? undefined : arguments[12],
    on: !!(arguments.length <= 15 ? undefined : arguments[15])
  }]; // filter out disabled faders
  // and sort in asc order - means we don't need to limit the fader values

  var new_vals = faders.filter(function (f) {
    return f.on;
  }).map(function (f) {
    return f.val;
  }).sort(function (a, b) {
    return a - b;
  });

  for (var i = 0; i < Math.min(fader_vals.length, new_vals.length); i++) {
    // find the fader that has been moved
    if (fader_vals[i] !== new_vals[i]) {
      last_fader_val = new_vals[i];

      if (!preview_latch) {
        preview_latch = true;
      }

      break;
    }
  }

  fader_vals = new_vals;
};