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


var field2Divs;
var field2Rows;



// get crop info in HTML
function getCropInfoHTML2(f, c, opt_detailed) {
  var result = 'Ethereal ' + upper(c.name);
  result += '<br/>Crop type: ' + getCropTypeName(c.type);
  result += '<br/>';

  if(c.istemplate) {
    result += '<br/><br/>This template represents all crops of type ' + getCropTypeName(c.type);
    result += '<br/><br/>It is a placeholder for planning the field layout and does nothing.';
    result += '<br><br>Templates are a feature provided by the automaton.';
    result += '<br><br>Tip: ctrl+shift+click, or press "u", on a template to turn it into a crop of highest available tier of this type';

    return result;
  }

  if(f.growth < 1) {
    result += 'Growing. Time to grow left: ' + util.formatDuration((1 - f.growth) * c.getPlantTime(), true, 4, true);
    result += '<br/><br/>';
  }

  if(c.effect_description_long) {
    result += 'Effect: ' + c.effect_description_long + '<br/>';
  } else if(c.effect_description_short) {
    result += 'Effect: ' + c.effect_description_short + '<br/>';
  }



  if(c.type == CROPTYPE_BERRY || c.type == CROPTYPE_MUSH || c.type == CROPTYPE_FLOWER || c.type == CROPTYPE_NETTLE) {
    var breakdown = [];
    var total = c.getBasicBoost(f, breakdown);
    result += formatBreakdown(breakdown, true, 'Breakdown (boost to basic field)');
  }

  var automaton = c.type == CROPTYPE_AUTOMATON;

  if(f.growth >= 1) {
    if(c.boost.neqr(0)) {
      result += '<br/>Boosting neighbors: ' + (c.getEtherealBoost(f).toPercentString()) + '<br/>';
    }
    if(automaton) {
      result += '<br/>Boosting non-lotus neighbors orthogonally and diagonally: ' + (automatonboost.toPercentString()) + '<br/>';
    }
  }

  if(opt_detailed) {
    result += '<br/>';
    result += 'Num planted of this type: ' + state.crop2count[c.index];
    result += '<br/>';
  }


  if(automaton) {
    result += '<br/>• Cost: ' + c.cost.toString();
    result += '<br/>• Recoup on delete (' + (cropRecoup2 * 100) + '%): ' + c.getCost(-1).mulr(cropRecoup2).toString();
  } else {
    result += '<br/>Cost: ';
    if(opt_detailed) result += '<br/>• Base planting cost: ' + c.cost.toString();
    result += '<br/>• Next planting cost: ' + c.getCost().toString();
    result += '<br/>• Last planting cost: ' + c.getCost(-1).toString();
    result += '<br/>• Recoup on delete (' + (cropRecoup2 * 100) + '%): ' + c.getCost(-1).mulr(cropRecoup2).toString();
  }

  result += '<br><br>Ethereal tree level that unlocked this crop: ' + c.treelevel2;

  if(opt_detailed) {
    result += '<br><br>';
    result += 'Deleting ethereal crops refunds all resin, but can only be done after at least one more transcend and requires ethereal deletion tokens. You get ' + getDelete2PerSeason() + ' new such tokens per season (a season lasts 1 real-life day)';
    result += '<br><br>';
    result += 'Deletion tokens available: ' + state.delete2tokens + ' (max: ' + getDelete2maxBuildup() + ')';
    result += '<br><br>';
  }

  return result;
}

function getUpgradeCrop2(x, y, opt_too_expensive) {
  if(!state.field2[y]) return null;
  var f = state.field2[y][x];
  if(!f) return;
  var c = f.getCrop();
  if(!c) return;

  if(c.type == CROPTYPE_CHALLENGE) return null;
  var tier = state.highestoftype2unlocked[c.type];

  var c2 = null;

  for(;;) {
    if(tier <= c.tier) break; // not an upgrade
    if(tier < 0) break;

    var c3 = croptype2_tiers[c.type][tier];
    if(!c3 || !state.crops2[c3.index].unlocked) break; // normally cannot happen that a lower tier crop is not unlocked

    if(c3.getCost().le(state.res)) {
      // found a successful upgrade
      c2 = c3;
      break;
    }

    if(opt_too_expensive != undefined) opt_too_expensive[0] = c3.getCost();
    tier--;
  }

  return c2;
}

