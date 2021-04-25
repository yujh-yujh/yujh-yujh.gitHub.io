/*
Ethereal Farm
Copyright (C) 2020  Lode Vandevenne

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// This text centering method is simply because it involves only one HTML
// element and allows changing the text at any time without updating this,
// but it only supports single-line text. The div must already have its final
// height and shouldn't change.
function centerText(div) {
  var divheight = div.clientHeight;
  // the next 3 properties are to center text horizontally and vertically
  div.style.textAlign = 'center';
  div.style.verticalAlign = 'middle';
  div.style.lineHeight = divheight + 'px';

  div.textEl = div; // for correspondence with centerText2
}

// centers text and supports multiline, using the css table method.
// this involves creating a child element in the div. It will set a new field
// on your dif names textEl, that is the one you must set innerText or
// innerHTML to. Other than that fact, this one is the most versatile.
function centerText2(div) {
  div.innerHTML = '';
  var table = util.makeElement('div', div);
  table.style.display = 'table';
  table.style.width = '100%';
  table.style.height = '100%';
  var cell = util.makeElement('div', table);
  cell.style.display = 'table-cell';
  cell.style.verticalAlign = 'middle';
  cell.style.textAlign = 'center';
  //cell.style.width = '100%';
  //cell.style.height = '100%';
  div.textEl = cell;
}

// This text centering method requires you to have a parent and child element,
// both already existing in that form, and with the child element already
// having content filled in. This call will then center the child.
// This supports multiline text. But it involves multiple elements and requires
// calling again if the text changes.
function centerContent(parent, child) {
  var cw = child.clientWidth;
  var ch = child.clientHeight;
  var pw = parent.clientWidth;
  var ph = parent.clientHeight;
  child.style.left = Math.floor((pw - cw) / 2) + 'px';
  child.style.top = Math.floor((ph - ch) / 2) + 'px';
}


// styles only a few of the essential properties for button
// does not do centering (can be used for other text position), or colors/borders/....
// must be called *after* any styles such as backgroundColor have already been set
function styleButton0(div) {
  div.style.cursor = 'pointer';
  div.style.userSelect = 'none'; // prevent unwanted selections when double clicking things
  if(div.textEl) div.textEl.style.userSelect = 'none'; // prevent unwanted selections when double clicking things

  if(!!div.style.backgroundColor) {
    addEvent(div, 'onmouseover', function() { div.style.filter = 'brightness(0.93)'; });
    addEvent(div, 'onmouseout', function() { div.style.filter = ''; });
  } else {
    // if it has no backgroundcolor, then get the effect instead by giving it a translucent one
    addEvent(div, 'onmouseover', function() { div.style.backgroundColor = '#0002'; });
    addEvent(div, 'onmouseout', function() { div.style.backgroundColor = ''; });
  }
}

// somewhat like makeDiv, but gives mouseover/pointer/... styles
// also sets some fields on the div: hightlight/hover colors, textEl, ...
function styleButton(div, opt_color) {
  div.color0 =  opt_color ?  '#fee' : '#bbb';
  div.color0h = opt_color ?  '#edd' : '#aaa';
  div.color1 =  opt_color ?  '#aaa' : '#aaa';
  div.color1h = opt_color ?  '#bbb' : '#bbb';
  div.color2 =  opt_color ?  '#eee' : '#eee';
  div.color2h = opt_color ?  '#ddd' : '#ddd';
  div.color = div.color0;
  div.colorh = div.color0h;
  div.style.backgroundColor = div.color;
  div.textEl = div; // for consistency with what different centerText varieties do
  centerText2(div);

  div.style.border = '1px solid black';

  styleButton0(div);
}

// highlight 0: standard look without highlighting, highlight 1: highlighted, highlight 2: un-highlighted
function highlightButton(div, highlight) {
  if(highlight == 0) {
    div.color = div.color0;
    div.colorh = div.color0h;
  } else if(highlight == 1) {
    div.color = div.color1;
    div.colorh = div.color1h;
  } else if(highlight == 2) {
    div.color = div.color2;
    div.colorh = div.color2h;
  }
  if(div.style_ == 2) {
    div.style.color = div.color;
  } else {
    div.style.backgroundColor = div.color;
  }
}

// div must already have the position and size (the arguments are used to compute stuff inside of it)
function initProgressBar(div) {
  div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
  div.style.border = '1px solid black';
  var c = makeDiv('0%', '0%', '100%', '100%', div);
  c.style.backgroundColor = 'red';
  div.style.display = 'none';
  div.style.backgroundColor = '#ddd';
  div.visible = false;
  div.c = c;
}

// value is in range 0-1. Make negative to hide the progress bar.
function setProgressBar(div, value) {
  if(value < 0) {
    if(div.visible) {
      div.style.display = 'none';
      div.visible = false;
    }
    return;
  }
  if(value > 1) value = 1;
  var c = div.c;
  if(!div.visible) {
    div.style.display = '';
    div.visible = true;
  }
  c.style.width = (100 * value) + '%';
}

function setProgressBarColor(div, color) {
  div.c.style.backgroundColor = color;
}


// if you wish text of a dialog to be updated dynamically, set this function to something
// there's only this one available, and it will get cleared whenever dialogs are cleared
// will be called by update()
// NOTE: it is a good idea to create your updatedialogfun such that it does nothing if nothing
// changes, and does something if the content does change, to avoid unnecessary DOM updates for
// same content.
var updatedialogfun = undefined;

var dialog_level = 0;
var created_dialogs = [];
var created_overlays = [];

// create a dialog for the settings menu
// opt_okfun must call dialog.cancelFun when the dialog is to be closed
// opt_extrafun and opt_extraname allow a third button in addition to cancel and ok. The order will be: cancel, extra, ok.
function createDialog(opt_small, opt_okfun, opt_okname, opt_cancelname, opt_extrafun, opt_extraname) {
  dialog_level++;

  var dialogFlex;
  if(opt_small) {
    dialogFlex = new Flex(mainFlex, 0.1, 0.25, 0.9, 0.75);
  } else {
    dialogFlex = new Flex(mainFlex, 0.05, 0.05, 0.95, 0.95);
  }
  created_dialogs.push(dialogFlex);
  var dialog = dialogFlex.div;

  dialog.style.backgroundColor = '#ddd';
  dialog.style.border = '1px solid black';
  dialog.style.zIndex = '' + (dialog_level * 10 + 5);

  var button;
  var buttonshift = 0;
  if(opt_okfun) {
    button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
    button.style.fontWeight = 'bold';
    buttonshift++;
    styleButton(button);
    button.textEl.innerText = opt_okname || 'ok';
    button.onclick = function(e) {
      opt_okfun(e);
    };
  }
  if(opt_extrafun) {
    button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
    button.style.fontWeight = 'bold';
    buttonshift++;
    styleButton(button);
    button.textEl.innerText = opt_extraname || 'extra';
    button.onclick = function(e) {
      opt_extrafun(e);
    };
  }
  dialog.cancelFun = function() {
    updatedialogfun = undefined;
    dialogFlex.removeSelf();
    util.removeElement(overlay);
    for(var i = 0; i < created_dialogs.length; i++) {
      if(created_dialogs[i] == dialogFlex) {
        created_dialogs.splice(i, 1);
        break;
      }
    }
    for(var i = 0; i < created_overlays.length; i++) {
      if(created_overlays[i] == overlay) {
        created_overlays.splice(i, 1);
        break;
      }
    }
    dialog_level--;
    // a tooltip created by an element from a dialog could remain, make sure those are removed too
    removeAllTooltips();
  };
  dialogFlex.cancelFun = dialog.cancelFun;
  button = (new Flex(dialogFlex, [1.0, -0.3 * (buttonshift + 1)], [1.0, -0.12], [1.0, -0.01 - 0.3 * buttonshift], [1.0, -0.01], 1)).div;
  buttonshift++;
  styleButton(button);
  button.textEl.innerText = opt_cancelname || (opt_okfun ? 'cancel' : 'back');
  button.onclick = dialog.cancelFun;
  var overlay = makeDiv(0, 0, window.innerWidth, window.innerHeight);
  created_overlays.push(overlay);
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.66)';
  overlay.style.position = 'fixed';
  overlay.style.zIndex = '' + (dialog_level * 10);
  overlay.onclick = dialog.cancelFun;
  return dialogFlex;
}

function closeAllDialogs() {
  updatedialogfun = undefined;

  for(var i = 0; i < created_dialogs.length; i++) {
    created_dialogs[i].removeSelf();
  }
  for(var i = 0; i < created_overlays.length; i++) {
    util.removeElement(created_overlays[i]);
  }
  created_dialogs = [];
  created_overlays = [];
  dialog_level = 0;

  // a tooltip created by an element from a dialog could remain, make sure those are removed too
  removeAllTooltips();
}

document.addEventListener('keyup', function(e) {
  if(e.keyCode == 27) {
    closeAllDialogs();
  }
});

// It matters whether there is a mouse pointer that can hover over things to
// show tooltips, or it's a touch device where you only get taps on a location
// without seeing a mouse pointer move there first.
// Note: it's not possible to use something like check whether or not onmouseover
// was called, because mobile browsers call onmouseover anyway
function isTouchDevice() {
  return ('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
}

var globaltooltip;

// MOBILEMODE forces the mobile mode for tooltips by disabling tooltip hover (mouseover and mouseout) functions
var MOBILEMODE = false;

var updatetooltipfun = undefined; // must be called by the game update fun if set
var tipx0 = 0;
var tipy0 = 0;
var tipx1 = 0;
var tipy1 = 0;

/*
tooltip for the desktop version. For mobile, may be able to show it through an indirect info button
el is HTML element to give tooltip
fun is function that gets the tooltip text, or text directly, or undefined to remove the tooltip (to unregister it)
opt_poll, if true, will make the tooltip dynamically update by calling fun again
opt_allowmobile, if true, then the tooltip will show when clicking the item. It will likely be too tiny though. Do not use if clicking the item already has some other action.
*/
function registerTooltip(el, fun, opt_poll, opt_allowmobile) {
  if((typeof fun == 'string') || !fun) fun = bind(function(text) { return text; }, fun);
  var div = undefined;

  var MOBILEMODE = isTouchDevice();

  var init = function() {
    el.tooltipfun = fun;
    if(el.tooltipregistered) return; // prevent keeping adding event listeners, and make sure re-calling registerTooltip is fast (can be done every frame), just update the minimum needed to change the text
    el.tooltipregistered = true;
    addEvent(el, 'onmouseover', function(e) {
      if(MOBILEMODE && !opt_allowmobile) return;
      maketip(el.tooltipfun(), e, false);
    });

    // NOTE: mouseout unwantedly also triggers when over child elements of el (solved inside) or when over the tooltip itself (solved by making tooltip never overlap el)
    addEvent(el, 'onmouseout', function(e) {
      if(MOBILEMODE && !opt_allowmobile) return;
      // avoid the tooltip triggering many times while hovering over child nodes, which does cause mouseout events
      var e_el = e.toElement || e.relatedTarget;
      if(e_el == el) return;
      if(!!e_el && e_el.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && e_el.parentNode.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && !!e_el.parentNode.parentNode && e_el.parentNode.parentNode.parentNode == el) return;
      if(!!e_el && !!e_el.parentNode && !!e_el.parentNode.parentNode && !!e_el.parentNode.parentNode.parentNode && e_el.parentNode.parentNode.parentNode.parentNode == el) return;
      if(e_el == div) return;
      remtip();
    });
  };

  var maketip = function(text, e, mobilemode) {
    // already displaying
    if(div && div == globaltooltip) return;
    // if a tooltip somehow remained from elsewhere, remove it. Even if fun returned undefined (so we make no new tip), because any remaining one may be stray
    if(globaltooltip) {
      util.removeElement(globaltooltip);
      globaltooltip = undefined;
      updatetooltipfun = undefined;
    }
    if(text) {

      var rect = el.getBoundingClientRect();
      tipx0 = rect.x;
      tipy0 = rect.y;
      tipx1 = rect.x + rect.width;
      tipy1 = rect.y + rect.height;

      var x = e.clientX + 20;
      // TODO: adjust y position such that tooltip does not appear over the element itself, only below or above (do not cover it)
      var y = Math.max(e.clientY + 20, tipy1);
      // NOTE: the div has document.body as parent, not el, otherwise it gets affected by styles of el (such as darkening on mouseover, ...)
      ///div = util.makeElementAt('div', x, y, document.body); // give some shift. Note that if tooltip appears under mousebutton, it will trigger mouseout and cause flicker... so TODO: make sure it never goes under mouse cursor
      div =  document.createElement('div');
      div.style.position = 'fixed'; // make the x,y coordinats relative to whole window so that the coordinates match the mouse position
      globaltooltip = div;
      // no width or hight set on the div: make it automatically match the size of the text. But the maxWidth ensures it won't get too wide in case of long text without newlines.
      ///div.style.maxWidth = mainFlex.div.clientWidth + 'px';
      div.style.backgroundColor = '#840';
      div.style.color = '#fff';
      div.style.border = '2px solid #fff';
      div.style.padding = '4px';
      div.style.zIndex = '999';
      div.style.lineHeight = 'normal';
      div.style.textAlign = 'left';
      div.style.verticalAlign = 'top';
      div.style.fontSize = '150%';
      var textel = util.makeElementAt('span', 0, 0, div);
      textel.style.position = ''; // not absolute, so that the parent div will grow its size to fit this one.
      textel.innerHTML = text;

      document.body.appendChild(div);
      var tw = div.clientWidth;
      var maxw = Math.floor(mainFlex.div.clientWidth * 0.5);
      var maxr = mainFlex.div.clientWidth;
      if(tw > maxw) tw = maxw;
      if(x + maxw > maxr) x = maxr - maxw;
      div.style.left = x + 'px';
      div.style.top = y + 'px';
      div.style.width = tw + 'px';

      div.onmouseover = function() {
        // if one manages to mouse over the tip itself, remove it as it likely means it's in the way (plus it's not supposed to be possible in theory)
        remtip();
      };

      if(opt_poll) {
        updatetooltipfun = function() {
          var text2 = el.tooltipfun();
          if(text2 && text2 != text) {
            text = text2;
            textel.innerHTML = text;
          }
        };
      }
    }
  };

  var remtip = function() {
    updatetooltipfun = undefined;
    if(globaltooltip) {
      util.removeElement(globaltooltip);
    }
    if(div && div != globaltooltip) {
      // normally always the same, but if somehow there would be a separate tip, delete that one too
      util.removeElement(div);
    }
    div = undefined;
    globaltooltip = undefined;
  };


  init();
}

