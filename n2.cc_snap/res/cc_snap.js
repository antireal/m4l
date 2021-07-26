const max = require("max-api");

let in_cc_val = 0;

let out_cc_val = 0;
let last_out_cc_val = 0;
let cc_target = 0;
let fader_vals = [];
let mousedown = false;

let last_fader_val = 0;
let preview_latch = false;

let deadzone = 5;
let slur = 1.0;

const lerp = (a, b, t) => a + (b - a) * t;

const get_nearest_snap_index = val => {
  let index = -1;
  if (fader_vals) {
    for (let i = 0; i < fader_vals.length; i++) {
      const f = fader_vals[i];

      if (Math.abs(f - val) < deadzone) {
        index = i;
        break;
      }
    }

    max.post(fader_vals[0]);

    if (val < fader_vals[0]) index = 0;
    if (val > fader_vals[fader_vals.length - 1]) index = fader_vals.length - 1;
  }

  return index;
};

const snap_cc = val => {
  if (fader_vals) {
    const index = get_nearest_snap_index(val);
    if (index >= 0) cc_target = fader_vals[index];
  } else {
    cc_target = val;
  }
};

max.addHandlers({
  update_state: _mousedown => {
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
      }

      // filter out redundant messages
      if (last_out_cc_val != out_cc_val) max.outlet(out_cc_val);
      last_out_cc_val = out_cc_val;
    } catch (e) {
      max.post(e.stack);
    }
  },
  deadzone_change: _deadzone => {
    deadzone = _deadzone;
  },
  slur_change: _slur => {
    slur = 1 - _slur / 101;
  },
  cc_change: val => {
    in_cc_val = val;
    snap_cc(val);
  },
  fader_change: (...inputs) => {
    // separate into an array of fader objects
    const faders = [
      { val: inputs[0], on: !!inputs[1] },
      { val: inputs[2], on: !!inputs[3] },
      { val: inputs[4], on: !!inputs[5] },
      { val: inputs[6], on: !!inputs[7] },
      { val: inputs[8], on: !!inputs[9] },
      { val: inputs[10], on: !!inputs[11] },
      { val: inputs[0], on: !!inputs[13] },
      { val: inputs[12], on: !!inputs[15] },
    ];
    // filter out disabled faders
    // and sort in asc order - means we don't need to limit the fader values
    const new_vals = faders
      .filter(f => f.on)
      .map(f => f.val)
      .sort((a, b) => a - b);

    for (let i = 0; i < Math.min(fader_vals.length, new_vals.length); i++) {
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
  },
});