function makeUpgradeCrop2Action(x, y, opt_silent) {
  var too_expensive = [undefined];
  var c2 = getUpgradeCrop2(x, y, too_expensive);

  if(c2) {
    actions.push({type:ACTION_REPLACE2, x:x, y:y, crop:c2, shiftPlanted:true});
    return true;
  } else {
    if(!opt_silent) {
      if(too_expensive[0]) {
        showMessage('not enough resources for crop upgrade: have ' + Res.getMatchingResourcesOnly(too_expensive[0], state.res).toString() +
            ', need ' + too_expensive[0].toString(), C_INVALID, 0, 0);
      } else {
        showMessage('Crop not upgraded, no higher tier unlocked or available', C_INVALID);
      }
    }
  }
  return false;
}

function makeField2Dialog(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];

  if(f.hasCrop()) {
    var c = crops2[f.cropIndex()];
    var div;

    var dialog = createDialog();
    dialog.div.className = 'efDialogTranslucent';
    var flex = new Flex(dialog.content, [0, 0.01], [0, 0.01], [0, 0.2], [0, 0.2], 0.3);
    var canvas = createCanvas('0%', '0%', '100%', '100%', flex.div);
    renderImage(c.image[4], canvas);

    var buttonshift = 0;

    var flex0 = new Flex(dialog.content, [0.01, 0.2], [0, 0.01], 1, 0.17, 0.29);
    var button0 = new Flex(dialog.content, [0.01, 0.2], [0.7 + buttonshift, 0.01], 0.5, 0.76 + buttonshift, 0.8).div;
    var button1 = new Flex(dialog.content, [0.01, 0.2], [0.77 + buttonshift, 0.01], 0.5, 0.83 + buttonshift, 0.8).div;
    var button2 = new Flex(dialog.content, [0.01, 0.2], [0.84 + buttonshift, 0.01], 0.5, 0.90 + buttonshift, 0.8).div;
    var button3 = new Flex(dialog.content, [0.01, 0.2], [0.91 + buttonshift, 0.01], 0.5, 0.97 + buttonshift, 0.8).div;
    var last0 = undefined;

    styleButton(button0);
    button0.textEl.innerText = 'Upgrade crop';
    registerTooltip(button0, 'Upgrade crop to the highest tier of this type you can afford, or turn template into real crop. This deletes the original crop, (with cost recoup if applicable), and then plants the new higher tier crop.');
    addButtonAction(button0, function() {
      if(makeUpgradeCrop2Action(x, y)) {
        update();
      }
      dialog.cancelFun();
    });

    styleButton(button1);
    button1.textEl.innerText = 'Replace crop';
    registerTooltip(button1, 'Replace the crop with a new one, same as delete then plant. Requires deletion token as usual. Shows the list of unlocked ethereal crops.');
    addButtonAction(button1, function() {
      makePlantDialog2(x, y, true, c.getRecoup());
    });

    styleButton(button2);
    button2.textEl.innerText = 'Delete crop';
    button2.textEl.style.color = '#c00';
    if(f.justplanted && (c.planttime <= 2 || f.growth >= 1)) button2.textEl.style.color = '#888';
    if(!state.delete2tokens) button2.textEl.style.color = '#888';
    registerTooltip(button2, 'Delete crop, get ' + (cropRecoup2 * 100) + '% of the original resin cost back, but pay one ethereal deletion token.');
    addButtonAction(button2, function() {
      actions.push({type:ACTION_DELETE2, x:x, y:y});
      dialog.cancelFun();
      update(); // do update immediately rather than wait for tick, for faster feeling response time
    });

    styleButton(button3);
    button3.textEl.innerText = 'Delete all (4 tokens)';
    button3.textEl.style.color = '#c00';
    if(f.justplanted && (c.planttime <= 2 || f.growth >= 1)) button3.textEl.style.color = '#888';
    if(!state.delete2tokens) button3.textEl.style.color = '#888';
    var tooltiptext = 'Delete entire ethereal field for ' + delete2all_cost + ' tokens, this allows restructuring all. Cannot delete crops planted during this transcend.';
    if(haveAutomaton())  tooltiptext += ' Keeps around the automaton, but that one is free to delete anyway.'
    registerTooltip(button3, tooltiptext);
    addButtonAction(button3, function() {
      if(state.delete2tokens < delete2all_cost) showMessage('need at least ' + delete2all_cost + ' tokens for this', C_INVALID, 0, 0);
      setTab(tabindex_field2);
      window.setTimeout(function() {
        for(var y = 0; y < state.numh2; y++) {
          for(var x = 0; x < state.numw2; x++) {
            var f;
            f = state.field2[y][x];
            if(f.hasCrop() && f.getCrop().type != CROPTYPE_AUTOMATON) {
              actions.push({type:ACTION_DELETE2, x:x, y:y, silent:true});
            }
          }
        }
        closeAllDialogs();
        update();
      }, 333);
    });

    updatedialogfun = bind(function(f, c, flex) {
      var html0 = getCropInfoHTML2(f, c, true);
      if(html0 != last0) {
        flex0.div.innerHTML = html0;
        last0 = html0;
      }
    }, f, c);

    updatedialogfun(f, c);
  } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
    var c = crops2[f.cropIndex()];
    var div;

    var dialog = createDialog();
    dialog.div.className = 'efDialogTranslucent';
    var flex = dialog.content;

    var text = '';

    if(state.treelevel2 > 0) {
      text += '<b>Ethereal tree level ' + state.treelevel2 + '</b>';
    } else {
      text += '<b>Ethereal tree</b>';
    }
    text += '<br><br>';

    var twigs_req = treeLevel2Req(state.treelevel2 + 1);
    text += '<b>Twigs required for next level: </b>' + (twigs_req.twigs.sub(state.res.twigs)).toString() + ' (total: ' + twigs_req.toString() + ')';
    text += '<br><br>';

    if(state.treelevel2 > 0) {
      text += '<b>Resin production bonus to basic tree: </b>' + treelevel2_resin_bonus.mulr(state.treelevel2).toPercentString();
      text += '<br><br>';
    }

    text += '<b>Total resin earned entire game: </b>' + state.g_res.resin.toString();
    text += '<br/><br/>';

    text += '<b>Ethereal boosts from crops on this field to basic field:</b><br>';
    text += '• starter resources: ' + getStarterResources().toString() + '<br>';
    text += '• berry boost: ' + state.ethereal_berry_bonus.toPercentString() + '<br>';
    text += '• mushroom boost: ' + state.ethereal_mush_bonus.toPercentString() + '<br>';
    text += '• flower boost: ' + state.ethereal_flower_bonus.toPercentString() + '<br>';
    if(state.ethereal_nettle_bonus.neqr(0)) text += '• nettle boost: ' + state.ethereal_nettle_bonus.toPercentString() + '<br>';
    text += '<br><br>';

    flex.div.innerHTML = text;

  } else {
    makePlantDialog2(x, y);
  }
}

