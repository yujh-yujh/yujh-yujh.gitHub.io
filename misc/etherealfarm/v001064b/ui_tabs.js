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



var tabbuttons;
var tabs;


var upgradesButtonLastText = '';
var fruitButtonLastText = '';
var upgrades2ButtonLastText = '';
var medalsButtonLastText = '';
var fieldButtonLastText = '';
var field2ButtonLastText = '';
var automatonButtonLastText = '';

function setTab(i, opt_temp) {
  //if(!tabbuttons[i]) return; // trying to set a tab that is not supposed to be visible

  if(state.currentTab == tabindex_medals && state.currentTab != i && state.medals_new) {
    // when leaving the achievements tab and there are unseen medals, mark them all as seen now, to not let the player hunt for which
    // medals to mouseover to remove the red indication
    for(var j = 0; j < registered_medals.length; j++) {
      var m2 = state.medals[registered_medals[j]];
      if(m2.earned) m2.seen = true;
    }
  }

  if(!opt_temp) state.currentTab = i;

  for(var j = 0; j < tabs.length; j++) {
    tabs[j].div.style.visibility = (i == j) ? 'visible' : 'hidden';
  }
  for(var j = 0; j < tabbuttons.length; j++) {
    if(!tabbuttons[j]) continue;
    highlightButton(tabbuttons[j], i == j);
  }

  if(i == tabindex_upgrades) updateUpgradeUI();
  if(i == tabindex_fruit) {
    state.fruit_seen = true;
    lastTouchedFruit = null;
    updateFruitUI();
  }
  if(i == tabindex_automaton) {
    updateAutomatonUI();
  }
  if(i == tabindex_medals) {
    updateMedalUI();
    removeMedalChip();
  }
  if(i == tabindex_upgrades2) {
    updateUpgrade2UI();
  }

  removeAllDropdownElements();

  updateTabButtons();
}


