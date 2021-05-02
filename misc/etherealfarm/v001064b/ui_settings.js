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

function createNumberFormatHelp(notations, precision) {
  var dialog = createDialog(DIALOG_LARGE);

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Number Format help';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += 'Change the displayed number format used for most costs, amounts, percentages, etc...';
  text += '<br><br>';

  text += '<b>Latin suffixes:</b>';
  text += '<br><br>';

  var num = 34 + 2;
  for(var i = 1; i < num; i++) {
    var suffix = '', suffixname = '', numeric = '';
    if(i < num - 2) {
      suffix = getLatinSuffix(i * 3);
      suffixname = getLatinSuffixFullName(i * 3);
      numeric = ', 1e' + (i * 3);
      if(i <= 4) {
        numeric += ' (1';
        for(var j = 0; j < i; j++) numeric += ',000';
        numeric += ')';
      }
    } else if(i == num - 2) {
      suffixname = 'centillion';
      numeric = ', 1e303';
      suffix = 'C';
    } else {
      suffix = 'etc...';
    }

    text += '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric + '<br>';
  }

  text += '<br><br>';

  var have_si = false;
  for(var i = 0; i < notations.length; i++) {
    if(notations[i] == Num.N_SI) {
      have_si = true;
      break;
    }
  }

  if(have_si) {
    text += '<b>SI suffixes:</b>';
    text += '<br><br>';

    num = 9;
    for(var i = 1; i < num; i++) {
      var suffix = '', suffixname = '', numeric = '';
      numeric = ', 1';
      for(var j = 0; j < i; j++) numeric += ',000';
      numeric += ' (1e' + (i * 3) + ')';
      if(i==1){suffix = ' K'; suffixname = ' kilo';}
      else if(i==2){suffix = ' M'; suffixname = ' mega';}
      else if(i==3){suffix = ' G'; suffixname = ' giga';}
      else if(i==4){suffix = ' T'; suffixname = ' tera';}
      else if(i==5){suffix =' P'; suffixname = ' peta';}
      else if(i==6){suffix =' E'; suffixname = ' exa';}
      else if(i==7){suffix =' Z'; suffixname = ' zetta';}
      else if(i==8){suffix =' Y'; suffixname = ' yotta';}

      text += '<b>' + suffix + '</b>' + (suffixname ? ': ' : '') + suffixname + numeric + '<br>';
    }
  }


  text += '<br><br>';
  text += '<b>Symbol meanings:</b>';
  text += '<br><br>';
  text += `
    <b>.</b>: decimal point, e.g. 1.5 is one and a half<br>
    <b>*</b>: multiply, e.g. 5*5 = 25<br>
    <b>^</b>: power, e.g. 5^3 = 5*5*5 = 125<br>
    <b>10^</b>: exponential function for logarithm 10 notation<br>
    <b>e^</b>: exponential function for natural log notation. Here, e = 2.71828...`;

  text += '<br><br>';
  text += '<b>Formats:</b>';
  text += '<br><br>';

  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    text += '<b>' + upper(Num.N_Names[j]) + '</b><br>';
    text += Num.N_Help[j] + '<br><br>';
  }

  div.innerHTML = text;
}

////////////////////////////////////////////////////////////////////////////////

// Which of the number notations we support in the UI
var notations = [
  Num.N_LATIN, Num.N_ENG, Num.N_HYBRID_T, Num.N_HYBRID_U, Num.N_SCI, Num.N_HYBRID_T_SCI, Num.N_HYBRID_U_SCI,
  // a few implemented but not added in initial version: Num.N_SI, Num.N_ABC, Num.N_LOG, Num.N_EXP, Num.N_HEX
];
var notations_inv = [];
for(var i = 0; i < notations.length; i++) notations_inv[notations[i]] = i;

