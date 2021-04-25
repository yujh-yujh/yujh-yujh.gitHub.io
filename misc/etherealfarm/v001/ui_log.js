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


// prevent making too many HTML elements with messages, but still have a good amount
var maxMessages = 100;

var lastMessage = '';
var sameMessageCount = 1;
var lastMessageElement = undefined;

var spans = [];

// shows message in the message log
// opt_forcenew: force a new line for this message, do not compbine with previous line if same text
function showMessage(text, opt_color, opt_bgcolor, opt_forcenew) {
  //var title = util.formatDate(util.getTime());
  var title = util.formatDate(state.prevtime);
  var logDiv = logFlex.div;
  // automatically capitalize the message. Reason: consistency.
  text = util.upperCaseFirstWord(text);
  if(!opt_forcenew && text == lastMessage && lastMessageElement) {
    sameMessageCount++;
    text = lastMessage + ' (' + sameMessageCount + 'x)';
    lastMessageElement.innerHTML = text;
    lastMessageElement.title = title;
    return;
  }

  lastMessage = text;
  sameMessageCount = 1;

  var span = util.makeElement('span', logDiv);
  spans.push(span);
  span.style.display = 'block';
  span.innerHTML = text;
  span.style.color = opt_color || 'white';
  if(opt_bgcolor) span.style.backgroundColor = opt_bgcolor;
  //span.style.border = '1px solid white';
  span.style.margin = '4px';
  lastMessageElement = span;
  lastMessageElement.title = title;

  if(logDiv.childNodes.length > 100) util.removeElement(logDiv.childNodes[0]);
  // scroll to bottom so last message visible
  // TODO: only do this if not scrolled up manually by user
  logDiv.scrollTop = logDiv.scrollHeight;

  if(spans.length > maxMessages) {
    util.removeElement(spans[0]);
    spans.shift(0);
  }
}




function initMessageUI() {
  var logDiv = logFlex.div;
  logDiv.innerText = '';
  logDiv.style.overflowY = 'scroll';
  lastMessageElement = undefined;
  lastMessage = '';
  sameMessageCount = 1;

  logDiv.style.backgroundColor = '#000';
}

// Show a debug error, these should normally never happen in the released version, if they do they are a bug
function showError(text) {
  showMessage('ERROR: ' + text, 'red', 'yellow');
}


