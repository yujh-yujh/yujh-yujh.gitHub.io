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

var CROPINDEX = 16;
var FIELD_TREE_TOP = 1;
var FIELD_TREE_BOTTOM = 2;
var FIELD_REMAINDER = 3; // remainder debris of temporary plant. Counts as empty field (same as index == 0) for all purposes. Purely a visual effect, to remember that this is the spot you're using for watercress (and not accidently put a flower there or so)
var FIELD_ROCK = 4; // for challenges with rocks

// field cell
function Cell(x, y, is_ethereal) {
  // index of crop, but with different numerical values:
  // 0 = empty
  // 1..(CROPINDEX-1): special: 1=tree top, 2=tree bottom, ...
  // >= CROPINDEX: crop with crop index = this.index - CROPINDEX.
  this.index = 0;
  this.growth = 0; // 0.0-1.0: percentage completed, or 1 if fullgrown

  this.x = x;
  this.y = y;

  // only used for ethereal field. TODO: make a Cell2 class for ethereal field instead
  this.justplanted = false; // planted during this run (this transcension), so can't be deleted until next one.

  this.is_ethereal = is_ethereal;
}

Cell.prototype.isFullGrown = function() {
  if(this.index < CROPINDEX) return false; // not relevant for non-crops
  var c = this.getCrop();
  if(c.type == CROPTYPE_SHORT) return this.growth > 0;
  if(state.challenge == challenge_wither) return this.growth > 0;
  return this.growth >= 1;
};

Cell.prototype.hasCrop = function() {
  return this.index >= CROPINDEX;
};

// non-template
Cell.prototype.hasRealCrop = function() {
  return this.index >= CROPINDEX && !this.getCrop().istemplate;
};

// only valid if hasCrop()
Cell.prototype.cropIndex = function() {
  return this.index - CROPINDEX;
};

// Only valid for the basic field, not for the ethereal field.
// returns crops object if the field has a crop, undefined otherwise
// TODO: make a class Cell2 for ethereal field instead
Cell.prototype.getCrop = function() {
  if(this.index < CROPINDEX) return undefined;
  if(this.is_ethereal) return crops2[this.index - CROPINDEX];
  return crops[this.index - CROPINDEX];
};


// non-template
Cell.prototype.getRealCrop = function() {
  var result = this.getCrop();
  if(result && result.istemplate) return undefined;
  return result;
};

// is empty so that you can plant on it (rocks do not count for this)
Cell.prototype.isEmpty = function() {
  return this.index == 0 || this.index == FIELD_REMAINDER;
};

Cell.prototype.isTree = function() {
  return this.index == FIELD_TREE_BOTTOM || this.index == FIELD_TREE_TOP;
};

Cell.prototype.isTemplate = function() {
  return this.hasCrop() && this.getCrop().istemplate;
};

////////////////////////////////////////////////////////////////////////////////

function CropState() {
  this.unlocked = false;
}

function Crop2State() {
  this.unlocked = false;
}

function UpgradeState() {
  this.seen = false; // seen the upgrade in the upgrades tab
  this.seen2 = false; // seen the upgrade ever
  this.unlocked = false;
  // how many times this upgrade was done
  // if is_choice, then this is the choice instead of a count. 0 means no choice made yet, 1 means first choice, 2 means second choice.
  this.count = 0;
}

function Upgrade2State() {
  this.unlocked = false;
  // how many times this upgrade was done
  this.count = 0;
}

function MedalState() {
  this.seen = false; // seen the achievement in the achievements tab
  this.earned = false;
}

function ChallengeState() {
  this.unlocked = false;
  this.completed = 0; // whether the challenge was successfully completed, or higher values if higher versions of the challenge with extra rewards were completed
  this.num = 0; // amount of times started, whether successful or not, excluding the current one
  this.num_completed = 0; // how often, the challenge was successfully completed (excluding currently ongoing challenge, if any)
  this.num_completed2 = 0; // how often, the challenge was successfully completed to final stage, or 0 if this challenge only has 1 stage
  this.maxlevel = 0; // max level reached with this challenge (excluding the current ongoing challenge if any)
  this.besttime = 0; // best time for reaching first targetlevel, even when not resetting. If continuing the challenge for higher maxlevel, still only the time to reach targetlevel is counted, so it's the best time for completing the first main reward part of the challenge.
  this.besttime2 = 0; // best time for reaching last targetlevel, or 0 if this challenge only has 1 stage. NOTE: so best time of first and last stage are tracked, if there are more intermediate stages, those are not tracked
}

function BluePrint() {
  this.numw = 0;
  this.numh = 0;

  /*
  2D array. meaning of codes roughly matches that of fraction arrays of automaton:
  0: empty
  1: N/A, unused
  2: w: watercress
  3: b: berry
  4: m: mushroom
  5: f: flower
  6: n: nettle
  7: h: beehive
  8: i: mistletoe
  */
  this.data = [];

  this.name = '';
}

// converts blueprint type code to a blueprint crop index, or -1 if empty
BluePrint.toCrop = function(i) {
  if(i == 0) return -1;
  if(i == 2) return watercress_template;
  if(i == 3) return berry_template;
  if(i == 4) return mush_template;
  if(i == 5) return flower_template;
  if(i == 6) return nettle_template;
  if(i == 7) return bee_template;
  if(i == 8) return mistletoe_template;
  return -1;
}

BluePrint.fromCrop = function(c) {
  if(!c) return 0;
  if(c.type == CROPTYPE_SHORT) return 2;
  if(c.type == CROPTYPE_BERRY) return 3;
  if(c.type == CROPTYPE_MUSH) return 4;
  if(c.type == CROPTYPE_FLOWER) return 5;
  if(c.type == CROPTYPE_NETTLE) return 6;
  if(c.type == CROPTYPE_BEE) return 7;
  if(c.type == CROPTYPE_MISTLETOE) return 8;
  return 0;
}