function createNumberFormatDialog() {
  var dialog = createDialog(DIALOG_LARGE);

  var y2 = 0;
  var h2;

  h2 = 0.05;
  var titleFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2, 0.5);
  var titleDiv = titleFlex.div;
  //titleDiv.style.border = '1px solid red';
  centerText2(titleDiv);
  y2 += h2;

  h2 = 0.1;
  var choiceFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2, 0.3);
  var choiceDiv = choiceFlex.div;
  //choiceFlex.div.style.border = '1px solid green';
  y2 += h2 + 0.02;

  h2 = 0.08;
  var descriptionFlex = new Flex(dialog.content, 0.01, y2, 0.99, y2 + h2, 0.3);
  var descriptionDiv = descriptionFlex.div;
  //descriptionFlex.div.style.border = '1px solid blue';
  y2 += h2;

  h2 = 0.05;
  var infoFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2, 0.3);
  var infoDiv = infoFlex.div;
  //infoFlex.div.style.border = '1px solid blue';
  y2 += h2 + 0.02;

  h2 = 0.25;
  var examplesFlex = new Flex(dialog.content, 0, y2, 1, y2 + h2, 0.3);
  var examplesDiv = examplesFlex.div;
  //examplesFlex.div.style.border = '1px solid blue';
  y2 += h2;

  var notation = Num.notation;

  titleDiv.textEl.innerText = 'Choose large number notation';
  var title = 'Select which notation to use for large numbers.\n\n';
  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    title += Num.N_Names[j] + ':\n' + Num.N_Help[j] + '\n\n';
  }
  titleDiv.textEl.innerText = 'Choose large number notation';
  titleDiv.textEl.title = title;

  var notationDropdown = util.makeAbsElement('select', '10%', '0%', '80%', '45%', choiceDiv);
  notationDropdown.title = title;
  for(var i = 0; i < notations.length; i++) {
    var j = notations[i];
    var el = util.makeElement('option', notationDropdown);
    el.innerText = 'notation: ' + Num.N_Names[j];
    el.title = title;
  }
  notationDropdown.onchange = function() {
    notation = notations[notationDropdown.selectedIndex];
    Num.notation = notation;
    fill();
  };
  notationDropdown.selectedIndex = notations_inv[Num.notation];
  notationDropdown.style.fontSize = '100%'; // take that of the parent flex-managed element

  //var precisionDropdown = util.makeAbsElement('select', margin, margin * 2 + Math.floor(h / 20), w - margin * 2, Math.floor(h / 20), choiceDiv);
  var precisionDropdown = util.makeAbsElement('select', '10%', '50%', '80%', '45%', choiceDiv);
  for(var i = 3; i <= 6; i++) {
    var el = util.makeElement('option', precisionDropdown);
    el.innerText = 'precision: ' + i;
  }
  precisionDropdown.onchange = function() {
    precision = precisionDropdown.selectedIndex + 3;
    Num.precision = precision;
    fill();
  };
  precisionDropdown.selectedIndex = Math.min(Math.max(0, Num.precision - 3), 4);
  precisionDropdown.style.fontSize = '100%'; // take that of the parent flex-managed element

  var div = makeDiv('1%', '0%', '98%', '10%', examplesDiv);
  div.innerHTML = '<b>Examples:</b>';
  var precision = Num.precision;
  var examples = [0, 0.03, 1, 7.123456, 150, 1712.29, 14348907.5, 4294967296, 2048e20, 800e27, 7.10915e50, 2.1065e85, 3e303];

  var fill = function() {
    var tableText = '';
    tableText += '<table border="1" style="border-collapse:collapse">';
    tableText += '<tr><td style="padding:8px"><b>Example</b></td><td style="padding:8px"><b>Notation</b></td><td width="10%" style="border:none"></td><td style="padding:8px"><b>Example</b></td><td style="padding:8px"><b>Notation</b></td></tr>';
    for(var i = 0; i * 2 < examples.length; i++) {
      tableText += '<tr>';
      tableText += '<td style="padding:8px;">';
      tableText += examples[i].valueOf();
      tableText += '</td><td style="padding:8px">'
      tableText += Num(examples[i]).toString(precision, notation);
      tableText += '</td>';
      var j = i + Math.floor(examples.length / 2);
      tableText += '<td style="border:none"> </td>';
      tableText += '<td style="padding:8px;">';
      tableText += examples[j].valueOf();
      tableText += '</td><td style="padding:8px">'
      tableText += Num(examples[j]).toString(precision, notation);
      tableText += '</td>';
      tableText += '</tr>';
    }
    tableText += '</table>';
    descriptionDiv.innerHTML = '<b>Notation description:</b> ' + Num.N_Help[notation];

    div.innerHTML = tableText;

    updateUI();
  };


  var button = new Flex(infoFlex, 0.01, 0.16, 0.3, 0.8, 1).div;
  styleButton(button);
  button.textEl.innerText = 'help';
  addButtonAction(button.textEl, function() {
    createNumberFormatHelp(notations, precision);
  });

  fill();
}