// makes it indicate new upgrades/achievements/..., if there are
function updateTabButtons2() {
  if(state.currentTab == tabindex_upgrades && state.upgrades_new) {
    for(var i = 0; i < registered_upgrades.length; i++) {
      var u = state.upgrades[registered_upgrades[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  if(state.currentTab == tabindex_medals && state.medals_new) {
    for(var i = 0; i < registered_medals.length; i++) {
      // commented out: medal tooltip does this now.
      //var m = state.medals[registered_medals[i]];
      //if(m.earned && !m.seen) m.seen = true;
    }
    computeDerived(state);
  }

  if(state.currentTab == tabindex_upgrades2 && state.upgrades2_new) {
    for(var i = 0; i < registered_upgrades2.length; i++) {
      var u = state.upgrades2[registered_upgrades2[i]];
      if(u.unlocked && !u.seen) u.seen = true;
    }
    computeDerived(state);
  }

  var tabnum;

  tabnum = tabindex_field;
  if(tabbuttons[tabnum]) {
    var text = 'field';

    if(state.treelevel > 0) {
      text += '<br/>(' + state.treelevel + ')';
    }
    if(state.fern /*&& state.currentTab != tabindex_field*/) {
      text = '<b><font color="#2d0">' + text + '</font></b>';
    }

    if(text != fieldButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      fieldButtonLastText = text;
    }
  }

  tabnum = tabindex_upgrades;
  if(tabbuttons[tabnum]) {
    var text = 'upgrades<br/>(' + state.upgrades_affordable + '/' + state.upgrades_upgradable + ')';
    if(state.upgrades_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != upgradesButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      upgradesButtonLastText = text;
    }
  }

  tabnum = tabindex_fruit;
  if(tabbuttons[tabnum]) {
    var num = state.fruit_stored.length + state.fruit_sacr.length;
    var text = 'fruit<br/>(' + num + ')';
    if(!state.fruit_seen) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != fruitButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      fruitButtonLastText = text;
    }
  }

  tabnum = tabindex_field2;
  if(tabbuttons[tabnum]) {
    var text = 'ethereal field';

    if(state.treelevel2 > 0) {
      text += '<br/>(' + state.treelevel2 + ')';
    }

    if(text != field2ButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      field2ButtonLastText = text;
    }
  }

  tabnum = tabindex_upgrades2;
  if(tabbuttons[tabnum]) {
    var text = 'ethereal upgrades<br/>(' + state.upgrades2_affordable + '/' + state.upgrades2_upgradable + ')';
    if(state.upgrades2_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != upgrades2ButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      upgrades2ButtonLastText = text;
    }
  }

  tabnum = tabindex_automaton;
  if(tabbuttons[tabnum]) {
    var text = 'automaton';
    if(!automatonEnabled()) {
      text += '<br>(off)';
    }

    if(text != automatonButtonLastText) {
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
      tabbuttons[tabnum].textEl.innerHTML  = text;
      automatonButtonLastText = text;
    }
  }

  tabnum = tabindex_medals;
  if(tabbuttons[tabnum]) {
    var text = 'achievements<br/>(' + state.medals_earned + ')';

    if(state.medals_new) {
      text = '<b><font color="red">' + text + '</font></b>';
    }

    if(text != medalsButtonLastText) {
      tabbuttons[tabnum].textEl.innerHTML = text;
      medalsButtonLastText = text;
      tabbuttons[tabnum].style.lineHeight = '';  // button sets that to center text, but with 2-line text that hurts the graphics instead
    }
  }
}

// Note: it depends on the state which buttons will be visible
// also creates them if they didn't exist yet, or re-creates if positions change
// TODO: avoid recreating the HTML elements if the ones that will be created are the exact same set as before
function updateTabButtons() {

  var wanted = [];
  wanted[tabindex_field] = true;
  wanted[tabindex_upgrades] = state.upgrades_unlocked > 0;
  wanted[tabindex_fruit] = state.g_numfruits > 0;
  wanted[tabindex_field2] = state.g_numresets > 0;
  wanted[tabindex_upgrades2] = state.upgrades2_unlocked > 0;
  wanted[tabindex_automaton] = haveAutomaton() || state.treelevel2 >= 2;
  wanted[tabindex_medals] = state.medals_earned > 0;

  var num = 0;
  for(var i = 0; i < wanted.length; i++) {
    if(wanted[i]) num++;
  }

  if(num == 1) {
    // if there's only one, then hide the tabs completely
    for(var i = 0; i < wanted.length; i++) {
      if(wanted[i]) wanted[i] = false;
    }
  }

  var ok = true;
  for(var i = 0; i < wanted.length; i++) {
    if(wanted[i] != (!!tabbuttons[i])) {
      ok = false;
      break;
    }
  }

  if(ok) {
    updateTabButtons2();
    return; // buttons already exactly as intended, do not recreate all these HTML elements
  }

  tabbuttons = [];
  tabFlex.div.innerHTML = '';
  var pos;
  pos = [0, 0];

  var index = 0;

  var tabDiv = tabFlex.div;

  var tabnum;

  // the order below determines the display order of the tabs

  tabnum = tabindex_field;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: field tab');
    tabbuttons[tabnum].textEl.innerText = 'field';
    tabbuttons[tabnum].id = 'field_tab';
    fieldButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_upgrades;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: upgrades tab');
    tabbuttons[tabnum].textEl.innerText = 'upgrades';
    tabbuttons[tabnum].id = 'upgrades_tab';
    upgradesButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_fruit;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: fruit tab');
    tabbuttons[tabnum].textEl.innerText = 'fruit';
    tabbuttons[tabnum].id = 'fruit_tab';
    fruitButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_field2;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: ethereal field tab');
    tabbuttons[tabnum].textEl.innerText = 'ethereal field';
    tabbuttons[tabnum].id = 'ethereal_field_tab';
    tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #ff8';
    field2ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_upgrades2;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: ethereal upgrades tab');
    tabbuttons[tabnum].textEl.innerText = 'ethereal upgrades';
    tabbuttons[tabnum].id = 'ethereal_upgrades_tab';
    tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #ff8';
    upgrades2ButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_automaton;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: ethereal field tab');
    tabbuttons[tabnum].textEl.innerText = 'automaton';
    tabbuttons[tabnum].id = 'achievements_tab';
    //tabbuttons[tabnum].textEl.style.textShadow = '0px 0px 5px #000';
    automatonButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  tabnum = tabindex_medals;
  if(wanted[tabnum]) {
    tabbuttons[tabnum] = makeDiv((100 / num * index) + '%', '0%', (100 / num) + '%', '100%', tabFlex.div);
    styleButton(tabbuttons[tabnum]);
    addButtonAction(tabbuttons[tabnum], bind(function(tabnum) { setTab(tabnum); }, tabnum), 'tab button: achievements tab');
    tabbuttons[tabnum].id = 'achievements_tab';
    tabbuttons[tabnum].textEl.innerText = 'achievements';
    medalsButtonLastText = ''; // invalidate the same-text cache, since the button is a new HTML element, the title must be set
    index++;
  }

  updateTabButtons2();

  // this is to give the buttons the correct style
  setTab(state.currentTab, true);
}