// removes any stray remaining tooltip (it can't be plural in theory)
function removeAllTooltips() {
  if(globaltooltip) {
    util.removeElement(globaltooltip);
  }
  updatetooltipfun = undefined;
  globaltooltip = undefined;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/*
Does something very similar as what setting all element sizes to '%' units
does, but also makes the font sizes relative, something that is in theory
also possible with 'vw' and 'vh', but those are always relative to viewport
rather than parent, so we need to do it all in JS after all.
NOTE: not all children must be flexes, e.g. if you have a simple regular grid inside of
a Flex unit, you can use relative sizes with HTML's % unit in that one. Even if it has text,
setting a Flexible fontsize on the parent Flex is sufficient.

set parent to null or undefined to create root flex (will then use document.body as parent div)

coordinates are all in range 0..1, representing relative size factor of parent
the x/y coordinates may also be an array of 1, 2 or 3 items, then:
-the first is relative size compared to corresponding size (w or h)
-the second is relative size compared to minimum dimension (w or h)
-the third is a factor used for the opposing dimension in the min formula above
e.g. the formula for "left" is (with w and h the width and height of parent): x0[0] * w + x0[1] * min(w, x0[2] * h)
example: to have an element take full width if smaller than twice the height, stay at twice height otherwise, use x1 = [0, 1, 0.5]
example: to have something always be square inside of rectangular parent (which can dynamically be either horizontally or vertically longer), and always centered in there, use: [0.5,-0.5], [0.5,-0.5], [0.5,0.5], [0.5,0.5]
example: same as previous example but not square but rectangle that must keep constant ratio w/h = r: [0.5,-0.5,r], [0.5,-0.5,1/r], [0.5,0.5,r], [0.5,0.5,1/r]
example: button in bottom right corner with always a width/height ratio (of butotn itself) of 2/1 (here 0.3/0.15): [1.0, -0.3], [1.0, -0.15], [1.0, -0.01], [1.0, -0.01]
The fontSize lets the Flex also manage font size. This value does not support the 3-element array, just single number, and will be based on min(w*10, h) of the current element's computed size.
*/
function Flex(parent, x0, y0, x1, y1, opt_fontSize) {
  this.parent = parent || null;
  this.fontSize = opt_fontSize;
  if(x0.length) {
    this.x0 = x0[0];
    this.x0b = x0[1] || 0;
    this.x0f = x0[2] || 1;
  } else {
    this.x0 = x0;
    this.x0b = 0;
    this.x0f = 1;
  }
  if(y0.length) {
    this.y0 = y0[0];
    this.y0b = y0[1] || 0;
    this.y0f = y0[2] || 1;
  } else {
    this.y0 = y0;
    this.y0b = 0;
    this.y0f = 1;
  }
  if(x1.length) {
    this.x1 = x1[0];
    this.x1b = x1[1] || 0;
    this.x1f = x1[2] || 1;
  } else {
    this.x1 = x1;
    this.x1b = 0;
    this.x1f = 1;
  }
  if(y1.length) {
    this.y1 = y1[0];
    this.y1b = y1[1] || 0;
    this.y1f = y1[2] || 1;
  } else {
    this.y1 = y1;
    this.y1b = 0;
    this.y1f = 1;
  }
  if(parent) {
    parent.elements.push(this);
  }

  this.parentdiv = parent ? parent.div : document.body;
  this.div = makeDiv(0, 0, 0, 0, this.parentdiv);
  this.div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
  this.elements = [];

  this.updateSelf();
}

// The clientWidth/clientHeight call in updateFlex is very slow, especially for e.g. the medal UI with many items, avoid or reduce it, cache the parent, or so...
var Flex_prevParent = undefined;
var Flex_prevParent_clientWidth = undefined;
var Flex_prevParent_clientHeight = undefined;

Flex.prototype.updateSelf = function() {
  var w, h;
  if(this.parentdiv == document.body || !this.parentdiv) {
    w = window.innerWidth;
    h = window.innerHeight;
    Flex_prevParent = undefined;
  } else {
    if(this.parentdiv == Flex_prevParent) {
      w = Flex_prevParent_clientWidth;
      h = Flex_prevParent_clientHeight;
    } else {
      w = this.parentdiv.clientWidth;
      h = this.parentdiv.clientHeight;
      Flex_prevParent = this.parentdiv;
      Flex_prevParent_clientWidth = w;
      Flex_prevParent_clientHeight = h;
    }
  }
  var x0 = w * this.x0 + Math.min(w, this.x0f * h) * this.x0b;
  var y0 = h * this.y0 + Math.min(this.y0f * w, h) * this.y0b;
  var x1 = w * this.x1 + Math.min(w, this.x1f * h) * this.x1b;
  var y1 = h * this.y1 + Math.min(this.y1f * w, h) * this.y1b;
  this.div.style.left = Math.floor(x0) + 'px';
  this.div.style.top = Math.floor(y0) + 'px';
  this.div.style.width = Math.floor(x1 - x0) + 'px';
  this.div.style.height = Math.floor(y1 - y0) + 'px';
  if(this.fontSize) {
    //this.div.style.fontSize = Math.floor(Math.min(x1 - x0, y1 - y0) * this.fontSize) + 'px';
    this.div.style.fontSize = Math.floor(Math.min((x1 - x0) / 10, y1 - y0) * this.fontSize) + 'px';
  }
}

// updates self and all chilren recursively
Flex.prototype.update = function() {
  this.updateSelf();
  for(var i = 0; i < this.elements.length; i++) {
    this.elements[i].update();
  }
}

// remove self from parent, from both Flex and DOM
Flex.prototype.removeSelf = function() {
  util.removeElement(this.div);
  if(this.parent) {
    var e = this.parent.elements;
    for(var i = 0; i < e.length; i++) {
      if(e[i] == this) {
        e.splice(i, 1);
        break;
      }
    }
  }
}

// removes all children and inner HTML of own div as well, but keeps self existing
Flex.prototype.clear = function() {
  for(var i = 0; i < this.elements.length; i++) {
    util.removeElement(this.elements[i].div);
  }
  this.elements = [];
  this.div.innerHTML = '';
}