function createNotificationSettingsDialog() {
  var dialog = createDialog();

  var title = new Flex(dialog.content, 0, 0, 1, 0.05, 0.4);
  centerText2(title.div);
  title.div.textEl.innerText = 'Messages & Sounds';
  title.div.textEl.style.fontWeight = 'bold';

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeSettingsButton = function() {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };

  var addSettingsSpacer = function() {
    pos += h * 0.5;
  };

  var button;
  var updatebuttontext;

  var notificationSoundWarning = 'Whether sound works at all depends on your browser and whether playing media is allowed by the settings. Browsers will only play the sound if the game is in a foreground tab. Browsers also require interaction with the page before they allow playing sounds at all, so sounds may not work after refreshing the page and not clicking anything.';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'fern notification sound: ' + (state.notificationsounds[0] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Notification "ding" sound when a fern pops up. ' + notificationSoundWarning);
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.notificationsounds[0] = !state.notificationsounds[0] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_fernsound';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'fullgrown notification sound: ' + (state.notificationsounds[1] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Notification "ding" sound when crops get fullgrown. ' + notificationSoundWarning);
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.notificationsounds[1] = !state.notificationsounds[1] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_growsound';

  addSettingsSpacer();

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'auto save in message log: ' + (state.messagelogenabled[0] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show auto save message in the message log. This setting does not stop auto-save from working, it just does so silently.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[0] = !state.messagelogenabled[0] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_savemessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'tree levels in message log: ' + (state.messagelogenabled[1] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show message log message when tree levels up. If disabled, the message will only appear if tree reached highest level ever.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[1] = !state.messagelogenabled[1] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_treelevelmessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'upgrades available in message log: ' + (state.messagelogenabled[2] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show message log message when regular upgrade available. If disabled, the message will still appear for never before seen upgrades.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[2] = !state.messagelogenabled[2] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_upgrademessages';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'abbreviated help in message log: ' + (state.messagelogenabled[3] ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Show abbreviated versions of help dialog in the message log. If disabled, they still appear if seen the first time ever');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.messagelogenabled[3] = !state.messagelogenabled[3] * 1;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_helpmessages';
}



function createAdvancedSettingsDialog() {
  var dialog = createDialog();

  var title = new Flex(dialog.content, 0, 0, 1, 0.05, 0.4);
  centerText2(title.div);
  title.div.textEl.innerText = 'Preferences';
  title.div.textEl.style.fontWeight = 'bold';

  var pos = 0.05;
  var buttondiv;
  var h = 0.06;

  var makeSettingsButton = function() {
    //var button = makeDiv('10%', (pos * 100) + '%', '80%', (h * 100) + '%', parent);
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };

  var addSettingsSpacer = function() {
    pos += h * 0.5;
  };

  var button;
  var updatebuttontext;


  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var style = '?';
    if(state.uistyle == 2) style = 'dark';
    else if(state.uistyle == 3) style = 'dark (alternative)';
    else style = 'light';
    button.textEl.innerText = 'interface theme: ' + style;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Change the interface style');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.uistyle++;
    if(state.uistyle > 3) state.uistyle = 1;
    updatebuttontext(button);
    setStyle();
  }, button, updatebuttontext));
  button.id = 'preferences_theme';


  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    var style = '?';
    if(state.tooltipstyle == 0) style = 'none';
    if(state.tooltipstyle == 1) style = 'dark';
    if(state.tooltipstyle == 2) style = 'light';
    if(state.tooltipstyle == 3) style = 'translucent';
    button.textEl.innerText = 'tooltip style: ' + style;
  };
  updatebuttontext(button);
  registerTooltip(button, 'Change the tooltip style or disable them');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.tooltipstyle++;
    if(state.tooltipstyle >= 4) state.tooltipstyle = 0;
    updatebuttontext(button);
    removeAllTooltips();
  }, button, updatebuttontext));
  button.id = 'preferences_tooltip';

  button = makeSettingsButton();
  var updatebuttontext = function(button) {
    button.textEl.innerText = state.sidepanel ? 'side panel: auto' : 'side panel: off';
  };
  updatebuttontext(button);
  registerTooltip(button, 'Choose whether the side panel with upgrade shortcuts and stats summary may appear or not. If on, the side panel only appears if the window is wide enough.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.sidepanel = (state.sidepanel ? 0 : 1);
    updatebuttontext(button);
    removeAllTooltips();
    updateRightPane();
  }, button, updatebuttontext));
  button.id = 'preferences_sidepanel';


  button = makeSettingsButton();
  button.textEl.innerText = 'number format';
  registerTooltip(button, 'Change the precision and display type for large numbers.');
  addButtonAction(button, function(e) {
    createNumberFormatDialog();
  });
  button.id = 'preferences_number';


  addSettingsSpacer();

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'save on close: ' + (state.saveonexit ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to auto-save when closing the browser window or tab. If off, then still auto-saves every few minutes, but no longer on unload. Toggling this setting will also immediately cause a save.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.saveonexit = !state.saveonexit;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext));
  button.id = 'preferences_saveonclose';

  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'shortcuts may delete crop: ' + (state.allowshiftdelete ? 'yes' : 'no'); };
  updatebuttontext(button);
  registerTooltip(button, 'Allow deleting crop without any dialog or confirmation by ctrl+clicking it on the field or pressing "d", or replacing by shift+clicking it. Note that you can always shift+click empty fields to repeat last planted type (opposite of deleting), regardless of this setting.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.allowshiftdelete = !state.allowshiftdelete;
    updatebuttontext(button);
  }, button, updatebuttontext));
  button.id = 'preferences_shiftdelete';

  addSettingsSpacer();

  button = makeSettingsButton();
  button.textEl.innerText = 'reset "never show again" help dialogs';
  registerTooltip(button, 'Resets the "never show again" of all help dialogs, so you\'ll see them again next time until you disable them individually again.');
  addButtonAction(button, function(e) {
    var dialog = createDialog(DIALOG_MEDIUM, function() {
      state.help_disable = {};
      dialog.cancelFun();
      closeAllDialogs();
    }, 'reset', 'cancel');
    dialog.content.div.innerHTML = 'This resets the "never show again" setting of all individual help dialogs. You\'ll get the help dialogs again in the situations that make them appear. You can individually disable them again.';
  });
  button.id = 'preferences_resethelp';


  button = makeSettingsButton();
  updatebuttontext = function(button) { button.textEl.innerText = 'enable help dialogs: ' + (state.disableHelp ? 'no' : 'yes'); };
  updatebuttontext(button);
  registerTooltip(button, 'Whether to enable pop-up help dialogs. Set to no if you consider the dialogs too intrusive. However, if you leave them enabled, you can also always disable individual help dialogs with their "never show again" button, so you can still see new ones, which may be useful to get information about new game mechanics that unlock later.');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    state.disableHelp = !state.disableHelp;
    updatebuttontext(button);
    saveNow(); // save immediately now: otherwise if you refresh after toggling this setting, it'll reset back exactly due to not saving...
  }, button, updatebuttontext));
  button.id = 'preferences_enablehelp';


  addSettingsSpacer();


  button = makeSettingsButton();
  button.textEl.innerText = 'messages & sounds';
  registerTooltip(button, 'Message log and sound notifications');
  addButtonAction(button, bind(function(button, updatebuttontext, e) {
    createNotificationSettingsDialog();
  }, button, updatebuttontext));
  button.id = 'preferences_notifications';
}