function initField2UI() {
  field2Rows = [];
  field2Divs = [];
  for(var y = 0; y < state.numh2; y++) {
    field2Divs[y] = [];
    for(var x = 0; x < state.numw2; x++) {
      field2Divs[y][x] = new CellDiv();
    }
  }

  //This is set up such that the field tiles are square on screen, field is rectangle (or square if numw2 == numh2), and always takes max size in the rectangular div in which the field is placed
  var ratio = state.numw2 / state.numh2;
  var field2Grid = new Flex(field2Flex, [0.5,-0.5,ratio], [0.5,-0.5,1/ratio], [0.5,0.5,ratio], [0.5,0.5,1/ratio]);

  var field2Div = field2Flex.div;
  var w = field2Div.clientWidth;
  var h = field2Div.clientHeight;

  setAriaRole(field2Grid.div, 'grid'); // intended for 2D navigation, combined with the row and cell roles given to the elements below
  setAriaLabel(field2Grid.div, 'ethereal field');

  var tw = Math.floor(w / state.numw2) - 1;
  var th = Math.floor(h / state.numh2) - 1;
  tw = th = Math.min(tw, th);
  var x0 = 2 + Math.floor((field2Div.clientWidth - tw * state.numw2) / 2);
  var y0 = 2;

  for(var y = 0; y < state.numh2; y++) {
    var row = makeDiv('0', (y / state.numh2 * 100) + '%', '100%', (101 / state.numh2) + '%', field2Grid.div);
    setAriaRole(row, 'row');
    field2Rows[y] = row;
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var celldiv = makeDiv((x / state.numw2 * 100) + '%', '0', (101 / state.numw2) + '%', '100%', row);
      var bgcanvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas with the field background image
      var canvas = createCanvas('0%', '0%', '100%', '100%', celldiv); // canvas for the plant itself
      var div = makeDiv('0', '0', '100%', '100%', celldiv);
      setAriaRole(celldiv, 'cell');
      div.style.boxSizing = 'border-box'; // have the border not make the total size bigger, have it go inside
      centerText(div);

      field2Divs[y][x].div = div;
      field2Divs[y][x].canvas = canvas;
      field2Divs[y][x].bgcanvas = bgcanvas;

      util.setEvent(div, 'onmouseover', 'fieldover', bind(function(x, y) {
        updateField2MouseOver(x, y);
      }, x, y));
      util.setEvent(div, 'onmouseout', 'fieldout', bind(function(x, y) {
        updateField2MouseOut(x, y);
      }, x, y));
      // on mouse up and with timeout so that the state is fully updated after the action that the click caused
      util.setEvent(div, 'onmouseup', 'fieldclick', bind(function(x, y) {
        window.setTimeout(function(){updateField2MouseClick(x, y)});
      }, x, y));

      registerTooltip(div, bind(function(x, y, div) {
        var f = state.field2[y][x];
        var fd = field2Divs[y][x];

        var result = undefined;
        if(f.index == 0) {
          return undefined; // no tooltip for empty fields, it's a bit too spammy when you move the mouse there
        } else if(f.hasCrop()) {
          var c = crops2[f.cropIndex()];
          result = getCropInfoHTML2(f, c, false);
        } else if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          if(state.treelevel2 > 0) {
            result = 'Ethereal tree level ' + state.treelevel2;
          } else {
            result = 'Ethereal tree';
          }
          var twigs_req = treeLevel2Req(state.treelevel2 + 1);
          var nextlevelprogress = state.res.twigs.div(twigs_req.twigs);
          result += '<br><br>Twigs required for next level: </b>' + (twigs_req.twigs.sub(state.res.twigs)).toString() + ' of ' + twigs_req.toString() + ' (' + nextlevelprogress.toPercentString() + ')';
        }
        return result;
      }, x, y, div), true);

      addButtonAction(div, bind(function(x, y, div, e) {
        var f = state.field2[y][x];
        if(f.index == FIELD_TREE_TOP || f.index == FIELD_TREE_BOTTOM) {
          makeField2Dialog(x, y);
        } else if(f.index == 0) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // current behavior: plant crop of same type as lastPlanted, but of highest tier that's unlocked and you can afford. Useful in combination with ctrl+shift picking when highest unlocked one is still to expensive and you wait for automaton to upgrade the plant
            if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
              var c = crops2[state.lastPlanted2];
              var tier = state.highestoftype2unlocked[c.type];
              var c3 = croptype2_tiers[c.type][tier];
              if(c.type == CROPTYPE_CHALLENGE) c3 = c;
              if(!c3 || !state.crops2[c3.index].unlocked) c3 = c;
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res) && tier > 0) {
                tier--;
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              if(c3.getCost().gt(state.res)) {
                tier = -1; // template
                var c4 = croptype2_tiers[c.type][tier];
                if(c4 && state.crops2[c4.index].unlocked) c3 = c4;
              }
              actions.push({type:ACTION_PLANT2, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.lastPlanted2 >= 0 && crops2[state.lastPlanted2]) {
              var c = crops2[state.lastPlanted2];
              actions.push({type:ACTION_PLANT2, x:x, y:y, crop:c, shiftPlanted:true});
              update();
            } else {
              showMessage(shiftClickPlantUnset, C_INVALID, 0, 0);
            }
          } else {
            makeField2Dialog(x, y);
          }
        } else if(f.hasCrop()) {
          var shift = e.shiftKey;
          var ctrl = eventHasCtrlKey(e);
          if(shift && ctrl) {
            // experimental feature for now, most convenient behavior needs to be found
            // behavior implemented here: if safe, "pick" clicked crop type, but then the best unlocked one of its tier. If unsafe permitted, immediately upgrade to highest type, and still pick highest tier too whether or not it changed
            // other possible behaviors: pick crop type (as is), open the crop replace dialog, ...
            var c2 = f.getCrop();
            var c3 = croptype2_tiers[c2.type][state.highestoftype2unlocked[c2.type]];
            if(!c3 || !state.crops2[c3.index].unlocked) c3 = c2;
            if(c2.type == CROPTYPE_CHALLENGE) c3 = c2;
            state.lastPlanted2 = c3.index;
            if(c3.getCost().gt(state.res)) state.lastPlanted2 = c2.index;
            if((state.allowshiftdelete || c2.istemplate) && c3.tier > c2.tier) {
              actions.push({type:ACTION_REPLACE2, x:x, y:y, crop:c3, shiftPlanted:true});
              update();
            }
          } else if(shift && !ctrl) {
            if(state.allowshiftdelete) {
              var c = crops2[state.lastPlanted2];
              var c2 = f.getCrop();
              if(c2.index == state.lastPlanted2 && !f.isFullGrown()) {
                // one exception for the shift+click to replace: if crop is growing and equals your currently selected crop,
                // it means you may have just accidently planted it in wrong spot. deleting it is free (other than lost growtime,
                // but player intended to have it gone anyway by shift+clicking it even when replace was intended)
                actions.push({type:ACTION_DELETE2, x:x, y:y});
              } else {
                actions.push({type:ACTION_REPLACE2, x:x, y:y, crop:c, shiftPlanted:true});
              }
              update();
            } else {
              showMessage('ctrl+click to delete must be enabled in the settings before replacing crops with shift is allowed', C_INVALID, 0, 0);
            }
          } else if(ctrl && !shift) {
            if(state.allowshiftdelete) {
              var c = crops[state.lastPlanted];
              actions.push({type:ACTION_DELETE2, x:x, y:y});
              update();
            } else {
              showMessage('ctrl+click to delete must be enabled in the settings before it is allowed', C_INVALID, 0, 0);
            }
          } else {
            makeField2Dialog(x, y);
          }
        }
      }, x, y, div));

      var pw = tw >> 1;
      var ph = Math.round(th / 16);
      if(ph < 4) ph = 4;
      var px = x0 + x * tw + ((tw - pw) >> 1);
      var py = y0 + (y + 1) * th - ph * 2;
      var progress = makeDiv((((x + 0.2) / state.numw2) * 100) + '%', (((y + 0.9) / state.numh2) * 100) + '%', (100 / state.numw2 * 0.6) + '%', (100 / state.numh2 * 0.05) + '%', field2Grid.div);
      initProgressBar(progress);
      field2Divs[y][x].progress = progress;
    }
  }
}