BluePrint.toChar = function(i) {
  if(i == 0) return '.';
  if(i == 2) return 'W';
  if(i == 3) return 'B';
  if(i == 4) return 'M';
  if(i == 5) return 'F';
  if(i == 6) return 'N';
  if(i == 7) return 'H';
  if(i == 8) return 'I';
  return -1;
}

BluePrint.fromChar = function(c) {
  if(!c) return 0;
  c = c.toUpperCase();
  if(c == 'W') return 2;
  if(c == 'B') return 3;
  if(c == 'M') return 4;
  if(c == 'F') return 5;
  if(c == 'N') return 6;
  if(c == 'H') return 7;
  if(c == 'I') return 8;
  return 0;
}

BluePrint.copyTo = function(from, to) {
  if(!to) return;
  if(!from) {
    to.numw = 0;
    to.numh = 0;
    to.data = [];
  }
  to.numw = from.numw;
  to.numh = from.numh;
  to.data = util.clone(from.data);
  to.name = from.name;
}

BluePrint.copy = function(b) {
  var result = new BluePrint();
  BluePrint.copyTo(b, result);
  return result;
}



// all the state that should be able to get saved
function State() {
  // prevtime is used to know how much time elapsed at next tick, including after loading a savegame
  // everything in the game such work such that no matter if there was 1 tick of 100 seconds, or 100 ticks of 1 second, the result is the same (other than numerical precision possibly), and this too even if many days of duration in between
  // so that saving, and browsers pausing tabs, both have no effect on game
  this.prevtime = 0; // time of previous update frame, in fractional seconds since unix epoch

  /*
  Compensate for switching between different computers with different clocks: This handles the following scenario:
  Sombody plays the game in two locations with different computer clock or timezone: this is common (e.g. home and non-home computer): even though javascript returns UTC time so timezones shouldn't matter, it can happen that computers display the correct local time but have the wrong UTC time.
  This mechanism is not there to prevent computer clock related cheating: that is impossible to prevent in a single player game. But the 2-different-computer-clock situation is legitimate and shouldn't affect the gameplay in a bad (like ferns not spawning for hours) nor in a too good (like big production time delta) way.

  Say location B is 2 hours farther in the future than location A.
  when moving from A to B, this gives 2 hours of not-actually-deserved production bonus.
  when moving from B to A, this should in theory punish by taking away 2 hours of production bonus. However, this should not be punished: there are legit situations where this can occur.
  So the mechanism will work as follows:
  when moving from B to A, then when loading savegame you see a savegame time in the future. This time difference is added to negative_time.
  when moving from A to B, then when loading savegame, you see that more than 2 hours have passed. But, before applying the 2 hour produciton bonus, first any negative_time is subtracted from that (only partially if negative_time is even greater than this 2h)

  Side note: other things that must be done when going from B to A (going to the past, negative time delta):
  -adjust last fern time, such that it won't take hours before a fern appears
  -similar adjustments for last ability time, etc...
  */
  this.negative_time = 0;
  // total and max negative time ever seen, for debugging in case something goes wrong with this
  this.total_negative_time = 0;
  this.max_negative_time = 0;
  this.last_negative_time = 0;
  // amount of times a negative time issue happened
  this.num_negative_time = 0;

  // current time, this is usually the same as util.getTime(), but if an update() is broken into multiple pieces, then it is
  // the end of the current piece.
  // not saved. set by update(). recommended to use instead of util.getTime() for game time duration related computations such as special abilities
  this.time = 0;

  this.seed0 = -1; // if there's ever a new feature added to the game requiring a new random seed, this can be used to initialize that new seed to ensure the new seed can't be cheesed by refreshing with a savegame that didn't have the new seed yet

  this.currentTab = 0; // currently selected tab
  this.lastPlanted = -1; // for shift+plant
  this.lastPlanted2 = -1; // for shift+plant on field2

  // resources
  this.res = undefined;
  // resin that will be gained at the next soft reset, not added to res until the soft reset
  this.resin = Num(0);
  // twigs that will be gained at the next soft reset, not added to res until the soft reset
  this.twigs = Num(0);

  this.treelevel = 0;
  this.lasttreeleveluptime = 0;

  this.fern = 0; // 0 = no fern, 1 = standard fern, 2 = lucky fern
  this.fernx = 0;
  this.ferny = 0;
  this.fernres = Res(0);
  this.fern_seed = -1; // random seed for the fern drops

  // field size in amount of cells
  this.numw = 5;
  this.numh = 5;
  //what's planted and their state of the main field
  this.field = [];

  this.crops = [];
  for(var i = 0; i < registered_crops.length; i++) {
    this.crops[registered_crops[i]] = new CropState();
  }

  this.upgrades = [];
  for(var i = 0; i < registered_upgrades.length; i++) {
    this.upgrades[registered_upgrades[i]] = new UpgradeState();
  }

  this.medals = [];
  for(var i = 0; i < registered_medals.length; i++) {
    this.medals[registered_medals[i]] = new MedalState();
  }

  this.challenges = [];
  for(var i = 0; i < registered_challenges.length; i++) {
    this.challenges[registered_challenges[i]] = new ChallengeState();
  }

  // ethereal field and crops
  this.numw2 = 5;
  this.numh2 = 5;
  this.field2 = [];
  this.crops2 = [];
  for(var i = 0; i < registered_crops2.length; i++) {
    this.crops2[registered_crops2[i]] = new Crop2State();
  }
  this.treelevel2 = 0;

  this.upgrades2 = [];
  for(var i = 0; i < registered_upgrades2.length; i++) {
    this.upgrades2[registered_upgrades2[i]] = new Upgrade2State();
  }


  this.misttime = 0; // mist is unlocked if state.upgrades[upgrade_mistunlock].count
  this.suntime = 0; // similar
  this.rainbowtime = 0;

  this.lastFernTime = 0;
  this.lastBackupWarningTime = 0;

  // misc
  this.delete2tokens = delete2initial; // a resource, though not part of the Res() resources object since it's more its own special purpose thing

  // fruit
  this.fruit_seed = -1; // random seed for creating random fruits
  this.fruit_seen = false; // whether seen latest fruit drop (for red color)
  this.fruit_active = 0; // index in fruit_stored of currently active fruit
  this.fruit_stored = []; // fruits in storage that stay after transcension
  this.fruit_slots = 3; // amount of slots for fruit_stored
  this.fruit_sacr = []; // fruits outside of storage that will be sacrificed on transcension
  this.seen_seasonal_fruit = 0; // 4 flags: 1=spring fruit, 2=summer fruit, 4=autumn fruit, 8=winter fruit. For each flag, if false means never seen a seasonal fruit of that type yet. Some events here give an extra fruit slot.

  // settings
  this.notation = Num.N_LATIN; // number notation
  this.precision = 3; // precision of the numeric notation
  this.mobilemode = false;
  this.saveonexit = true; // save with the window unload event (this is different than the interval based autosave)
  this.allowshiftdelete = false; // allow deleting a crop without dialog or confirmation by shift+clicking it
  this.tooltipstyle = 1;
  this.disableHelp = false; // disable all popup help dialogs
  this.uistyle = 1; // 0=default (1), 1=light, 2=dark, 3=darkest
  this.sidepanel = 1; // 0=disabled, 1=automatic
  this.notificationsounds = [0, 0]; // index0: fern sound, index1: fullgrown sound
  this.messagelogenabled = [1, 1, 1, 1]; // index0: "game saved" message log messages, index1: tree leveling, index2: upgrades available, index3: abbreviated help

  // help dialog related
  this.help_seen = {}; // ever seen this help message at all as dialog
  this.help_seen_text = {}; // ever seen this help message at all as text
  this.help_disable = {}; // disabled this help message (available once seeing it the second time)

  // automaton
  this.automaton_enabled = true; // default is true, but is not active until you actually placed the automaton

  /*
  array of integers. unlocked automation features. If array too short, means everything behind that counts as false.
  at each index (value 0 means not yet unlocked):
  0: automation of choice upgrades
  1: automation of crop upgrades (1=basic, 2=more options enabled)
  2: automation of planting (1=basic, 2=more options enabled)
  3: automation of crop-unlock upgrades (1=unlocked. The advanced options are shared with automation of planting)
  */
  this.automaton_unlocked = [];

  this.automaton_autochoice = 0;

  /*
  for each choice upgrade:
  0 (or array too short): not yet unlocked for this choice upgrade, so nothing to set
  1: manual mode, player chooses to do the choice upgrades manually and not let automaton do it
  2: auto choose first choice
  3: auto choose second choice
  */
  this.automaton_choices = [];

  /*
  0: auto upgrades disabled
  1: auto upgrades enabled
  */
  this.automaton_autoupgrade = 0;

  /*
  fraction of resources the automaton is allowed to use for auto-upgrades, e.g. 0.1 to allow to use up to 10% of resources for auto upgrades
  meaning of each index:
  0: global, when there is no distinction made between plant types
  1: other / challenge-specific crops
  2: watercress
  3: berry
  4: mushroom
  5: flower
  6: nettle
  7: beehive
  8: mistletoe (not used for upgrade, but used for auto unlock for example in other fraction arrays below)
  */
  this.automaton_autoupgrade_fraction = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  /*
  0: auto plant disabled
  1: auto plant enabled
  */
  this.automaton_autoplant = 0;

  /*
  fraction of resources automation is allowed to use for auto-plant
  the indices are the same as for automaton_autoupgrade_fraction, even though some are unused (e.g. watercress)
  */
  this.automaton_autoplant_fraction = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];

  /*
  0: autounlock disabled
  1: autounlock enabled, but only if also autoplant is enabled
  */
  this.automaton_autounlock = 0;
  this.automaton_autounlock_copy_plant_fraction = false;
  this.automaton_autounlock_fraction = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  this.automaton_autounlock_max_cost = Num(0);

  // challenges
  this.challenge = 0;

  // saved stats, global across all runs
  this.g_numresets = 0; // amount of soft resets done, non-challenge
  this.g_numsaves = 0;
  this.g_numautosaves = 0;
  this.g_numloads = 0;
  this.g_numimports = 0;
  this.g_numexports = 0;
  this.g_lastexporttime = 0; // last save export time, to give warnings
  this.g_lastimporttime = 0; // last save import time, for those same warnings
  this.g_nummedals = 0; // TODO: nothing actually increments this yet! increment whenever new medal achieved.
  this.g_treelevel = 0; // max tree level of any run
  this.g_numplanted2 = 0;
  this.g_numunplanted2 = 0;
  this.g_numupgrades2 = 0;
  this.g_numupgrades2_unlocked = 0;
  this.g_numfullgrown2 = 0;
  this.g_seasons = 0; // season changes actually seen (a savegame from multiple days ago counts as only 1)
  this.g_resin_from_transcends = Num(0); // this is likely the same value as g_res.resin, but is a separate counter for amount of resin ever earned from transcends in case it's needed for recovery in transcension-changing game updates
  this.g_delete2tokens = 0; // global count of ethereal deletion tokens received, this is not the actual recource but a stat
  this.g_fastestrun = 0; // runtime of fastest transcension
  this.g_slowestrun = 0; // runtime of slowest transcension
  this.g_fastestrun2 = 0; // as measured on wall clock instead of the runtime that gets deltas added each time
  this.g_slowestrun2 = 0;
  this.g_numresets_challenge = 0; // amount of soft resets done after a challenge, excluding g_numresets_challenge_0
  this.g_numresets_challenge_0 = 0; // amount of challenges quit immediately, before tree leveled even to level 1, so these do not count for stats, not even num runs of a challenge
  this.g_numresets_challenge_10 = 0; // amount of soft resets done after a challenge where at least level 10 was reached, so that it can be counted as at least as good as a regular g_numresets value
  this.g_p_treelevel = 0; // max tree level of any run, but not including the current run

  this.g_starttime = 0; // starttime of the game (when first run started)
  this.g_runtime = 0; // this would be equal to getTime() - g_starttime if game-time always ran at 1x (it does, except if pause or boosts would exist)
  this.g_numticks = 0;
  this.g_res = Res(); // total resources gained, all income ever without subtracting costs, including both production and one-time income
  this.g_max_res = Res(); // max resources ever had
  this.g_max_prod = Res(); // max displayed resource/second gain ever had (production, this excludes immediate resources such as from ferns)
  this.g_numferns = 0;
  this.g_numplantedshort = 0; // amount of short-lived plants planted
  this.g_numplanted = 0; // amount of plants planted on a field
  this.g_numfullgrown = 0; // very similar to numplanted, but for full grown plants
  this.g_numunplanted = 0; // amount of plants deleted from a field
  this.g_numupgrades = 0; // upgrades performed
  this.g_numupgrades_unlocked = 0; // upgrades unlocked but not yet necessarily performed
  this.g_numabilities = 0; // weather abilities ran
  this.g_numfruits = 0; // fruits received
  this.g_numfruitupgrades = 0;
  this.g_numautoupgrades = 0; // upgrades done with automaton. These are also counted in the standard g_numupgrades as well.
  this.g_numautoplant = 0;
  this.g_numautodelete = 0;
  this.g_numfused = 0;
  this.g_res_hr_best = Res();
  this.g_res_hr_at = Res();
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for previous reset (to compare with current one)
  this.p_treelevel = 0;

  this.p_starttime = 0; // starttime of previous run
  this.p_runtime = 0;
  this.p_numticks = 0;
  this.p_res = Res();
  this.p_max_res = Res();
  this.p_max_prod = Res();
  this.p_numferns = 0;
  this.p_numplantedshort = 0;
  this.p_numplanted = 0;
  this.p_numfullgrown = 0;
  this.p_numunplanted = 0;
  this.p_numupgrades = 0;
  this.p_numupgrades_unlocked = 0;
  this.p_numabilities = 0;
  this.p_numfruits = 0;
  this.p_numfruitupgrades = 0;
  this.p_numautoupgrades = 0;
  this.p_numautoplant = 0;
  this.p_numautodelete = 0;
  this.p_numfused = 0;
  this.p_res_hr_best = Res();
  this.p_res_hr_at = Res();
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // saved stats, for current reset only
  this.c_starttime = 0; // starttime of current run
  this.c_runtime = 0;
  this.c_numticks = 0;
  this.c_res = Res();
  this.c_max_res = Res();
  this.c_max_prod = Res();
  this.c_numferns = 0;
  this.c_numplantedshort = 0;
  this.c_numplanted = 0;
  this.c_numfullgrown = 0;
  this.c_numunplanted = 0;
  this.c_numupgrades = 0;
  this.c_numupgrades_unlocked = 0;
  this.c_numabilities = 0;
  this.c_numfruits = 0;
  this.c_numfruitupgrades = 0;
  this.c_numautoupgrades = 0;
  this.c_numautoplant = 0;
  this.c_numautodelete = 0;
  this.c_numfused = 0;
  this.c_res_hr_best = Res();
  this.c_res_hr_at = Res();
  // WHEN ADDING FIELDS HERE, UPDATE THEM ALSO IN softReset()!

  // progress stats, most recent stat at the end
  this.reset_stats_level = []; // reset at what tree level for each reset
  this.reset_stats_level2 = []; // tree level 2 at end of this run
  this.reset_stats_time = []; // approximate time of this run
  this.reset_stats_total_resin = []; // approximate total resin earned in total before start of this run
  this.reset_stats_resin = []; // approximate resin earned during this run
  this.reset_stats_twigs = []; // approximate twigs earned during this run
  this.reset_stats_challenge = []; // what type of challenge, if any, for this run


  // array of BluePrint objects
  this.blueprints = [];

  // temp variables for visual effect, not to be saved
  this.automatonx = 0; // for the visual planting effect
  this.automatony = 0;
  this.automatonfieldtime = 0; // for the visual planting effect

  // amount of fields with nothing on them (index 0)
  // derived stat, not to be saved
  this.numemptyfields = 0;
  this.numemptyfields2 = 0;

  // amount of fields with a crop on them (hasRealCrop(), special types 1<=index<CROPINDEX are not counted)
  // includes growing ones, excludes templates
  // derived stat, not to be saved
  this.numcropfields = 0;
  this.numcropfields2 = 0;

  // fullgrown only, not growing, any type >= CROPINDEX. Includes shoft-lived plants.
  // derived stat, not to be saved
  this.numfullgrowncropfields = 0;
  this.numfullgrowncropfields2 = 0;

  // like numfullgrowncropfields but excluding short lived crops
  // derived stat, not to be saved
  this.numfullpermanentcropfields = 0;

  // amount of plants of this type planted in fields, including newly still growing ones, and excluding templates for croptypecount
  // derived stat, not to be saved
  this.cropcount = [];
  this.crop2count = [];
  this.croptypecount = [];

  // amount of fully grown plants of this type planted in fields
  // does not include partially growing ones, nor templates
  // derived stat, not to be saved
  this.fullgrowncropcount = [];
  this.growingcropcount = [];
  this.fullgrowncrop2count = [];
  this.fullgrowncroptypecount = [];
  this.growingcroptypecount = [];

  // count of non-crop fields, such as fern
  this.specialfieldcount = [];
  this.specialfield2count = [];

  // amount of upgrades ever had available (whether upgraded/exhausted or not doesn't matter, it's about being visible, available for research, at all)
  // derived stat, not to be saved
  this.upgrades_unlocked = 0;
  this.upgrades2_unlocked = 0;

  // amount of upgrades available now, for upgrade, so unlocked, but not yet already upgraded or exhausted (but doesn't matter whether can afford)
  this.upgrades_upgradable = 0;
  this.upgrades2_upgradable = 0;

  // like upgrades_upgradable, but only those you can afford
  this.upgrades_affordable = 0;
  this.upgrades2_affordable = 0;

  // amount of new upgrades of which you haven't yet seen the name in the upgrades tab
  // derived stat, not to be saved
  this.upgrades_new = 0;
  this.upgrades2_new = 0;

  // derived stat, not to be saved
  this.medals_earned = 0;

  // amount of achievements earned but not yet seen in the achievements tab
  // derived stat, not to be saved
  this.medals_new = 0;

  // Global production multiplier from all metals
  // derived stat, not to be saved.
  this.medal_prodmul = Num(1);

  // bonuses from ethereal crops to basic crops
  // derived stat, not to be saved.
  this.ethereal_berry_bonus = Num(0);
  this.ethereal_mush_bonus = Num(0);
  this.ethereal_flower_bonus = Num(0);
  this.ethereal_nettle_bonus = Num(0);

  // derived stat, not to be saved.
  this.challenges_unlocked = 0;
  this.challenges_completed = 0; // completed at least 1 stage
  this.challenges_completed2 = 0; // completed all stages
  this.challenges_completed3 = 0; // stages completed

  // how many mistletoes are correctly touching the tree
  // computed by precomputeField
  // derived stat, not to be saved.
  this.mistletoes = 0;

  // for bee challenge only, how many worker bees bonus is being applied to the world
  // derived stat, not to be saved.
  this.workerbeeboost = Num(0);

  // total production bonus from all challenges
  // derived stat, not to be saved.
  this.challenge_bonus = Num(0);

  // how many challenges are unlocked but never attempted
  // derived stat, not to be saved.
  this.untriedchallenges = 0;

  // highest/lowest tier crop of this croptype on the basic field, including growing ones
  // NOTE: may be -1 (template) or -Infinity (no crop at all), in that case does not refer to a valid crop
  // derived stat, not to be saved.
  this.highestoftypeplanted = [];
  this.lowestoftypeplanted = [];

  // higest tier unlocked by research for this croptype
  // NOTE: may be -1 (template) or -Infinity (no crop at all), in that case does not refer to a valid crop
  // derived stat, not to be saved.
  this.highestoftypeunlocked = [];
  this.highestoftype2unlocked = [];
}