var showing_stats = false;


function createStatsDialog() {
  showing_stats = true;
  var dialog = createDialog(undefined, undefined, undefined, undefined, undefined, undefined, undefined, function() {
    showing_stats = false;
  });

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'Player Statistics';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.35);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  var open = '<font color="#fff">';
  var close = '</font>';

  if(state.g_numresets > 0) {
    text += '<b>Current Run</b><br>';
  }
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• tree level: ' + open + state.treelevel + close + '<br>';
  text += '• start time: ' + open + util.formatDate(state.c_starttime) + close + '<br>';
  text += '• duration: ' + open + util.formatDuration(util.getTime() - state.c_starttime) + close + '<br>';
  var c_res = Res(state.c_res);
  c_res.essence.addInPlace(getUpcomingFruitEssence().essence);
  text += '• total earned: ' + open + c_res.toString(true) + close + '<br>';
  text += '• highest resources: ' + open + state.c_max_res.toString(true) + close + '<br>';
  text += '• highest production/s: ' + open + state.c_max_prod.toString(true) + close + '<br>';
  text += '• ferns: ' + open + state.c_numferns + close + '<br>';
  text += '• planted (permanent): ' + open + state.c_numfullgrown + close + '<br>';
  text += '• planted (watercress): ' + open + state.c_numplantedshort + close + '<br>';
  text += '• deleted: ' + open + state.c_numunplanted + close + '<br>';
  text += '• upgrades: ' + open + state.c_numupgrades + close + '<br>';
  if(state.g_numfruits > 0) {
    text += '• fruits: ' + open + state.c_numfruits + close + '<br>';
    text += '• fruit upgrades: ' + open + state.c_numfruitupgrades + close + '<br>';
  }
  if(state.g_numresets > 0 || state.treelevel > 0) text += '• weather abilities activated: ' + open + state.c_numabilities + close + '<br>';
  if(state.upgrades[upgrade_sununlock].count > 0) text += '• sun ability berry boost, run time, cooldown time, total cycle: ' + open + '+' + getSunSeedsBoost().toPercentString()  + ', ' + util.formatDuration(getSunDuration(), true) + close + ', ' + open + util.formatDuration(getSunWait() - getSunDuration(), true) + close + ', ' + open + util.formatDuration(getSunWait(), true) + close + '<br>';
  if(state.upgrades[upgrade_mistunlock].count > 0) text += '• mist ability mushroom boost, run time, cooldown time, total cycle: ' + open + '+' + getMistSporesBoost().toPercentString() + ' (-' + getMistSeedsBoost().rsub(1).toPercentString() + ' consumption), ' + util.formatDuration(getMistDuration(), true) + close + ', ' + open + util.formatDuration(getMistWait() - getMistDuration(), true) + close + ', ' + open + util.formatDuration(getMistWait(), true) + close + '<br>';
  if(state.upgrades[upgrade_rainbowunlock].count > 0) text += '• rainbow ability flower boost, run time, cooldown time, total cycle: ' + open + '+' + getRainbowFlowerBoost().toPercentString() + ', ' + util.formatDuration(getRainbowDuration(), true) + close + ', ' + open + util.formatDuration(getRainbowWait() - getRainbowDuration(), true) + close + ', ' + open + util.formatDuration(getRainbowWait(), true) + close + '<br>';
  if(state.g_res.resin.neqr(0)) {
    text += '• resin/hour: ' + open + getResinHour().toString() + close + '<br>';
    text += '• best resin/hour: ' + open + state.c_res_hr_best.resin.toString() + ' at level ' + state.c_res_hr_at.resin.valueOf() + close + '<br>';
  }
  if(state.g_res.twigs.neqr(0)) {
    text += '• twigs/hour: ' + open + getTwigsHour().toString() + close + '<br>';
    text += '• best twigs/hour: ' + open + state.c_res_hr_best.twigs.toString() + ' at level ' + state.c_res_hr_at.twigs.valueOf() + close + '<br>';
  }


  if(state.g_numresets > 0) {
    text += '<br>';
    text += '<b>Total</b><br>';
    text += '• highest tree level: ' + open + state.g_treelevel + ' (before: ' + state.g_p_treelevel + ')' + close + '<br>';
    text += '• achievements: ' + open + state.g_nummedals + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.g_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(util.getTime() - state.g_starttime) + close + '<br>';
    text += '• total earned: ' + open + state.g_res.toString(true) + close + '<br>';
    text += '• highest resources: ' + open + state.g_max_res.toString(true) + close + '<br>';
    text += '• highest production/s: ' + open + state.g_max_prod.toString(true) + close + '<br>';
    text += '• ferns: ' + open + state.g_numferns + close + '<br>';
    text += '• planted (permanent): ' + open + state.g_numfullgrown + close + '<br>';
    text += '• planted (watercress): ' + open + state.g_numplantedshort + close + '<br>';
    text += '• deleted: ' + open + state.g_numunplanted + close + '<br>';
    text += '• upgrades: ' + open + state.g_numupgrades + close + '<br>';
    if(state.g_numfruits > 0) {
      text += '• fruits: ' + open + state.g_numfruits + close + '<br>';
      text += '• fruit upgrades: ' + open + state.g_numfruitupgrades + close + '<br>';
    }
    text += '• weather abilities activated: ' + open + state.g_numabilities + close + '<br>';
    text += '• season changes seen: ' + open + state.g_seasons + close + '<br>';
    text += '• fastest run: ' + open + util.formatDuration(state.g_fastestrun) + close + '<br>';
    text += '• longest run: ' + open + util.formatDuration(state.g_slowestrun) + close + '<br>';
  }

  // these stats either are at the end of current run, or total, depending on whether "total" is visible due to having done transcensions
  text += '• achievements: ' + open + state.medals_earned + close + '<br>';
  text += '• achievements production bonus: ' + open + '+' + state.medal_prodmul.subr(1).toPercentString() + close + '<br>';


  var s = getSeason();
  text += '• current season: ' + open + seasonNames[s] + close + '<br>';
  text += '• spring flower bonus: ' + open + '+' + getSpringFlowerBonus().subr(1).toPercentString() + close + '<br>';
  text += '• summer berry bonus: ' + open + '+' + getSummerBerryBonus().subr(1).toPercentString() + close + '<br>';
  text += '• summer mushroom bonus: ' + open + '+' + getSummerMushroomBonus().subr(1).toPercentString() + close + '<br>';
  text += '• autumn mushroom bonus: ' + open + '+' + getAutumnMushroomBonus().subr(1).toPercentString() + close + '<br>';
  text += '• autumn berry bonus: ' + open + '+' + getAutumnBerryBonus().subr(1).toPercentString() + close + '<br>';
  text += '• autumn twigs bonus: ' + open + '+' + getAutumnMistletoeBonus().subr(1).toPercentString() + close + '<br>';
  text += '• winter harsh conditions malus: ' + open + '-' + Num(1).sub(getWinterMalus()).toPercentString() + close + '<br>';
  text += '• winter tree warmth bonus: ' + open + '+' + getWinterTreeWarmth().subr(1).toPercentString() + close + '<br>';
  text += '• winter resin bonus: ' + open + '+' + getWinterTreeResinBonus().subr(1).toPercentString() + close + '<br>';

  if(haveMultiplicity()) {
    text += '• multiplicity (berry and mushroom): ' + open + '+' + (getMultiplicityBonusBase()).toPercentString() + ' per other of same type' + close + '<br>';
  }
  text += '<br>';

  if(state.g_numresets > 0) {
    text += '<b>Ethereal</b><br>';
    text += '• ethereal tree level: ' + open + state.treelevel2 + close + '<br>';
    text += '• total resin: ' + open + state.g_res.resin.toString() + close + '<br>';
    text += '• transcensions: ' + open + state.g_numresets + close + '<br>';
    var n = Math.min(Math.min(15, state.reset_stats_time.length), state.reset_stats_level.length);
    if(n > 0) {
      if(n == 1) {
        text += '• last transcension level: ' + open;
      } else {
        text += '• last transcension levels (recent first): ' + open;
      }
      for(var i = 0; i < n; i++) {
        var j = n - 1 - i;
        var minutes = state.reset_stats_time[state.reset_stats_time.length - 1 - i] * 5;
        var timetext = '';
        if(minutes < 60) timetext = Num(minutes).toString(1) + 'm';
        else if(minutes < 60 * 5) timetext = Num(minutes / 60).toString(2) + 'h';
        else if(minutes < 60 * 48) timetext = Num(minutes / 60).toString(1) + 'h';
        else timetext = Num(minutes / (24 * 60)).toString(1) + 'd';
        text += (i == 0 ? ' ' : ', ') +
            state.reset_stats_level[state.reset_stats_level.length - 1 - i] +
            ' (' + timetext +
            (state.reset_stats_challenge[state.reset_stats_challenge.length - 1 - i] ? ', C' : '') +
            ')';
      }
      text += close + '<br>';
    }
    text += '• ethereal planted: ' + open + state.g_numfullgrown2 + close + '<br>';
    text += '• ethereal deleted: ' + open + state.g_numunplanted2 + close + '<br>';
    text += '• ethereal delete tokens: ' + open + state.delete2tokens + ' / ' + getDelete2maxBuildup() + close + '<br>';
    text += '<br>';
  }

  if(state.g_numresets > 0 && state.challenges_unlocked) {
    text += '<b>Challenges</b><br>';
    if(state.challenge) {
      text += '• current challenge: ' + open + upper(challenges[state.challenge].name) + close + '<br>';
    } else {
      text += '• current challenge: ' + open + 'None' + close + '<br>';
    }
    text += '• challenges attempted: ' + open + (state.g_numresets_challenge + (state.challenge ? 1 : 0)) + close + '<br>';
    text += '• challenges unlocked: ' + open + state.challenges_unlocked + close + '<br>';
    text += '• challenges completed: ' + open + state.challenges_completed + close + '<br>';
    if(state.challenges_completed != state.challenges_completed2) {
      text += '• challenge stages completed: ' + open + state.challenges_completed3 + close + '<br>';
      text += '• challenge fully completed: ' + open + state.challenges_completed2 + close + '<br>';
    }
    text += '• total challenge production bonus: ' + open + state.challenge_bonus.toPercentString() + close + '<br>';

    text += '<br>';
  }

  if(state.g_numresets > 0) {
    if(state.challenge) {
      text += '<b>Previous Run (Non-challenge)</b><br>';
    } else {
      text += '<b>Previous Run</b><br>';
    }
    text += '• tree level: ' + open + state.p_treelevel + close + '<br>';
    text += '• start time: ' + open + util.formatDate(state.p_starttime) + close + '<br>';
    text += '• duration: ' + open + util.formatDuration(state.p_runtime) + close + '<br>';
    text += '• total earned: ' + open + state.p_res.toString(true) + close + '<br>';
    text += '• highest resources: ' + open + state.p_max_res.toString(true) + close + '<br>';
    text += '• highest production/s: ' + open + state.p_max_prod.toString(true) + close + '<br>';
    text += '• ferns: ' + open + state.p_numferns + close + '<br>';
    text += '• planted (permanent): ' + open + state.p_numfullgrown + close + '<br>';
    text += '• planted (watercress): ' + open + state.p_numplantedshort + close + '<br>';
    text += '• deleted: ' + open + state.p_numunplanted + close + '<br>';
    text += '• upgrades: ' + open + state.p_numupgrades + close + '<br>';
    if(state.g_numfruits > 0) {
      text += '• fruits: ' + open + state.p_numfruits + close + '<br>';
      text += '• fruit upgrades: ' + open + state.p_numfruitupgrades + close + '<br>';
    }
    text += '• weather abilities activated: ' + open + state.p_numabilities + close + '<br>';
    if(state.g_res.resin.neqr(0)) {
      text += '• resin/hour: ' + open + (state.p_res.resin.divr(state.p_runtime / 3600)).toString() + close + '<br>';
      text += '• best resin/hour: ' + open + state.p_res_hr_best.resin.toString() + ' at level ' + state.p_res_hr_at.resin.valueOf() + close + '<br>';
    }
    if(state.g_res.twigs.neqr(0)) {
      text += '• twigs/hour: ' + open + (state.p_res.twigs.divr(state.p_runtime / 3600)).toString() + close + '<br>';
      text += '• best twigs/hour: ' + open + state.p_res_hr_best.twigs.toString() + ' at level ' + state.p_res_hr_at.twigs.valueOf() + close + '<br>';
    }
    text += '<br>';
  }

  div.innerHTML = text;
}