function updateField2CellUI(x, y) {
  var f = state.field2[y][x];
  var fd = field2Divs[y][x];
  var growstage = (f.growth >= 1) ? 4 : Math.min(Math.floor(f.growth * 4), 3);
  var season = 4; // the ethereal season

  var progresspixel = -1;
  if(f.index == FIELD_TREE_BOTTOM && (state.treelevel2 > 0 || state.res.twigs.gtr(0))) {
    var nextlevelprogress = Math.min(0.99, state.res.twigs.div(treeLevel2Req(state.treelevel2 + 1).twigs).valueOf());
    progresspixel = Math.round(nextlevelprogress * 5);
  }

  var ferncode = 0;

  if(fd.index != f.index || fd.growstage != growstage || season != fd.season || state.treelevel2 != fd.treelevel2 || ferncode != fd.ferncode) {
    var r = util.pseudoRandom2D(x, y, 55555);
    var fieldim = images_field[season];
    var field_image = r < 0.25 ? fieldim[0] : (r < 0.5 ? fieldim[1] : (r < 0.75 ? fieldim[2] : fieldim[3]));
    if(f.index == FIELD_TREE_BOTTOM || f.index == FIELD_TREE_TOP) field_image = fieldim[4];
    renderImage(field_image, fd.bgcanvas);
    fd.season = season;
    fd.treelevel2 = state.treelevel2;
    fd.ferncode = ferncode;

    var label = 'ethereal field tile ' + x + ', ' + y;

    fd.index = f.index;
    fd.growstage = growstage;
    if(f.hasCrop()) {
      var c = crops2[f.cropIndex()];
      renderImage(c.image[growstage], fd.canvas);
      if(f.growth >= 1) {
        // fullgrown, so hide progress bar
        setProgressBar(fd.progress, -1, undefined);
      }
      label = c.name + '. ' + label;
    } else if(f.index == FIELD_TREE_TOP) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][1][season], fd.canvas);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else if(f.index == FIELD_TREE_BOTTOM) {
      renderImage(tree_images[treeLevelIndex(state.treelevel2)][2][season], fd.canvas);
      if(state.treelevel2 > 0 || state.res.twigs.gtr(0)) renderLevel(fd.canvas, state.treelevel2, 0, 11, progresspixel);
      label = 'ethereal tree level ' + state.treelevel2 + '. ' + label;
    } else {
      setProgressBar(fd.progress, -1, undefined);
      fd.div.innerText = '';
      unrenderImage(fd.canvas);
    }

    if(f.index == 0) {
      label = 'empty ' + label;
    }

    setAriaLabel(fd.div, label);
  }
  if(f.hasCrop() && f.growth < 1) {
    var c = crops2[f.cropIndex()];
    setProgressBar(fd.progress, f.growth, '#f00');
  }
}