function clearField(state) {
  state.field = [];
  for(var y = 0; y < state.numh; y++) {
    state.field[y] = [];
    for(var x = 0; x < state.numw; x++) {
      state.field[y][x] = new Cell(x, y, false);
    }
  }
  var treex = Math.floor((state.numw - 1) / 2); // for even field size, tree will be shifted to the left, not the right.
  var treey = Math.floor(state.numh / 2);
  state.field[treey][treex].index = FIELD_TREE_BOTTOM;
  state.field[treey - 1][treex].index = FIELD_TREE_TOP;
}

function clearField2(state) {
  state.field2 = [];
  for(var y = 0; y < state.numh2; y++) {
    state.field2[y] = [];
    for(var x = 0; x < state.numw2; x++) {
      state.field2[y][x] = new Cell(x, y, true);
    }
  }
  var treex2 = Math.floor((state.numw2 - 1) / 2); // for even field size, tree will be shifted to the left, not the right.
  var treey2 = Math.floor(state.numh2 / 2);
  state.field2[treey2][treex2].index = FIELD_TREE_BOTTOM;
  state.field2[treey2 - 1][treex2].index = FIELD_TREE_TOP;
}

function changeFieldSize(state, w, h) {
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at floor((w-1) / 2) horizontally, floor(h/2) vertically.
  // w and h should be larger than state.numw and state.numh respectively
  // the center tile is the tile with the tree bottom half
  var xs = (((state.numw + 1) >> 1) - ((w + 1) >> 1));
  var ys = ((state.numh >> 1) - (h >> 1));
  var field = [];
  for(var y = 0; y < h; y++) {
    field[y] = [];
    for(var x = 0; x < w; x++) {
      var x2 = x + xs;
      var y2 = y + ys;
      field[y][x] = (x2 >= 0 && x2 < state.numw && y2 >= 0 && y2 < state.numh) ? state.field[y2][x2] : new Cell(x, y, false);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field = field;
  state.numw = w;
  state.numh = h;

  state.fernx -= xs;
  state.ferny -= ys;
}

function changeField2Size(state, w, h) {
  // this shift is designed such that the center tile of the old field will stay in the center, and in case of
  // even sizes will be at floor((w-1) / 2) horizontally, floor(h/2) vertically.
  // w and h should be larger than state.numw and state.numh respectively
  // the center tile is the tile with the tree bottom half
  var xs = (((state.numw2 + 1) >> 1) - ((w + 1) >> 1));
  var ys = ((state.numh2 >> 1) - (h >> 1));
  var field = [];
  for(var y = 0; y < h; y++) {
    field[y] = [];
    for(var x = 0; x < w; x++) {
      var x2 = x + xs;
      var y2 = y + ys;
      field[y][x] = (x2 >= 0 && x2 < state.numw2 && y2 >= 0 && y2 < state.numh2) ? state.field2[y2][x2] : new Cell(x, y, true);
      field[y][x].x = x;
      field[y][x].y = y;
    }
  }
  state.field2 = field;
  state.numw2 = w;
  state.numh2 = h;

  state.fernx -= xs;
  state.ferny -= ys;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function createInitialState() {
  var state = new State();

  //state.res = Res({seeds:15}); // NOTE: ensure to start with a bit more than needed for first plant, numerical precision in plant cost computation could make it cost 10.000001 instead of 10
  state.res = Res({});

  clearField(state);
  clearField2(state);


  state.crops[short_0].unlocked = true;


  state.g_starttime = util.getTime();
  state.c_starttime = state.g_starttime;
  state.g_lastexporttime = state.g_starttime;
  state.g_lastimporttime = state.g_starttime;

  computeDerived(state);
  state.seed0 = Math.floor(Math.random() * 281474976710656);
  state.fruit_seed = Math.floor(Math.random() * 281474976710656);
  state.fern_seed = Math.floor(Math.random() * 281474976710656);

  return state;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// stats derived from the state. These should not be saved in a savegame. They can be recomputed from the
// state every now and then (e.g. every upgrade)
// this allows getting some stats, such as unlock conditions for upgrades, in a slightly cheaper way than computing it on the fly for every upgrade check
function computeDerived(state) {

  // field
  state.numemptyfields = 0;
  state.numcropfields = 0;
  state.numfullgrowncropfields = 0;
  state.numfullpermanentcropfields = 0;
  state.fullgrowncropcount = [];
  state.growingcropcount = [];
  state.cropcount = [];
  state.fullgrowncroptypecount = [];
  state.growingcroptypecount = [];
  state.croptypecount = [];
  state.highestoftypeplanted = [];
  state.lowestoftypeplanted = [];
  state.highestoftypeunlocked = [];
  state.highestoftype2unlocked = [];
  for(var i = 0; i < registered_crops.length; i++) {
    state.cropcount[registered_crops[i]] = 0;
    state.fullgrowncropcount[registered_crops[i]] = 0;
    state.growingcropcount[registered_crops[i]] = 0;
  }
  for(var i = 1; i < CROPINDEX; i++) {
    state.specialfieldcount[i] = 0;
  }
  for(var i = 0; i < NUM_CROPTYPES; i++) {
    state.fullgrowncroptypecount[i] = 0;
    state.growingcroptypecount[i] = 0;
    state.croptypecount[i] = 0;
    state.highestoftypeplanted[i] = -Infinity;
    state.lowestoftypeplanted[i] = Infinity;
    state.highestoftypeunlocked[i] = -Infinity;
    state.highestoftype2unlocked[i] = -Infinity;
  }
  for(var y = 0; y < state.numh; y++) {
    for(var x = 0; x < state.numw; x++) {
      var f = state.field[y][x];
      if(f.hasCrop()) {
        var c = f.getCrop();
        state.cropcount[c.index]++;
        if(f.isFullGrown()) {
          state.fullgrowncropcount[c.index]++;
        }
        state.growingcropcount[c.index] += Math.min(Math.max(0, f.growth), 1);
        if(!f.isTemplate()) {
          state.numcropfields++;
          state.croptypecount[c.type]++;
          if(f.isFullGrown()) {
            state.fullgrowncroptypecount[c.type]++;
            state.numfullgrowncropfields++;
            if(c.type != CROPTYPE_SHORT) state.numfullpermanentcropfields++;
          }
          state.growingcroptypecount[c.type] += Math.min(Math.max(0, f.growth), 1);
        }
        state.highestoftypeplanted[c.type] = Math.max(c.tier || 0, state.highestoftypeplanted[c.type]);
        state.lowestoftypeplanted[c.type] = Math.min(c.tier || 0, state.lowestoftypeplanted[c.type]);
      } else if(f.index == 0 || f.index == FIELD_REMAINDER) {
        state.numemptyfields++;
      } else {
        state.specialfieldcount[f.index]++;
      }
    }
  }

  // field2
  state.numemptyfields2 = 0;
  state.numcropfields2 = 0;
  state.numfullgrowncropfields2 = 0;
  state.fullgrowncrop2count = [];
  state.crop2count = [];
  for(var i = 0; i < registered_crops2.length; i++) {
    state.crop2count[registered_crops2[i]] = 0;
    state.fullgrowncrop2count[registered_crops2[i]] = 0;
  }
  for(var i = 1; i < CROPINDEX; i++) {
    state.specialfield2count[i] = 0;
  }
  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      if(f.hasCrop()) {
        var c = crops2[f.cropIndex()];
        state.crop2count[c.index]++;
        if(!f.isTemplate()) {
          state.numcropfields2++;
          if(f.growth >= 1) {
            state.fullgrowncrop2count[c.index]++;
            state.numfullgrowncropfields2++;
          }
        }
      } else if(f.index == 0) {
        state.numemptyfields2++;
      } else {
        state.specialfield2count[f.index]++;
      }
    }
  }

  state.upgrades_unlocked = 0;
  state.upgrades_new = 0;
  state.upgrades_upgradable = 0;
  state.upgrades_affordable = 0;
  state.upgrades2_unlocked = 0;
  state.upgrades2_new = 0;
  state.upgrades2_upgradable = 0;
  state.upgrades2_affordable = 0;

  for(var i = 0; i < registered_upgrades.length; i++) {
    var u = upgrades[registered_upgrades[i]];
    var u2 = state.upgrades[registered_upgrades[i]];
    if(u2.unlocked) {
      state.upgrades_unlocked++;
      if(!u2.seen && !u2.count) state.upgrades_new++;
      if(!u.isExhausted()) {
        state.upgrades_upgradable++; // same as u.canUpgrade()
        if(u.getCost().le(state.res)) state.upgrades_affordable++;
      }
    }
  }

  for(var i = 0; i < registered_crops.length; i++) {
    var c = crops[registered_crops[i]];
    var c2 = state.crops[registered_crops[i]];
    if(c2.unlocked) {
      state.highestoftypeunlocked[c.type] = Math.max(c.tier || 0, state.highestoftypeunlocked[c.type]);
    }
  }

  for(var i = 0; i < registered_crops2.length; i++) {
    var c = crops2[registered_crops2[i]];
    var c2 = state.crops2[registered_crops2[i]];
    if(c2.unlocked) {
      state.highestoftype2unlocked[c.type] = Math.max(c.tier || 0, state.highestoftype2unlocked[c.type]);
    }
  }

  for(var i = 0; i < registered_upgrades2.length; i++) {
    var u = upgrades2[registered_upgrades2[i]];
    var u2 = state.upgrades2[registered_upgrades2[i]];
    if(u2.unlocked) {
      state.upgrades2_unlocked++;
      if(!u2.seen) state.upgrades2_new++;
      if(!u.isExhausted()) {
        state.upgrades2_upgradable++; // same as u2.canUpgrade()
        if(u.getCost().le(state.res)) state.upgrades2_affordable++;
      }
    }
  }

  state.medals_earned = 0;
  state.medals_new = 0;

  state.medal_prodmul = Num(1); // global medal production multiplier

  for(var i = 0; i < registered_medals.length; i++) {
    var m = medals[registered_medals[i]];
    var m2 = state.medals[registered_medals[i]];
    if(m2.earned) {
      state.medals_earned++;
      if(!m2.seen) state.medals_new++;
      state.medal_prodmul.addInPlace(m.prodmul);
    }
  }

  //////////////////////////////////////////////////////////////////////////////

  state.ethereal_berry_bonus = Num(0);
  state.ethereal_mush_bonus = Num(0);
  state.ethereal_flower_bonus = Num(0);
  state.ethereal_nettle_bonus = Num(0);

  for(var y = 0; y < state.numh2; y++) {
    for(var x = 0; x < state.numw2; x++) {
      var f = state.field2[y][x];
      var c = f.getCrop();
      if(!!c && f.growth >= 1) {
        var type = c.type;
        if(type == CROPTYPE_BERRY) {
          state.ethereal_berry_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_MUSH) {
          state.ethereal_mush_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_FLOWER) {
          state.ethereal_flower_bonus.addInPlace(c.getBasicBoost(f));
        }
        if(type == CROPTYPE_NETTLE) {
          state.ethereal_nettle_bonus.addInPlace(c.getBasicBoost(f));
        }
      }
    }
  }
  //////////////////////////////////////////////////////////////////////////////

  for(var i = 0; i < state.fruit_stored.length; i++) state.fruit_stored[i].slot = i;
  for(var i = 0; i < state.fruit_sacr.length; i++) state.fruit_sacr[i].slot = i + 100;

  //////////////////////////////////////////////////////////////////////////////

  state.challenges_unlocked = 0;
  state.challenges_completed = 0;
  state.challenges_completed2 = 0;
  state.challenges_completed3 = 0;
  state.challenge_bonus = Num(0);
  state.untriedchallenges = 0;
  for(var i = 0; i < registered_challenges.length; i++) {
    var index = registered_challenges[i];
    var c = challenges[index];
    var c2 = state.challenges[index];
    if(c2.unlocked) state.challenges_unlocked++;
    if(c2.completed) {
      state.challenges_completed++;
      if(c.fullyCompleted()) state.challenges_completed2++;
      state.challenges_completed3 += c2.completed;
    }
    if(c2.unlocked && c2.num == 0 && state.challenge != c.index) {
      state.untriedchallenges++;
    }
    if(c2.maxlevel > 0) {
      state.challenge_bonus.addInPlace(getChallengeBonus(index, c2.maxlevel));
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

function Fruit() {
  // type 0: apple, no seasonality
  // type 1: apricot, spring
  // type 2: pineapple, summer
  // type 3: pear, autumn
  // type 4: medlar, winter
  this.type = 0;
  this.tier = 0;
  this.abilities = []; // array of the FRUIT_... abilities

  // how much the abilities have been leveled
  // must be at least 1 for any ability, 0 is equivalent to not having the ability at all.
  this.levels = [];

  // free starting level of each ability
  this.starting_levels = [];

  // for fused fruits: charge of each ability. 0: normal, 1: charged, 2: fusible
  this.charge = [];

  // how many fuse-fruit actions were involved in this fruit
  this.fuses = 0;

  this.essence = Num(0); // how much essence was already spent on upgrading this fruit

  this.mark = 0; // mark as favorite etc...

  // the slot in which this fruit is: 0 for the active slot, 10+ storage slots, and 100+ for sacrificial slots
  // not saved, this must be updated to match the slot the fruit is placed in, this is cache for fast reverse lookup only
  this.slot = 0;

  // override standard name like 'electrum apple' with custom name
  this.name = '';

  this.typeName = function() {
    return ['apple', 'apricot (spring)', 'pineapple (summer)', 'pear (autumn)', 'medlar (winter)'][this.type];
  };

  this.toString = function() {
    if(this.name) return this.name;
    return tierNames[this.tier] + ' ' + this.typeName();
  };

  this.abilityToString = function(i, opt_abbreviated, opt_nolevels) {
    var result = '';
    result += getFruitAbilityName(this.abilities[i], opt_abbreviated);
    if(this.abilities[i] != FRUIT_NONE) {
      if(!opt_nolevels && !isInherentAbility(this.abilities[i])) result += ' ' + util.toRoman(this.levels[i]);
      if(!opt_nolevels && this.charge[i] == 1) result += ' [*]';
      if(!opt_nolevels && this.charge[i] == 2) result += ' [**]';
    }
    return result;
  };

  this.abilitiesToString = function(opt_abbreviated, opt_nolevels) {
    var result = '';
    for(var i = 0; i < this.abilities.length; i++) {
      if(i > 0) result += ', ';
      result += this.abilityToString(i, opt_abbreviated, opt_nolevels);
    }
    return result;
  };
}

function getActiveFruit() {
  if(state.fruit_active >= state.fruit_stored.length) return undefined;
  return state.fruit_stored[state.fruit_active];
}

// returns the level of a specific fruit ability, or 0 if you don't have that ability
function getFruitAbility(ability) {
  var f = getActiveFruit();
  if(!f) return 0;
  for(var i = 0; i < f.abilities.length; i++) {
    if(f.abilities[i] == ability) return f.levels[i];
  }

  return 0;
}

function getFruitTier() {
  var f = getActiveFruit();
  if(!f) return 0;
  return f.tier;
}

// slot is 0..99 for stored, 100+ for sacrificial pool
// returns undefined if no fruit in that slot
function getFruit(slot) {
  if(slot < 100) {
    return state.fruit_stored[slot];
  }
  return state.fruit_sacr[slot - 100];
}

// set f to something falsy to unset the fruit
// will shift/resize arrays to fit the updated collection
function setFruit(slot, f) {
  if(slot < 100) {
    var j = slot;
    if(f) {
      if(j > state.fruit_stored.length) j = state.fruit_stored.length;
      state.fruit_stored[j] = f;
      f.slot = j;
    } else {
      for(var i = j; i + 1 < state.fruit_stored.length; i++) {
        state.fruit_stored[i] = state.fruit_stored[i + 1];
        state.fruit_stored[i].slot = i;
      }
      state.fruit_stored.length = state.fruit_stored.length - 1;
    }
  } else {
    var j = slot - 100;
    if(f) {
      if(j > state.fruit_sacr.length) j = state.fruit_sacr.length;
      state.fruit_sacr[j] = f;
      f.slot = j + 100;
    } else {
      for(var i = j; i + 1 < state.fruit_sacr.length; i++) {
        state.fruit_sacr[i] = state.fruit_sacr[i + 1];
        state.fruit_sacr[i].slot = i + 100;
      }
      state.fruit_sacr.length = state.fruit_sacr.length - 1;
    }
  }
}

function getUpcomingFruitEssence() {
  var res = Res();
  for(var j = 0; j < state.fruit_sacr.length; j++) res.addInPlace(getFruitSacrifice(state.fruit_sacr[j]));
  return res;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// get upcoming resin, excluding the higher transcenscion bonus multiplier
function getUpcomingResin() {
  var suppress = false; // more resin suppressed by challenge
  if(state.challenge && !challenges[state.challenge].allowsresin) suppress = true;
  if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) suppress = true;

  var result = Num(state.resin);
  if(state.treelevel >= min_transcension_level && !suppress) {
    var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
    if(progress.gtr(1)) progress = Num(1);
    if(progress.ltr(0)) progress = Num(0);
    progress = progress.mulr(0.97); // make leveling cause a slight jump anyway, mostly such that the resin/hr stat will be higher after rather than before the leveling
    var next = nextTreeLevelResin();
    result.addInPlace(progress.mul(next));
  }
  return result;
}

// get upcoming twigs, excluding the higher transcenscion bonus multiplier
function getUpcomingTwigs() {
  var suppress = false; // more twigs suppressed by challenge
  if(state.challenge && !challenges[state.challenge].allowstwigs) suppress = true;
  if(state.challenge && state.treelevel > state.g_treelevel && !state.challenge.allowbeyondhighestlevel) suppress = true;

  var result = Num(state.twigs);
  if(state.treelevel >= min_transcension_level && !suppress) {
    var progress = state.res.spores.div(treeLevelReq(state.treelevel + 1).spores);
    if(progress.gtr(1)) progress = Num(1);
    if(progress.ltr(0)) progress = Num(0);
    progress = progress.mulr(0.97); // make leveling cause a slight jump anyway, mostly such that the resin/hr stat will be higher after rather than before the leveling
    var next = nextTwigs().twigs;
    result.addInPlace(progress.mul(next));
  }
  return result;
}

// returns resin per hour so far this run
function getResinHour() {
  if(state.c_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.c_runtime / 3600;
  if(!hours) return Num(0);
  return getUpcomingResin().divr(hours);
}

// returns twigs per hour so far this run
function getTwigsHour() {
  if(state.c_runtime < 2) return Num(0); // don't count the first seconds to avoid possible huge values
  var hours = state.c_runtime / 3600;
  if(!hours) return Num(0);
  return getUpcomingTwigs().divr(hours);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function haveAutomaton() {
  return !!state.crop2count[automaton2_0];
}

function automatonEnabled() {
  return haveAutomaton() && state.automaton_enabled;
}

function autoChoiceEnabled() {
  if(!automatonEnabled()) return false;
  if(!state.automaton_unlocked[0]) return false;
  return !!state.automaton_autochoice;
}

function autoUpgradesEnabled() {
  if(!automatonEnabled()) return false;
  if(!state.automaton_unlocked[1]) return false;
  return !!state.automaton_autoupgrade;
}

function autoPlantEnabled() {
  if(!automatonEnabled()) return false;
  if(!state.automaton_unlocked[2]) return false;
  return !!state.automaton_autoplant;
}

function autoUnlockEnabled() {
  if(!automatonEnabled()) return false;
  if(!state.automaton_unlocked[3]) return false;
  if(!autoPlantEnabled()) return false; // auto unlock also gets disabled when auto plant is disabled
  return !!state.automaton_autounlock;
}