var showing_changelog = false;

function createChangelogDialog() {
  showing_changelog = true;
  var dialog = createDialog(undefined, undefined, undefined, undefined, undefined, undefined, undefined, function() {
    showing_changelog = false;
  });

  var titleDiv = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4).div;
  centerText2(titleDiv);
  titleDiv.textEl.innerText = 'About';

  var flex = new Flex(dialog.content, 0.01, 0.11, 0.99, 1, 0.3);
  var div = flex.div;
  makeScrollable(flex);

  var text = '';

  text += 'Ethereal Farm';
  text += '<br/><br/>';

  text += 'Reddit: <a target="_blank" href="https://www.reddit.com/r/etherealfarm/">https://www.reddit.com/r/etherealfarm/</a>';
  text += '<br/>';
  text += 'Discord: <a target="_blank" href="https://discord.gg/9eaTxXvMT2">https://discord.gg/9eaTxXvMT2</a>';
  text += '<br/>';
  text += 'Github: <a target="_blank" href="https://github.com/lvandeve/etherealfarm">https://github.com/lvandeve/etherealfarm</a>';
  text += '<br/><br/>';

  text += 'Game version: ' + programname + ' v' + formatVersion();
  text += '<br/><br/>';
  text += 'Changelog:';
  text += '<br/><br/>';


  text += getChangeLog();

  text += 'Copyright (c) 2020-2021 by Lode Vandevenne';

  div.innerHTML = text;
}


// if opt_failed_save is true, the dialog is shown due to an actual failed save so the message is different.
function showSavegameRecoveryDialog(opt_failed_save) {
  var title;
  if(opt_failed_save) {
    title = '<font color="red"><b>Loading failed</b></font>. Read this carefully to help recover your savegame if you don\'t have backups. Copypaste all the recovery savegame(s) below and save them in a text file. Once they\'re stored safely by you, try some of them in the "import save" dialog under settings. One of them may be recent enough and work. Even if the recovery saves don\'t work now, a future version of the game may fix it. Apologies for this.';
  } else {
    title = 'Recovery saves. These may be older saves, some from previous game versions. Use at your own risk, but if your current save has an issue, save all of these to a text file as soon as possible so that if there\'s one good one it doesn\'t risk being overwritten by more issues. Try importing each of them, hopefully at least one will be good and recent enough.';
  }

  var saves = getRecoverySaves();
  var text = '';
  for(var i = 0; i < saves.length; i++) {
    text += saves[i][0] + '\n' + saves[i][1] + '\n\n';
  }
  if(saves.length == 0) {
    text = 'No recovery saves found. Ethereal farm savegames are stored in local storage of your web browser for the current website. If you expected to see savegames here, there may be several possible reasons:\n\n' +
            ' • Your browser deleted (or doesn\'t save) local storage for this website\n\n' +
            ' • After manually performing a hard reset all data is erased\n\n' +
            ' • Never played the game on this device or in this browser.\n\n' +
            ' • Played the game on a different website (URL). If you played on a different website before and want to continue here, you can export the save there and import it here in the settings.\n\n' +
            ' • Other modifications to the URL: for example, ensure no "www" in front and "https", not "http" in front.\n\n';
  }

  if(!opt_failed_save && saves.length > 0 && !savegame_recovery_situation) {
    // also add current
    save(state, function(s) {
      text += 'current' + '\n' + s + '\n\n';
      showExportTextDialog(title, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
    });
  } else {
    showExportTextDialog(title, text, 'ethereal-farm-recovery-' + util.formatDate(util.getTime(), true) + '.txt', !opt_failed_save);
  }
}

// show a dialog to export the text, to clipboard, by save as file, ...
function showExportTextDialog(title, text, filename, opt_close_on_clipboard) {
  var large = title.length > 400 || text.length > 1000;

  var clipboardSupported = document.queryCommandSupported && document.queryCommandSupported('copy') && document.execCommand;
  var dialog;
  var extrafun = undefined;
  var extraname = undefined;

  if(clipboardSupported) {
    extrafun = function(e) {
      area.select();
      area.focus();
      try {
        document.execCommand('copy');
      } catch(e) {
        showMessage('failed to copy to clipboard', C_ERROR, 0, 0);
        textFlex.div.innerText = 'failed to copy to clipboard, copy it manually with ctrl+c instead';
        textFlex.div.style.color = 'red';
        return;
      }
      if(opt_close_on_clipboard) closeAllDialogs();
      showMessage('save copied to clipboard');
    };
    extraname = 'to clipboard';
  }

  dialog = createDialog(large ? DIALOG_MEDIUM : DIALOG_SMALL, function(e) {
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(area.value + '\n'));
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if(opt_close_on_clipboard) closeAllDialogs();
    showMessage('save exported to file');
  }, 'download', 'back', extrafun, extraname);


  var textFlex = new Flex(dialog.content, 0.02, 0.01, 0.98, 0.15, 0.3);
  textFlex.div.innerHTML = title;

  var areaFlex = new Flex(dialog.content, 0.02, 0.2, 0.98, 1, 0.3);
  var area = util.makeAbsElement('textarea', '0', '0', '100%', '100%', areaFlex.div);

  area.value = text;
  area.select();
}


function initSettingsUI_in(dialog) {

  var pos = 0.05;
  var gap = 0.025;

  var makeSettingsButton = function() {
    var h = 0.06;
    var buttonFlex = new Flex(dialog.content, 0.1, pos, 0.9, pos + h, 0.5);
    var button = buttonFlex.div;
    styleButton(button, 1);
    pos += h * 1.1;
    return button;
  };



  var title = new Flex(dialog.content, 0, 0, 1, 0.05, 0.4);
  centerText2(title.div);
  title.div.textEl.innerText = 'Settings';
  title.div.textEl.style.fontWeight = 'bold';
  var button;
  button = makeSettingsButton();
  button.textEl.innerText = 'save now';
  registerTooltip(button, 'Save to local storage now. The game also autosaves every few minutes so you don\'t need this button often.');
  addButtonAction(button, function() {
    saveNow(function(s) {
      showMessage(manualSavedStateMessage);
      util.setLocalStorage(s, localstorageName_manual);
      closeAllDialogs();
    });
  });
  button.id = 'settings_save';


  button = makeSettingsButton();
  button.textEl.innerText = 'export save';
  registerTooltip(button, 'Export an encoded savegame, for backups.');
  addButtonAction(button, function() {
    state.g_numexports++;
    // this gets updated even if user would then close the dialog without actually saving it, we can't know whether they actually properly stored the text or not
    state.g_lastexporttime = util.getTime();
    save(state, function(s) {
      var title = 'Export a savegame backup: copy or download the encoded savegame below, and store it somewhere safe. Do this regularly: even though the game autosaves in the web browser, browsers can easily lose this data. This contains all your progress!';
      showExportTextDialog(title, s, 'ethereal-farm-' + util.formatDate(util.getTime(), true) + '.txt', true);
    });
  });
  button.id = 'settings_export';

  button = makeSettingsButton();
  button.textEl.innerText = 'import save';
  registerTooltip(button, 'Import a save, which you created with "export save"');
  addButtonAction(button, function(e) {
    var w = 500, h = 500;
    var dialog = createDialog(false, function(e) {
      var shift = e.shiftKey;
      var enc = area.value;
      enc = enc.trim();
      if(enc == '') return;
      load(enc, function(state) {
        if(shift) {
          state.prevtime = state.time = util.getTime();
          postload(state);
          showMessage('Held shift key while importing this save, so no resources added for the time between exporting and importing now (loaded as if the time was back then). To get those resources, don\'t hold shift while loading.');
        }
        dialog.cancelFun();
        state.g_numimports++;
        state.g_lastimporttime = util.getTime();
        closeAllDialogs();
        removeChallengeChip();
        removeMedalChip();
        removeHelpChip();
        clearUndo();
        initUI();
        update();
        util.clearLocalStorage(localstorageName_recover); // if there was a recovery save, delete it now assuming that a successful import means some good save exists
        savegame_recovery_situation = false;
      }, function(state) {
        var message = importfailedmessage;
        if(state && state.error_reason == 1) message += '\n' + loadfailreason_toosmall;
        if(state && state.error_reason == 2) message += '\n' + loadfailreason_notbase64;
        if(state && state.error_reason == 3) message += '\n' + loadfailreason_signature;
        if(state && state.error_reason == 4) message += '\n' + loadfailreason_format;
        if(state && state.error_reason == 5) message += '\n' + loadfailreason_decompression;
        if(state && state.error_reason == 6) message += '\n' + loadfailreason_checksum;
        if(state && state.error_reason == 7) message += '\n' + loadfailreason_toonew;
        if(state && state.error_reason == 8) message += '\n' + loadfailreason_tooold;
        textFlex.div.innerText = message;
        textFlex.div.style.color = 'black';
      });
    }, 'import', 'cancel');
    var textFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4);
    textFlex.div.innerHTML = 'Import a savegame backup. You can create a backup with "export save". Paste in here and press "import".<br/><font color="red">Warning: this overwrites your current game!</font>';
    var area = util.makeAbsElement('textarea', '1%', '15%', '98%', '70%', dialog.content.div);
    area.select();
    area.focus();
  });
  button.id = 'settings_import';

  button = makeSettingsButton();
  button.textEl.innerText = 'hard reset';
  registerTooltip(button, hardresetwarning);
  addButtonAction(button, function(e) {
    var w = 500, h = 500;
    var dialog = createDialog(false, function(e) {
      dialog.cancelFun();
      hardReset();
      closeAllDialogs();
    }, 'reset');
    var warningFlex = new Flex(dialog.content, 0.01, 0.01, 0.99, 0.1, 0.4);
    warningFlex.div.innerText = hardresetwarning;
    warningFlex.div.style.color = 'red';
  });
  button.id = 'settings_hardreset';

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'preferences';
  registerTooltip(button, 'Various UI, saving, gameplay and other settings.');
  addButtonAction(button, function(e) {
    createAdvancedSettingsDialog();
  });
  button.id = 'settings_preferences';

  button = makeSettingsButton();
  button.textEl.innerText = 'number format';
  registerTooltip(button, 'Change the precision and display type for large numbers.');
  addButtonAction(button, function(e) {
    createNumberFormatDialog();
  });
  button.id = 'settings_number';

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'player stats';
  addButtonAction(button, function(e) {
    createStatsDialog();
  });
  button.id = 'settings_player_stats';

  if(state.challenges_unlocked) {
    button = makeSettingsButton();
    button.textEl.innerText = 'challenge stats';
    addButtonAction(button, function(e) {
      createAllChallengeStatsDialog();
    });
    button.id = 'settings_challenge_stats';
  }

  pos += gap;

  button = makeSettingsButton();
  button.textEl.innerText = 'help';
  addButtonAction(button, function(e) {
    createHelpDialog();
  });
  button.id = 'settings_help';

  button = makeSettingsButton();
  button.textEl.innerText = 'about & changelog';
  addButtonAction(button, function(e) {
    createChangelogDialog();
  });
  button.id = 'settings_about';
}

function initSettingsUI() {
  var gearbutton = new Flex(topFlex, [0,0.1], [0,0.1], [0,0.9], [0,0.9]).div;
  var canvas = createCanvas('0%', '0%', '100%', '100%', gearbutton);
  renderImage(image_gear, canvas);
  styleButton0(gearbutton, true);
  gearbutton.title = 'Settings';

  addButtonAction(gearbutton, function() {
    var dialog = createDialog();
    initSettingsUI_in(dialog);
  }, 'settings');
  gearbutton.id = 'settings_button';

  // changelog / about button
  var aboutbutton = new Flex(topFlex, [1,-0.9], [0,0.1], [1,-0.1], [0,0.9]).div;
  canvas = createCanvas('0%', '0%', '100%', '100%', aboutbutton);
  renderImage(images_fern[1], canvas);
  styleButton0(aboutbutton, true);
  aboutbutton.title = 'About';

  addButtonAction(aboutbutton, function() {
    createChangelogDialog();
  }, 'about');
  aboutbutton.id = 'about_button';

  var undobutton = new Flex(topFlex, [0,1.6], [0,0.15], [0,3.3], [0,0.85], 2);
  styleButton(undobutton.div);
  undobutton.div.textEl.innerText = 'Undo';
  addButtonAction(undobutton.div, function(e) {
    if(e.shiftKey) {
      showMessage('held shift key while pressing undo button, so saving undo instead.');
      storeUndo(state);
    } else {
      loadUndo();
      update();
    }
    removeAllTooltips();
  }, 'undo');
  undobutton.div.id = 'undo_button';
  registerTooltip(undobutton.div, function() {
    return 'Undo your last action(s). Press again to redo.<br><br>' +
      'Undo is saved when doing an action, but with at least ' + util.formatDuration(minUndoTime) + ' of time in-between, so multiple actions in quick succession may all be undone.<br><br>' +
      'Undo save time duration is limited to ' + util.formatDuration(maxUndoTime) + '. If you undo a long time duration, you\'ll still get the correct amount of resources gained during that time.' +
      '';
    });
}
