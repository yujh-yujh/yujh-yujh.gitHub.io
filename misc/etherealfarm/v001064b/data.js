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

// The game data: definition of upgrades, crops, ...

var seasonNames = ['spring', 'summer', 'autumn', 'winter'];

var croptype_index = 0;
var CROPTYPE_BERRY = croptype_index++;
var CROPTYPE_MUSH = croptype_index++;
var CROPTYPE_FLOWER = croptype_index++;
var CROPTYPE_NETTLE = croptype_index++;
var CROPTYPE_SHORT = croptype_index++;
var CROPTYPE_AUTOMATON = croptype_index++;
var CROPTYPE_LOTUS = croptype_index++; // ethereal field only, this is an ethereal crop that boost their ethereal neighbors, so a flower type, but regular flowers in ethereal field boost the basic field flowers instead
var CROPTYPE_MISTLETOE = croptype_index++;
var CROPTYPE_BEE = croptype_index++; // boosts flowers
var CROPTYPE_CHALLENGE = croptype_index++; // only exists for challenges
var CROPTYPE_FERN2 = croptype_index++; // ethereal fern, giving starter money
var NUM_CROPTYPES = croptype_index;

function getCropTypeName(type) {
  if(type == CROPTYPE_BERRY) return 'berry';
  if(type == CROPTYPE_MUSH) return 'mushroom';
  if(type == CROPTYPE_FLOWER) return 'flower';
  if(type == CROPTYPE_NETTLE) return 'nettle';
  if(type == CROPTYPE_SHORT) return 'short-lived';
  if(type == CROPTYPE_AUTOMATON) return 'automaton';
  if(type == CROPTYPE_LOTUS) return 'lotus';
  if(type == CROPTYPE_MISTLETOE) return 'mistletoe';
  if(type == CROPTYPE_BEE) return 'beehive';
  if(type == CROPTYPE_CHALLENGE) return 'challenge';
  if(type == CROPTYPE_FERN2) return 'fern';
  return 'unknown';
}

// opt_crop is cropid for specific crop in case it has a slightly different description
function getCropTypeHelp(type, opt_no_nettles) {
  switch(type) {
    case CROPTYPE_BERRY: return 'Produces seeds. Boosted by flowers. ' + (opt_no_nettles ? '' : 'Negatively affected by nettles. ') + 'Neighboring mushrooms can consume its seeds to produce spores. Neighboring watercress can copy its production.';
    case CROPTYPE_MUSH: return 'Requires berries as neighbors to consume seeds to produce spores. Boosted by flowers' + (opt_no_nettles ? '' : ' and nettles') + '. Neighboring watercress can copy its production (but also consumption).';
    case CROPTYPE_FLOWER: return 'Boosts neighboring berries and mushrooms, their production but also their consumption.' + (opt_no_nettles ? '' : ' Negatively affected by neighboring nettles.');
    case CROPTYPE_NETTLE: return 'Boosts neighboring mushrooms spores production (without increasing seeds consumption), but negatively affects neighboring berries and flowers, so avoid touching those with this plant';
    case CROPTYPE_SHORT: return 'Produces a small amount of seeds on its own, but can produce much more resources by copying from berry and mushroom neighbors once you have those';
    case CROPTYPE_MISTLETOE: return 'Produces twigs when tree levels up, when orthogonally next to the tree only. Having more than one increases level up spores requirement and slightly decreases resin gain.';
    case CROPTYPE_BEE: return 'Boosts orthogonally neighboring flowers. Since this is a boost of a boost, indirectly boosts berries and mushrooms by an entirely new factor.';
    case CROPTYPE_CHALLENGE: return 'A type of crop specific to a challenge, not available in regular runs.';
    case CROPTYPE_FERN2: return 'Ethereal fern, giving starter resources';
  }
  return undefined;
}

var fern_wait_minutes = 2; // default fern wait minutes (in very game they go faster)


// apply bonuses that apply to all weather ability waits
function adjustWait(result) {
  if(state.upgrades[active_choice0].count == 1) result *= 2;

  // FRUIT_COOLDOWN effect was removed, but code kept to copypaste some different future upgrade that'd do this from.
  /*var level = getFruitAbility(FRUIT_COOLDOWN);
  if(level > 0) {
    var mul = Num(1).sub(getFruitBoost(FRUIT_COOLDOWN, level, getFruitTier())).valueOf();
    result *= mul;
  }*/

  return result;
}

function getWeatherBoost() {
  var result = Num(1);

  var level = getFruitAbility(FRUIT_WEATHER);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_WEATHER, level, getFruitTier()));
    result.mulInPlace(mul);
  }
  return result;
}

////////////////////////////////////////////////////////////////////////////////

var sun_duration = 2 * 60;
var sun_wait = 10 * 60 + sun_duration;

function getSunDuration() {
  var result = sun_duration;
  if(state.upgrades[active_choice0].count == 1) result *= 2;
  return result;
}

function getSunWait() {
  var result = sun_wait;

  result = adjustWait(result);

  return result;
}

////////////////////////////////////////////////////////////////////////////////

var mist_duration = 3 * 60;
var mist_wait = 15 * 60 + mist_duration;

function getMistDuration() {
  var result = mist_duration;
  if(state.upgrades[active_choice0].count == 1) result *= 2;
  return result;
}

function getMistWait() {
  var result = mist_wait;
  result = adjustWait(result);
  return result;
}

////////////////////////////////////////////////////////////////////////////////

var rainbow_duration = 4 * 60;
var rainbow_wait = 20 * 60 + rainbow_duration;

function getRainbowDuration() {
  var result = rainbow_duration;
  if(state.upgrades[active_choice0].count == 1) result *= 2;
  return result;
}

function getRainbowWait() {
  var result = rainbow_wait;
  result = adjustWait(result);
  return result;
}

////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop() {
  this.name = 'a';
  this.cost = Res(); // one-time cost (do not use directly, use getCost() to get all multipliers taken into account)
  this.prod = Res(); // production per second (do not use directly, use getProd() to get all multipliers taken into account)
  this.index = 0; // index in the crops array
  this.planttime = 0; // in seconds
  // how much this boosts neighboring crops, 0 means no boost, 1 means +100%, etc... (do not use directly, use getBoost() to get all multipliers taken into account)
  // meaning depends on crop type, e.g. for beehives this is boostboost instead, challenge specific crops may use this value, ...
  this.boost = Num(0);
  this.tagline = '';

  this.basic_upgrade = null; // id of registered upgrade that does basic upgrades of this plant

  this.image = undefined;

  this.type = undefined;
  this.tier = 0;

  this.istemplate = false; // if true, is a placeholder template
};

var sameTypeCostMultiplier = 1.5;
var sameTypeCostMultiplier_Flower = 2;
var sameTypeCostMultiplier_Short = 1;
var cropRecoup = 0.33;  // recoup for deleting a plant. It is only partial, the goal of the game is not to replace plants often

// ethereal version
var sameTypeCostMultiplier2 = 1.5;
var sameTypeCostMultiplier_Lotus2 = 2;
var sameTypeCostMultiplier_Fern2 = 1.5;
var cropRecoup2 = 1.0; // 100% resin recoup. But deletions are limited through max amount of deletions per season instead

//for state.delete2tokes
var delete2initial = 4; // how many deletions received at game start

var delete2all_cost = 4;

// how many deletions on the ethereal field may be done per season
var getDelete2PerSeason = function() {
  return state.challenges[challenge_nodelete].completed ? 3 : 2;
}

// how many deletions can be saved up for future use when seasons change
var getDelete2maxBuildup = function() {
  return getDelete2PerSeason() * 4;
}


/*
s shaped function that goes towards diagonal asymptote on the right (and left but negative doesn't matter for the purpose)
s = a measure of how fast to reach the asymptote, must be in range (0, 1], above 1 the function becomes non-monotonic
d = distance of the diagonal asymptote from the origin. Its slope is always 1.
*/
function towardsdiag(x, s, d) {
  if(d == 0) return x;
  if(s == 0) return x; // can never reach the asymptote

  var ax = x * s / d;
  var p = 4; // the higher the faster it goes towards the asymptote; TODO: this could replace the s parameter since the s parameter has limitations
  var a = ax / Math.pow((Math.pow(ax, p) + 1),  1 / p);
  a *= d;

  return -a + x;
}


/*
The goal of this function is to reduce the grow time by the amount of time given in time. E.g. a 20 minute grow time, with a reduction of 1 minute, becomes a 19 minute grow time
however, the goal of this is also to not reduce plants that already grow fast by that amount. E.g. if a plant has a 1-minute growtime, and we reduce by 2 minutes, the plant should not have a negative growtime of course.
there should be some lower bound to which the reduction can occur.
the lower bound could be linear: reduce max 50%. However, I believe that for plants that have very slow grow times, like 20 minutes, more than 50% should be possible, while for very fast plants like 1 minute, max 30 seconds is good.
So the lower bound should be something non-linear. An example: it could be ln(t * f + 1) / f, with t in seconds and f some hard-coded factor tuned to have appropriate lower bounds for 1 minute, 10 minutes, etc...
*/
function reduceGrowTime(time, reduce) {
  if(reduce == 0) return time;

  //var f = 0.02;
  //var min = Math.log(time * f + 1) / f;
  //var min = 30;
  var min = 30 + Math.log(time);
  time -= min;

  time = towardsdiag(time, 1, reduce);

  time += min;

  return time;
}


Crop.prototype.getPlantTime = function() {
  var result = this.planttime;
  if(result == 0) return result;

  // This is the opposite for croptype_short, it's not planttime but live time. TODO: make two separate functions for this
  if(this.type == CROPTYPE_SHORT) {
    if(this.basic_upgrade != null) {
      var u = state.upgrades[this.basic_upgrade];
      var u2 = upgrades[this.basic_upgrade];
      if(u.count > 0) {
        result += (this.planttime * u2.bonus) * u.count;
      }
    }

    return result;
  }

  var count = state.upgrades2[upgrade2_time_reduce_0].count;
  if(count) {
    result = reduceGrowTime(result, upgrade2_time_reduce_0_amount * count);
  }

  var level = getFruitAbility(FRUIT_GROWSPEED);
  if(level > 0) {
    var mul = Num(1).sub(getFruitBoost(FRUIT_GROWSPEED, level, getFruitTier())).valueOf();
    result *= mul;
  }

  return result;
};

Crop.prototype.getCost = function(opt_adjust_count) {
  var mul = sameTypeCostMultiplier;
  if(this.type == CROPTYPE_FLOWER) mul = sameTypeCostMultiplier_Flower;
  if(this.type == CROPTYPE_SHORT) mul = sameTypeCostMultiplier_Short;
  if(this.type == CROPTYPE_CHALLENGE) {
    if(this.challengecroppricemul) mul = this.challengecroppricemul;
  }
  var countfactor = Math.pow(mul, state.cropcount[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};


Crop.prototype.getRecoup = function() {
  if(this.type == CROPTYPE_SHORT) return Res(0);
  if(state.challenge == challenge_wither) return Res(0);
  return this.getCost(-1).mulr(cropRecoup);
};

// used for multiple possible aspects, such as production, boost if this is a flower, etc...
// f is field, similar to in Crop.prototype.getProd
// result is change in-place and may be either Num or Res. Nothing is returned.
Crop.prototype.addSeasonBonus_ = function(result, season, f, breakdown) {
  // posmul is used:
  // Unlike other multipliers, this one does not affect negative production. This is a good thing in the crop's good season, but extra harsh in a bad season (e.g. winter)

  if(season == 0 && this.type == CROPTYPE_FLOWER) {
    var bonus = getSpringFlowerBonus();
    result.mulInPlace(bonus);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 1 && this.type == CROPTYPE_BERRY) {
    var bonus = getSummerBerryBonus();
    result.mulInPlace(bonus);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  // with ethereal upgrades, spring also benefits mushrooms a bit, to catch up with other seasons ethereal upgrades
  if(season == 1 && this.type == CROPTYPE_MUSH) {
    var bonus = getSummerMushroomBonus();
    result.mulInPlace(bonus);
    if(breakdown && bonus.neqr(1)) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 2 && this.type == CROPTYPE_MUSH) {
    var bonus = getAutumnMushroomBonus();
    result.posmulInPlace(bonus);
    if(breakdown) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  // with ethereal upgrades, autumn also benefits mushrooms a bit, to catch up with other seasons ethereal upgrades
  if(season == 2 && this.type == CROPTYPE_BERRY) {
    var bonus = getAutumnBerryBonus();
    result.posmulInPlace(bonus);
    if(breakdown && bonus.neqr(1)) breakdown.push([seasonNames[season], true, bonus, result.clone()]);
  }

  if(season == 3 && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH || this.type == CROPTYPE_FLOWER || this.type == CROPTYPE_BEE) && f) {
    var mist_active = state.upgrades[upgrade_mistunlock].count && this.type == CROPTYPE_MUSH && (state.time - state.misttime) < getMistDuration();
    var sun_active = state.upgrades[upgrade_sununlock].count && this.type == CROPTYPE_BERRY && (state.time - state.suntime) < getSunDuration();
    var rainbow_active = state.upgrades[upgrade_rainbowunlock].count && (state.time - state.rainbowtime) < getRainbowDuration();

    var weather_ignore = false;
    if(this.type == CROPTYPE_BERRY && sun_active) weather_ignore = true;
    if(this.type == CROPTYPE_MUSH && mist_active) weather_ignore = true;
    if(this.type == CROPTYPE_FLOWER && rainbow_active) weather_ignore = true;

    var p = prefield[f.y][f.x];
    if(!p.treeneighbor && !weather_ignore) {
      var malus = getWinterMalus();
      if(malus.neqr(1)) {
        result.posmulInPlace(malus);
        if(breakdown) breakdown.push([seasonNames[season], true, malus, result.clone()]);
      }
    }

    // winter tree warmth
    if(p.treeneighbor && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH)) {
      var bonus = getWinterTreeWarmth();
      result.mulInPlace(bonus);
      if(breakdown) breakdown.push(['winter tree warmth', true, bonus, result.clone()]);
    }
  }
}

// f = Cell from field, or undefined to not take location-based production bonuses into account
// prefield must already have been computed for flowers, beehives and nettles (but not yet for berries/mushrooms, which is what is being computed now) before this may get called
// pretend: compute income if this plant would be planted here, while it doesn't exist here in reality. For the planting dialog UI
Crop.prototype.getProd = function(f, pretend, breakdown) {
  var result = Res(this.prod);
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  if(!pretend && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    // wither challenge
    if(state.challenge == challenge_wither) {
      var t = Num(witherCurve(f.growth) * f.growth);
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
    } else {
      var t = Num(f.growth * f.growth); // unlike flowers etc..., the actual producers ramp up quadratically (= a slower start, but not applied to flowers/beehives/... to count this effect in only once)
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['growing', true, t, result.clone()]);
    }
  }

  // upgrades
  if(this.basic_upgrade != null && this.type != CROPTYPE_SHORT) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = u2.bonus.powr(u.count);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }
  if(this.basic_upgrade != null && this.type == CROPTYPE_SHORT) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var mul_upgrade = Num(1).add(Num(0.5).mulr(u.count)); // watercress upgrade is additive instead of multiplicative
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  // medal
  result.mulInPlace(state.medal_prodmul);
  if(breakdown) breakdown.push(['achievements', true, state.medal_prodmul, result.clone()]);


  if(this.type == CROPTYPE_BERRY) {
    var level = getFruitAbility(FRUIT_BERRYBOOST);
    if(level > 0) {
      var mul = getFruitBoost(FRUIT_BERRYBOOST, level, getFruitTier()).addr(1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_BERRYBOOST), true, mul, result.clone()]);
    }
  }
  if(this.type == CROPTYPE_MUSH) {
    var level = getFruitAbility(FRUIT_MUSHBOOST);
    if(level > 0) {
      var mul = getFruitBoost(FRUIT_MUSHBOOST, level, getFruitTier()).addr(1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MUSHBOOST), true, mul, result.clone()]);
    }
    var level = getFruitAbility(FRUIT_MUSHEFF);
    if(level > 0) {
      var mul = Num(1).sub(getFruitBoost(FRUIT_MUSHEFF, level, getFruitTier()));
      result.seeds.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_MUSHEFF), true, mul, result.clone()]);
    }
  }

  // ethereal crops bonus to basic crops
  var ethereal_prodmul = Res.resOne();
  if(this.type == CROPTYPE_BERRY) {
    ethereal_prodmul.seeds = state.ethereal_berry_bonus.addr(1);
  }
  if(this.type == CROPTYPE_MUSH) {
    // seeds commented out in v0.1.16 but enabled again in v0.1.47 because otherwise the seed prod/consumption balance will get lost with higher level etherela field.
    ethereal_prodmul.seeds = state.ethereal_mush_bonus.addr(1);
    ethereal_prodmul.spores = state.ethereal_mush_bonus.addr(1);
  }
  var e = result.elmul(ethereal_prodmul);
  if(result.neq(e)) {
    if(breakdown) {
      var mul = Num(1);
      var a0 = result.toArray();
      var a1 = e.toArray();
      for(var i = 0; i < a0.length; i++) {
        if(a0[i].neq(a1[i])) {
          mul = a1[i].div(a0[i]);
          break;
        }
      }
      breakdown.push(['ethereal crops', true, mul, e.clone()]);
    }
    result = e;
  }

  if(state.res.resin.gter(1)) {
    var resin_bonus = getUnusedResinBonus();
    result.mulInPlace(resin_bonus);
    if(breakdown) breakdown.push(['unused resin', true, resin_bonus, result.clone()]);
  }


  var season = getSeason();

  // flower boost
  if(f && (this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH)) {
    var mul_boost = Num(1);
    var num = 0;
    var x = f.x, y = f.y, w = state.numw, h = state.numh;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
      var n = state.field[y2][x2];
      if(n.hasCrop() && n.getCrop().type == CROPTYPE_FLOWER) {
        var boost = prefield[n.y][n.x].boost;
        if(boost.neqr(0)) {
          mul_boost.addInPlace(boost);
          num++;
        }
      }
    }

    result.mulInPlace(mul_boost);
    if(breakdown && num > 0) breakdown.push(['flowers (' + num + ')', true, mul_boost, result.clone()]);
  }

  // nettle malus
  if(f && (this.type == CROPTYPE_BERRY)) {
    var p = prefield[f.y][f.x];
    var malus = p.nettlemalus_received;
    var num = p.num_nettle;

    if(num > 0) {
      result.mulInPlace(malus);
      if(breakdown) breakdown.push(['nettles malus (' + num + ')', true, malus, result.clone()]);
    }
  }

  // nettle boost
  if(f && (this.type == CROPTYPE_MUSH)) {
    var spore_boost = Num(1);
    var num = 0;
    var x = f.x, y = f.y, w = state.numw, h = state.numh;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= w || y2 < 0 || y2 >= h) continue;
      var n = state.field[y2][x2];
      if(n.hasCrop() && n.getCrop().type == CROPTYPE_NETTLE) {
        var boost = prefield[n.y][n.x].boost; //n.getCrop().getBoost(n);
        if(boost.neqr(0)) {
          spore_boost.addInPlace(boost);
          num++;
        }
      }
    }

    result.spores.mulInPlace(spore_boost);
    if(breakdown && num > 0) breakdown.push(['nettles (' + num + ')', true, spore_boost, result.clone()]);
  }

  // multiplicity
  if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH) && haveMultiplicity(this.type)) {
    // multiplicity only works by fully grown crops, not for intermediate growing ones
    var num = getMultiplicityNum(this);
    if(num > 0) {
      var boost = getMultiplicityBonusBase(this.type).mulr(num).addr(1);
      result.mulInPlace(boost);
      if(breakdown) breakdown.push(['multiplicity (' + ((num == Math.floor(num)) ? num.toString() : num.toPrecision(3)) + ')', true, boost, result.clone()]);
    }
  }

  // treelevel boost
  // CROPTYPE_SHORT is excluded simply to remove noise in the breakdown display: it's only a bonus on its 1 seed production. At the point where the tree is leveled, its real income comes from the neighbor copying.
  if(state.treelevel > 0 && this.type != CROPTYPE_SHORT) {
    var tree_boost = Num(1).add(getTreeBoost());
    result.mulInPlace(tree_boost);
    if(breakdown && tree_boost.neqr(1)) breakdown.push(['tree level (' + state.treelevel + ')', true, tree_boost, result.clone()]);
  }

  // posmul is used when the bonus only affects its production but not its consumption.
  // most do not use posmul, since the game would become trivial if production has multipliers of billions while consumption remains something similar to the early game values.
  // especially a global bonus like medal, that affects everything at once and hence can't cause increased consumption to be worse, should use full mul, not posmul

  var mist_active = state.upgrades[upgrade_mistunlock].count && this.type == CROPTYPE_MUSH && (state.time - state.misttime) < getMistDuration();
  var sun_active = state.upgrades[upgrade_sununlock].count && this.type == CROPTYPE_BERRY && (state.time - state.suntime) < getSunDuration();


  this.addSeasonBonus_(result, season, f, breakdown);

  // mist
  if(mist_active && this.type == CROPTYPE_MUSH) {
    var bonus_mist0 = getMistSeedsBoost();
    result.seeds.mulInPlace(bonus_mist0);
    if(breakdown) breakdown.push(['mist (less seeds)', true, bonus_mist0, result.clone()]);

    var bonus_mist1 = getMistSporesBoost();
    bonus_mist1.addrInPlace(1);
    result.spores.mulInPlace(bonus_mist1);
    if(breakdown) breakdown.push(['mist (more spores)', true, bonus_mist1, result.clone()]);
  }

  // sun
  if(sun_active && this.type == CROPTYPE_BERRY) {
    var bonus_sun = getSunSeedsBoost();
    bonus_sun.addrInPlace(1);
    result.seeds.mulrInPlace(bonus_sun);
    if(breakdown) breakdown.push(['sun', true, bonus_sun, result.clone()]);
  }

  // challenges
  if((this.type == CROPTYPE_BERRY || this.type == CROPTYPE_MUSH) && state.challenge_bonus.neqr(0)) {
    var challenge_bonus = state.challenge_bonus.addr(1);
    result.mulInPlace(challenge_bonus);
    if(breakdown) breakdown.push(['challenge highest levels', true, challenge_bonus, result.clone()]);
  }

  // bee challenge
  if(state.challenge == challenge_bees) {
    var bonus_bees = getWorkerBeeBonus().addr(1);
    result.posmulInPlace(bonus_bees);
    if(breakdown) breakdown.push(['worker bees (challenge)', true, bonus_bees, result.clone()]);
  }

  // leech, only computed here in case of "pretend", without pretent leech is computed in more correct way in precomputeField()
  if(pretend && this.type == CROPTYPE_SHORT && f) {
    var leech = this.getLeech(f);
    var p = prefield[f.y][f.x];
    var total = Res();
    var num = 0;
    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw || y2 < 0 || y2 >= state.numh) continue;
      var f2 = state.field[y2][x2];
      var c2 = f2.getCrop();
      if(c2) {
        var p2 = prefield[y2][x2];
        if(c2.type == CROPTYPE_BERRY || c2.type == CROPTYPE_MUSH) {
          total.addInPlace(p2.prod0);
          num++;
        }
      }
    }
    result.addInPlace(total);
    if(breakdown) {
      if(!total.empty()) {
        if(leech.ltr(1)) {
          breakdown.push(['copy reduction due to multiple watercress globally', true, leech, undefined]);
        }
        breakdown.push(['<span class="efWatercressHighlight">copying neighbors (' + num + ')</span>', false, total, result.clone()]);
      } else {
        breakdown.push(['no neighbors, not copying', false, total, result.clone()]);
      }
    }
  }

  return result;
};


// The result is the added value, e.g. a result of 0.5 means a multiplier of 1.5, or a bonus of +50%
Crop.prototype.getBoost = function(f, pretend, breakdown) {
  if(this.type != CROPTYPE_FLOWER && this.type != CROPTYPE_NETTLE) return Num(0);
  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  if(!pretend && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    // wither challenge
    if(state.challenge == challenge_wither) {
      var t = Num(witherCurve(f.growth));
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
    } else {
      var t = Num(f.growth);
      result.mulInPlace(t);
      if(breakdown) breakdown.push(['growing', true, t, result.clone()]);
    }
  }

  var rainbow_active = state.upgrades[upgrade_rainbowunlock].count && (state.time - state.rainbowtime) < getRainbowDuration();

  // TODO: have some achievements that give a boostmul instead of a prodmul

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {
      var n = u.count;
      if(this.type == CROPTYPE_NETTLE) {
        n = Math.pow(n, nettle_upgrade_power_exponent);
      }
      var mul_upgrade = u2.bonus.mulr(n).addr(1); // the flower upgrades are additive, unlike the crop upgrades which are multiplicative. This because the flower bonus itself is already multiplicative to the plants.
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  var season = getSeason();
  this.addSeasonBonus_(result, season, f, breakdown);

  if(this.type == CROPTYPE_FLOWER) {
    var level = getFruitAbility(FRUIT_FLOWERBOOST);
    if(level > 0) {
      var mul = getFruitBoost(FRUIT_FLOWERBOOST, level, getFruitTier()).addr(1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_FLOWERBOOST), true, mul, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_NETTLE) {
    var level = getFruitAbility(FRUIT_NETTLEBOOST);
    if(level > 0) {
      var mul = getFruitBoost(FRUIT_NETTLEBOOST, level, getFruitTier()).addr(1);
      result.mulInPlace(mul);
      if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_NETTLEBOOST), true, mul, result.clone()]);
    }
  }

  // ethereal crops bonus to basic crops
  if(this.type == CROPTYPE_FLOWER) {
    var ethereal_boost = state.ethereal_flower_bonus.addr(1);
    if(ethereal_boost.neqr(1)) {
      result.mulInPlace(ethereal_boost);
      if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
    }
  }
  if(this.type == CROPTYPE_NETTLE) {
    var ethereal_boost = state.ethereal_nettle_bonus.addr(1);
    if(ethereal_boost.neqr(1)) {
      result.mulInPlace(ethereal_boost);
      if(breakdown) breakdown.push(['ethereal crops', true, ethereal_boost, result.clone()]);
    }
  }

  // rainbow
  if(this.type == CROPTYPE_FLOWER) {
    if(rainbow_active) {
      var bonus_rainbow = getRainbowFlowerBoost();
      bonus_rainbow.addrInPlace(1);
      result.mulrInPlace(bonus_rainbow);
      if(breakdown) breakdown.push(['rainbow', true, bonus_rainbow, result.clone()]);
    }
  }

  // bee challenge
  if(state.challenge == challenge_bees) {
    var bonus_bees = getWorkerBeeBonus().addr(1);
    result.posmulInPlace(bonus_bees);
    if(breakdown) breakdown.push(['worker bees (challenge)', true, bonus_bees, result.clone()]);
  }


  // beehives boostboost
  if(f && (this.type == CROPTYPE_FLOWER)) {
    var p = prefield[f.y][f.x];
    var bonus = p.beeboostboost_received.addr(1);
    var num = p.num_bee;

    if(num > 0) {
      result.mulInPlace(bonus);
      if(breakdown) breakdown.push(['beehives (' + num + ')', true, bonus, result.clone()]);
    }
  }

  // nettle negatively affecting flowers
  if(f && (this.type == CROPTYPE_FLOWER)) {
    var p = prefield[f.y][f.x];
    var malus = p.nettlemalus_received;
    var num = p.num_nettle;

    if(num > 0) {
      result.mulInPlace(malus);
      if(breakdown) breakdown.push(['nettles malus (' + num + ')', true, malus, result.clone()]);
    }
  }

  return result;
};


// beehive boosting the boost of flowers
Crop.prototype.getBoostBoost = function(f, pretend, breakdown) {
  var result = Num(0);

  var hasboostboost = false;
  if(this.type == CROPTYPE_BEE) hasboostboost = true;
  if(this.index == challengecrop_0) hasboostboost = true;
  if(this.index == challengecrop_1) hasboostboost = true;
  if(this.index == challengecrop_2) hasboostboost = true;


  if(!hasboostboost) {
    if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);
    return result;
  }

  result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  if(!pretend && f && (!f.isFullGrown() || state.challenge == challenge_wither)) {
    if(this.type == CROPTYPE_CHALLENGE) {
      // bee challenge bees while growing do nothing
      return Num(0);
    } else {
      // wither challenge
      if(state.challenge == challenge_wither) {
        var t = Num(witherCurve(f.growth));
        result.mulInPlace(t);
        if(breakdown) breakdown.push(['withering', true, t, result.clone()]);
      } else {
        var t = Num(f.growth);
        result.mulInPlace(t);
        if(breakdown) breakdown.push(['growing', true, t, result.clone()]);
      }
    }
  }

  // upgrades
  if(this.basic_upgrade != null) {
    var u = state.upgrades[this.basic_upgrade];
    var u2 = upgrades[this.basic_upgrade];
    if(u.count > 0) {

      var n = Num(u.count);
      n.powrInPlace(beehive_upgrade_power_exponent);
      var mul_upgrade = u2.bonus.mulr(n).addr(1);
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push([' upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
      // example: if without upgrades boost was +50%, and now 16 upgrades of 10% each together add 160%, then result will be 130%: 0.5*(1+16*0.1)=1.3
    }
  }

  this.addSeasonBonus_(result, getSeason(), f, breakdown);

  return result;
};

// This returns the leech ratio of this plant, not the actual resource amount leeched
// Only correct for already planted leeching plants (for the penalty of multiple planted ones computation)
Crop.prototype.getLeech = function(f, breakdown) {
  if(this.type != CROPTYPE_SHORT) {
    var result = Num(0);
    if(breakdown) breakdown.push(['none', true, Num(0), result.clone()]);
    return Res();
  }

  var result = Num(1);
  if(breakdown) breakdown.push(['base', true, Num(1), result.clone()]);

  var level = getFruitAbility(FRUIT_WATERCRESS);
  if(level > 0) {
    var mul = getFruitBoost(FRUIT_WATERCRESS, level, getFruitTier()).addr(1);
    result.mulInPlace(mul);
    if(breakdown) breakdown.push(['fruit: ' + getFruitAbilityName(FRUIT_WATERCRESS), true, mul, result.clone()]);
  }

  // add a penalty for the neighbor production copy-ing if there are multiple watercress in the field. The reason for this is:
  // the watercress neighbor production copying is really powerful, and if every single watercress does this at full power, this would require way too active play, replanting watercresses in the whole field all the time.
  // encouraging to plant one or maybe two (but diminishing returns that make more almost useless) strikes a good balance between doing something useful during active play, but still getting reasonable income from passive play
  var numsame = state.cropcount[this.index];
  if(numsame > 1) {
    var penalty = 1 / (1 + (numsame - 1) * 0.75);
    result.mulrInPlace(penalty);

    if(breakdown) breakdown.push(['reduction for multiple', true, Num(penalty), result.clone()]);
  }

  return result;
};

var registered_crops = []; // indexed consecutively, gives the index to crops
var crops = []; // indexed by crop index
var cropsByName = {};

// array of arrays, first index is croptype, second index is tier, value is crop of that tier for that cropindex
var croptype_tiers = [];

// 16-bit ID, auto incremented with registerCrop, but you can also set it to a value yourself, to ensure consistent IDs for various crops (between savegames) in case of future upgrades
var crop_register_id = -1;

function registerCrop(name, cost, prod, boost, planttime, image, opt_tagline, opt_croptype, opt_tier) {
  if(!image) image = missingplant;
  if(crops[crop_register_id] || crop_register_id < 0 || crop_register_id > 65535) throw 'crop id already exists or is invalid!';
  var crop = new Crop();
  crop.index = crop_register_id++;
  crops[crop.index] = crop;
  cropsByName[name] = crop;
  registered_crops.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.planttime = planttime || 0;
  crop.image = image;
  crop.tagline = opt_tagline || '';
  crop.boost = boost;

  crop.type = opt_croptype;
  crop.tier = opt_tier;

  if(opt_croptype != undefined && opt_tier != undefined) {
    if(!croptype_tiers[opt_croptype]) croptype_tiers[opt_croptype] = [];
    croptype_tiers[opt_croptype][opt_tier] = crop;
  }

  return crop.index;
}

function registerBerry(name, tier, planttime, image, opt_tagline) {
  var cost = getBerryCost(tier);
  var prod = getBerryProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_BERRY, tier);
  //var crop = crops[index];
  return index;
}

function registerMushroom(name, tier, planttime, image, opt_tagline) {
  var cost = getMushroomCost(tier);
  var prod = getMushroomProd(tier);
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_MUSH, tier);
  //var crop = crops[index];
  return index;
}

function registerFlower(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getFlowerCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline, CROPTYPE_FLOWER, tier);
  //var crop = crops[index];
  return index;
}

function registerNettle(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getNettleCost(tier);
  var index = registerCrop(name, cost, Res({}), boost, planttime, image, opt_tagline, CROPTYPE_NETTLE, tier);
  //var crop = crops[index];
  return index;
}

function registerShortLived(name, tier, prod, planttime, image, opt_tagline) {
  var cost = Res({seeds:10});
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_SHORT, tier);
  //var crop = crops[index];
  return index;
}

function registerMistletoe(name, tier, planttime, image, opt_tagline) {
  var cost = getMushroomCost(0).mulr(2);
  var prod = Res({});
  var index = registerCrop(name, cost, prod, Num(0), planttime, image, opt_tagline, CROPTYPE_MISTLETOE, tier);
  //var crop = crops[index];
  return index;
}

function registerBeehive(name, tier, boost, planttime, image, opt_tagline) {
  var cost = getBeehiveCost(tier);
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_BEE, tier);
  var crop = crops[index];
  crop.boost = boost;
  return index;
}

function registerChallengeCrop(name, tier, cost, planttime, image, opt_tagline) {
  var index = registerCrop(name, cost, Res({}), Num(0), planttime, image, opt_tagline, CROPTYPE_CHALLENGE, tier);
  //var crop = crops[index];
  return index;
}

// should return 1 for i=0
function getBerryBase(i) {
  return Num.rpow(2000, Num(i));
}

function getBerryCost(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(20);
  if(i == 0) seeds.mulrInPlace(50);
  if(i > 1) seeds.mulInPlace(Num.rpow(1.5, Num((i - 1) * (i - 1))));
  seeds = Num.roundNicely(seeds);
  return Res({seeds:seeds});
}

function getBerryProd(i) {
  var seeds = getBerryBase(i);
  seeds.mulrInPlace(2);
  if(i == 0) seeds.mulrInPlace(2);
  seeds.mulInPlace(Num.rpow(0.35, Num(i)));
  return Res({seeds:seeds});
}


function getMushroomCost(i) {
  // Mushrooms start after berry 1, and then appear after every 2 berries.
  return getBerryCost(1.5 + i * 2);
}

function getMushroomProd(i) {
  var seeds = getBerryProd(2 + i * 2).seeds.neg();
  var seeds0 = getBerryProd(2 + 0 * 2).seeds.neg();

  var spores = seeds.div(seeds0).mulr(1);
  spores.mulrInPlace(Math.pow(0.25, i)); // make higher mushrooms less efficient in seeds->spores conversion ratio: they are better because they can manage much more seeds, but must also have a disadvantage


  // commented out as of v0.1.20: one would normally also plant a flower next to a mushroom, so that same boost applies to the mushroom, and so you get the overconsumption anyway. The 100x efficiency drop was way over the mark.
  //if(i >= 2) seeds = seeds.mulr(100); // at this point berries have such high flower boosts that a higher seeds consumption is needed to have it such that when you unlock this mushroom, you begin with overconsumption
  //if(i >= 3) seeds = seeds.mulr(100); // this one is not yet tested, so this is a guess for now

  return Res({seeds:seeds, spores:spores});
}

function getFlowerCost(i) {
  // Flowers start after berry 2, and then appear after every 2 berries.
  return getBerryCost(2.5 + i * 2);
}

function getNettleCost(i) {
  return getMushroomCost(1.1 + i * 2);
}

function getBeehiveCost(i) {
  // Beehives start (and end, for now) after flower_2
  return getFlowerCost((i + 1) * 2 + 0.15);
}

var berryplanttime0 = 60;
var mushplanttime0 = 120;
var flowerplanttime0 = 180;

// berries: give seeds
crop_register_id = 25;
var berry_0 = registerBerry('blackberry', 0, berryplanttime0 * 1, blackberry);
var berry_1 = registerBerry('blueberry', 1, berryplanttime0 * 2, blueberry);
var berry_2 = registerBerry('cranberry', 2, berryplanttime0 * 4, cranberry);
var berry_3 = registerBerry('currant', 3, berryplanttime0 * 8, currant);
var berry_4 = registerBerry('goji', 4, berryplanttime0 * 12, goji);
var berry_5 = registerBerry('gooseberry', 5, berryplanttime0 * 16, gooseberry);
var berry_6 = registerBerry('grape', 6, berryplanttime0 * 20, grape);
var berry_7 = registerBerry('honeyberry', 7, berryplanttime0 * 25, honeyberry);
var berry_8 = registerBerry('juniper', 8, berryplanttime0 * 30, juniper);
var berry_9 = registerBerry('lingonberry', 9, berryplanttime0 * 35, lingonberry);
var berry_10 = registerBerry('mulberry', 10, berryplanttime0 * 40, mulberry);
var berry_11 = registerBerry('physalis', 11, berryplanttime0 * 45, physalis);
var berry_12 = registerBerry('raspberry', 12, berryplanttime0 * 50, raspberry);
var berry_13 = registerBerry('strawberry', 13, berryplanttime0 * 55, strawberry, 'actually not a berry... (but in this game it acts as one)');
var berry_14 = registerBerry('whitecurrant', 14, berryplanttime0 * 60, whitecurrant);

// mushrooms: give spores
crop_register_id = 50;
var mush_0 = registerMushroom('champignon', 0, mushplanttime0 * 1, champignon);
var mush_1 = registerMushroom('matsutake', 1, mushplanttime0 * 3, matsutake);
var mush_2 = registerMushroom('morel', 2, mushplanttime0 * 6, morel);
var mush_3 = registerMushroom('muscaria', 3, mushplanttime0 * 9, amanita, 'amanita muscaria'); // names are alphabetical, but amanita counts as "muscaria" because it's not well suited to be the lowest tier mushroom with letter a
var mush_4 = registerMushroom('portobello', 4, mushplanttime0 * 12, portobello);
var mush_5 = registerMushroom('shiitake', 5, mushplanttime0 * 15, shiitake);
var mush_6 = registerMushroom('truffle', 6, mushplanttime0 * 18, truffle);


var fower_base = Num(0.5);
var flower_increase = Num(16);

// flowers: give boost to neighbors
crop_register_id = 75;
var flower_0 = registerFlower('clover', 0, fower_base.mul(flower_increase.powr(0)), flowerplanttime0, clover);
var flower_1 = registerFlower('cornflower', 1, fower_base.mul(flower_increase.powr(1)), flowerplanttime0 * 3, cornflower);
var flower_2 = registerFlower('daisy', 2, fower_base.mul(flower_increase.powr(2)), flowerplanttime0 * 6, daisy);
var flower_3 = registerFlower('dandelion', 3, fower_base.mul(flower_increase.powr(3)), flowerplanttime0 * 9, dandelion);
var flower_4 = registerFlower('iris', 4, fower_base.mul(flower_increase.powr(4)), flowerplanttime0 * 12, iris);
var flower_5 = registerFlower('lavendar', 5, fower_base.mul(flower_increase.powr(5)), flowerplanttime0 * 15, lavendar);
var flower_6 = registerFlower('orchid', 6, fower_base.mul(flower_increase.powr(6)), flowerplanttime0 * 18, orchid);


crop_register_id = 100;
var nettle_0 = registerNettle('nettle', 0, Num(4), berryplanttime0, nettle);
// a next one could be "thistle"

crop_register_id = 105;
var short_0 = registerShortLived('watercress', 0, Res({seeds:1}), 60, watercress);

crop_register_id = 110;
var mistletoe_0 = registerMistletoe('mistletoe', 0, 50, mistletoe);

crop_register_id = 120;
// In theory, a beehive giving a 50% boost is already worth it: touching 4 flowers means getting 2 flowers worth of production bonus from 1 beehive,
// spread to multiple berries touching those 4 flowers, making the beehive then slightly better than putting a berry in this spot instead.
// However, to make the complexity of the beehive mechanic truly worth it, and taking into account that there's likely only room for 1 or 2 on a 6x6 field,
// the bonus should be much more generous: set to 300% (3.0) now, and upgrades kan make it much higher, just like flowers reach the 10-thousands
var bee_0 = registerBeehive('beehive', 0, Num(3.0), /*growtime=*/300, images_beehive);

crop_register_id = 200;

var challengecrop_0 = registerChallengeCrop('worker bee', 0, Res({seeds:20000}), 60, images_workerbee,
    'provides bonus to all crops, but only if next to a flower. This bonus is boosted if next to a queen bee. Since it boosts berries, flowers, mushrooms and mushroom economy, it scales cubically rather than just linearly.');
crops[challengecrop_0].challengecroppricemul = Num(25);
crops[challengecrop_0].boost = Num(0.2);

var challengecrop_1 = registerChallengeCrop('queen bee', 0, Res({seeds:200000}), 90, images_queenbee, 'Boosts orthogonally neighboring worker bees. Can be boosted by beehive');
crops[challengecrop_1].challengecroppricemul = Num(25);
crops[challengecrop_1].boost = Num(1);

var challengecrop_2 = registerChallengeCrop('beehive', 0, Res({seeds:2000000}), 120, images_beehive, 'Boosts orthogonally neighboring queen bees. Note: not related to main game beehive you get as bonus from completing this challenge, very different rules during the challenge.');
crops[challengecrop_2].challengecroppricemul = Num(25);
crops[challengecrop_2].boost = Num(1);

var challengeflower_0 = registerCrop('aster', Res({seeds:20000}), Res({}), Num(0.1), 60, images_aster, 'This flower is only available during the bee challenge');
crops[challengeflower_0].type = CROPTYPE_FLOWER;

// templates

function makeTemplate(crop_id) {
  crops[crop_id].istemplate = true;
  crops[crop_id].cost = Res(0);
  return crop_id;
}

crop_register_id = 300;
var watercress_template = makeTemplate(registerShortLived('watercress template', -1, Res(0), 0, images_watercresstemplate));
var berry_template = makeTemplate(registerBerry('berry template', -1, 0, images_berrytemplate));
var mush_template = makeTemplate(registerMushroom('mushroom template', -1, 0, images_mushtemplate));
var flower_template = makeTemplate(registerFlower('flower template', -1, Num(0), 0, images_flowertemplate));
var nettle_template = makeTemplate(registerNettle('nettle template', -1, Num(0), 0, images_nettletemplate));
var bee_template = makeTemplate(registerBeehive('bee template', -1, Num(0), 0, images_beetemplate));
var mistletoe_template = makeTemplate(registerMistletoe('mistletoe template', -1, 0, images_mistletoetemplate));

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades = []; // indexed consecutively, gives the index to upgrades
var upgrades = []; // indexed by upgrade index
var upgradesByName = {};


// same comment as crop_register_id
var upgrade_register_id = -1;

// @constructor
function Upgrade() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined

  this.choicename_a = 'A';
  this.choicename_b = 'B';

  // function that applies the upgrade. takes argument n, integer, if > 1,
  // must have same effect as calling n times with 1.
  this.fun = undefined;

  // function that returns true if prerequisites to unlock this research are met
  this.pre = undefined;

  this.index = 0; // index in the upgrades array

  this.maxcount = 1; // how many times can this upgrade be done in total (typical 1, some upgrades have many series, 0 for infinity)

  this.is_choice = false; // if true, it's an upgrade that allows you to choose between effects with a dialog
  this.iscropupgrade = false; // is a berry/flower/... multiplier or additive upgrade (not an unlock, choice upgrade, ...), matching with the cropid
  this.iscropunlock = false; // matches with cropid
  this.istreebasedupgrade = false; // is one of the upgrades that comes from the tree, such as weather and choice upgrades.

  this.cost = Res();

  // how much the cost of this upgrade increases when doing next one
  this.cost_increase = Num(1);

  // how this field is used, if at all, depends on the upgrade type
  this.bonus = undefined;


  // style related, for the upgrade chip in upgrade UI
  this.bgcolor = '#ff0';
  this.bordercolor = '000';
  this.image0 = undefined; // bg image, e.g. a plant
  this.image1 = undefined; // fg image, e.g. a level-up arrow in front of the plant

  this.deprecated = false; // no longer existing upgrade from earlier game version

  this.cropid = undefined; // if not undefined, it means the upgrade is related to this crop


  // gets the name, taking stage into account if it has stages
  this.getName = function() {
    var name = this.name;
    if(state.upgrades[this.index].count > 0 && this.maxcount != 1) name += ' ' + util.toRoman((state.upgrades[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(this.maxcount != 1) name += ' ' + util.toRoman((state.upgrades[this.index].count + 1));
    return name;
  };

  // max amount of upgrades done, fully researched
  this.isExhausted = function() {
    if(this.maxcount == 0) return false; // can be done infinite times
    return state.upgrades[this.index].count >= this.maxcount;
  };

  // can upgrade (ignoring resources needed), that is, it should be shown in the UI as a pressable button for upgrade that can be done noe
  this.canUpgrade = function() {
    return state.upgrades[this.index].unlocked && !this.isExhausted();
  };

  this.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(this.cost_increase, state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };
}

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerUpgrade(name, cost, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {
  if(upgrades[upgrade_register_id] || upgrade_register_id < 0 || upgrade_register_id > 65535) throw 'upgrades id already exists or is invalid!';
  var upgrade = new Upgrade();
  upgrade.index = upgrade_register_id++;
  upgrades[upgrade.index] = upgrade;
  upgradesByName[name] = upgrade;
  registered_upgrades.push(upgrade.index);


  upgrade.name = name;
  upgrade.cost = cost;
  upgrade.maxcount = maxcount;

  if(bgcolor) upgrade.bgcolor = bgcolor;
  if(bordercolor) upgrade.bordercolor = bordercolor;
  if(image0) upgrade.image0 = image0;
  if(image1) upgrade.image1 = image1;

  // opt_choice is only used for choice upgrades
  upgrade.fun = function(opt_choice) {
    if(this.is_choice) {
      state.upgrades[this.index].count = opt_choice;
    } else {
      state.upgrades[this.index].count++;
    }
    // ensure it's also marked as unlocked. Most upgrades are unlocked before you can apply them, but in some cases like
    // auto-unlocked ones for challenges, blackberry secret, ... that may not be so.
    // and: upgrades are only saved in the savegame when unlocked, so must be set now or its count won't be saved
    state.upgrades[this.index].unlocked = true;
    fun();
  };

  if(!pre) pre = function(){return true;};
  upgrade.pre = pre;

  upgrade.description = description;

  return upgrade.index;
}

// prev_berry: the previous berry tier that's required to exist for this crop.
// for berries themselves, this must be the previous berry
// for other crop types, the following applies: a requirement for this upgrade to unlock, is that either there is a fullgrown instance of that berry on the field, or the next higher berry type is unlocked.
// So having the next berry tier unlocked counts as if previous tier was planted. Example: you research 10 berry types but never unlock any mushroom. Now you unlock the first mushroom type. If next berry tier unlocked didn't count, then next mushroom would require you to plant some old berries on the field.
// If undefined, then this system is not used and only opt_pre_fun is used. If defined, then opt_pre_fun is an optional additional requirement (stricter, not less strict).
function registerCropUnlock(cropid, cost, prev_berry, opt_pre_fun_and, opt_pre_fun_or) {
  var crop = crops[cropid];
  var name = 'Unlock ' + crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  var fun = function() {
    if(cropid == flower_0 && (state.messagelogenabled[3] || state.g_numresets == 0)) showMessage('You unlocked the first type of flower! Flowers don\'t produce resources directly, but boost neighboring plants.', C_HELP, 456645);
    if(cropid == mushunlock_0 && (state.messagelogenabled[3] || state.g_numresets == 0)) showMessage('You unlocked the first type of mushroom! Mushrooms produce spores rather than seeds, and spores will be used by the tree.', C_HELP, 8932);
    state.crops[crop.index].unlocked = true;
  };

  var pre = function() {
    if(opt_pre_fun_and && !opt_pre_fun_and()) return false;
    if(opt_pre_fun_or && opt_pre_fun_or()) return true;
    if(prev_berry == undefined) return true;
    var berry_tier = crops[prev_berry].tier;
    if(state.highestoftypeunlocked[CROPTYPE_BERRY] > berry_tier) return true; // next berry tier unlocked: counts as better than having some planted of prev berry tier
    return !!state.fullgrowncropcount[prev_berry]; // some planted of prev berry tier
  };

  var description = 'Unlocks new crop: ' + crop.name + '.';
  if(crop.prod.seeds.gtr(0)) description += ' Produces seeds.';
  if(crop.prod.spores.gtr(0)) description += ' Produces spores.';
  if(!crop.boost.eqr(0)) {
    if(crop.type == CROPTYPE_NETTLE) {
      description += ' Boosts neighbor mushroom spores production without increasing seed consumption. However, negatively affects neighboring berries and flowers, so avoid touching those with this plant.';
    } else if(crop.type == CROPTYPE_BEE) {
      description += ' Boosts neighboring flower\'s boost.';
    } else {
      description += ' Boosts neighbors. Does not boost watercress directly, but watercress gets same boosts as its neighbor resource-producing crops.';
    }
  }


  description += ' Crop type: ' + getCropTypeName(crop.type);

  var result = registerUpgrade(name, cost, fun, pre, 1, description, '#dfc', '#0a0', crop.image[4], undefined);
  var u = upgrades[result];
  u.cropid = cropid;
  u.iscropunlock = true;

  u.getCost = function(opt_adjust_count) {
    return cost;
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerCropMultiplier(cropid, cost, multiplier, prev_crop_num, crop_unlock_id, opt_pre_fun) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(opt_pre_fun && !opt_pre_fun()) return false;
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'production';
  if(crop.type == CROPTYPE_MUSH) aspect = 'production but also consumption';

  var description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor(((multiplier - 1) * 100)) + '% (multiplicative)';

  if(crop.type == CROPTYPE_MUSH) description += '<br><br>WARNING! if your mushrooms don\'t have enough seeds from neighbors, this upgrade will not help you for now since it also increases the consumption. Get your seeds production up first!';


  var result = registerUpgrade('Upgrade ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(multiplier);
  u.cropid = cropid;
  u.iscropupgrade = true;

  u.getCost = function(opt_adjust_count) {
    var i = state.upgrades[this.index].count + (opt_adjust_count || 0);
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), i);
    var result = this.cost.mul(countfactor);
    // soft cap by a slight more than exponential increase of the cost: without soft cap, there'll be some tier of crops that is the best tier, and higher tiers will give less production compared to lower berry with as-expensive upgrades
    var base = 1.002;
    //if(crop.type == CROPTYPE_MUSH) base = 1.002; // same for now.
    if(i > 1) result = result.mul(Num.powr(Num(base), (i - 1) * (i - 1)));
    return result;
  };

  return result;
}


function registerBoostMultiplier(cropid, cost, adder, prev_crop_num, crop_unlock_id, cost_increase) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var aspect = 'boost';
  var description;
  if(crop.type == CROPTYPE_NETTLE) {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (scales by n^' + nettle_upgrade_power_exponent + ' )';
  } else if(crop.type == CROPTYPE_BEE) {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (scales by n^' + beehive_upgrade_power_exponent + ' )';
  } else {
    description = 'Improves ' + aspect + ' of ' + crop.name + ' by ' + Math.floor((adder * 100)) + '% (additive)';
  }

  var result = registerUpgrade('Upgrade ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(adder);
  u.cropid = cropid;
  u.iscropupgrade = true;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerShortCropTimeIncrease(cropid, cost, time_increase, prev_crop_num, crop_unlock_id, opt_pre_fun) {
  var crop = crops[cropid];
  var name = crop.name;

  // the index this new upgrade will get
  var index = upgrade_register_id;

  crop.basic_upgrade = index;

  var fun = function() {};

  var pre = function() {
    if(opt_pre_fun && !opt_pre_fun()) return false;
    if(crop_unlock_id == undefined) {
      return state.fullgrowncropcount[cropid] >= (prev_crop_num || 1);
    } else {
      // for most crops, already unlock this upgrade as soon as it's reaserached, rather than planted, because otherwise it's too easy to forget you already have this crop and should plant it while you're looking at the upgrade panel
      return state.upgrades[crop_unlock_id].count;
    }
  };

  var description = 'Adds ' + (time_increase * 100) + '%  time duration to the lifespan of ' + crop.name + ' (additive), and adds 50% base production excluding the neighbor copying effect. (additive)';

  var result = registerUpgrade('Upgrade ' + name, cost, fun, pre, 0, description, '#fdd', '#f00', crop.image[4], upgrade_arrow);
  var u = upgrades[result];
  u.bonus = Num(time_increase);
  u.cropid = cropid;
  u.iscropupgrade = true;

  u.getCost = function(opt_adjust_count) {
    var countfactor = Num.powr(Num(basic_upgrade_cost_increase), state.upgrades[this.index].count + (opt_adjust_count || 0));
    return this.cost.mul(countfactor);
  };

  return result;
}

// an upgrade that increases the multiplier of a crop
function registerChoiceUpgrade(name, pre, fun, name_a, name_b, description_a, description_b, bgcolor, bordercolor, image0, image1) {
  // the index this new upgrade will get
  var index = upgrade_register_id;

  var maxcount = 1;

  var description = 'Choice upgrade, pick one of the two proposed effects. Choose wisely. <br><br><b>' + name_a + '</b>:<br>' + description_a + '<br><br><b>' + name_b + '</b>:<br>' + description_b;

  var result = registerUpgrade(name, Res(), fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1);
  var u = upgrades[result];
  u.is_choice = true;
  u.choicename_a = name_a;
  u.choicename_b = name_b;

  return result;
}

// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade() {
  var result = registerUpgrade('<none>', Res(), function(){}, function(){return false;}, 1, '<none>');
  var u = upgrades[result];
  u.deprecated = true;
  return result;
}


upgrade_register_id = 25;
var berryunlock_0 = registerCropUnlock(berry_0, getBerryCost(0), short_0, function(){
  return (state.c_numplanted + state.c_numplantedshort) >= 5;
});
var berryunlock_1 = registerCropUnlock(berry_1, getBerryCost(1), berry_0, undefined, function() {
  if(state.upgrades2[upgrade2_blueberrysecret].count && state.upgrades[berryunlock_0].count) return true;
  return false;
});
var berryunlock_2 = registerCropUnlock(berry_2, getBerryCost(2), berry_1, undefined, function() {
  if(state.upgrades2[upgrade2_cranberrysecret].count && state.upgrades[berryunlock_1].count) return true;
  return false;
});
var berryunlock_3 = registerCropUnlock(berry_3, getBerryCost(3), berry_2);
var berryunlock_4 = registerCropUnlock(berry_4, getBerryCost(4), berry_3);
var berryunlock_5 = registerCropUnlock(berry_5, getBerryCost(5), berry_4);
var berryunlock_6 = registerCropUnlock(berry_6, getBerryCost(6), berry_5);
var berryunlock_7 = registerCropUnlock(berry_7, getBerryCost(7), berry_6);
var berryunlock_8 = registerCropUnlock(berry_8, getBerryCost(8), berry_7);
var berryunlock_9 = registerCropUnlock(berry_9, getBerryCost(9), berry_8);
var berryunlock_10 = registerCropUnlock(berry_10, getBerryCost(10), berry_9);
var berryunlock_11 = registerCropUnlock(berry_11, getBerryCost(11), berry_10);
var berryunlock_12 = registerCropUnlock(berry_12, getBerryCost(12), berry_11);
var berryunlock_13 = registerCropUnlock(berry_13, getBerryCost(13), berry_12);
var berryunlock_14 = registerCropUnlock(berry_14, getBerryCost(14), berry_13);

upgrade_register_id = 50;
var mushunlock_0 = registerCropUnlock(mush_0, getMushroomCost(0), berry_1, undefined, function() {
  if(state.upgrades2[upgrade2_blueberrysecret].count && state.upgrades[berryunlock_1].count) return true;
  return false;
});
var mushunlock_1 = registerCropUnlock(mush_1, getMushroomCost(1), berry_3, function(){return !!state.upgrades[mushunlock_0].count;});
var mushunlock_2 = registerCropUnlock(mush_2, getMushroomCost(2), berry_5, function(){return !!state.upgrades[mushunlock_1].count;});
var mushunlock_3 = registerCropUnlock(mush_3, getMushroomCost(3), berry_7, function(){return !!state.upgrades[mushunlock_2].count;});
var mushunlock_4 = registerCropUnlock(mush_4, getMushroomCost(4), berry_9, function(){return !!state.upgrades[mushunlock_3].count;});
var mushunlock_5 = registerCropUnlock(mush_5, getMushroomCost(5), berry_11, function(){return !!state.upgrades[mushunlock_4].count;});
var mushunlock_6 = registerCropUnlock(mush_6, getMushroomCost(6), berry_13, function(){return !!state.upgrades[mushunlock_5].count;});

upgrade_register_id = 75;
var flowerunlock_0 = registerCropUnlock(flower_0, getFlowerCost(0), berry_2, undefined, function() {
  if(state.upgrades2[upgrade2_cranberrysecret].count && state.upgrades[berryunlock_2].count) return true;
  return false;
});
var flowerunlock_1 = registerCropUnlock(flower_1, getFlowerCost(1), berry_4, function(){return !!state.upgrades[flowerunlock_0].count;});
var flowerunlock_2 = registerCropUnlock(flower_2, getFlowerCost(2), berry_6, function(){return !!state.upgrades[flowerunlock_1].count;});
var flowerunlock_3 = registerCropUnlock(flower_3, getFlowerCost(3), berry_8, function(){return !!state.upgrades[flowerunlock_2].count;});
var flowerunlock_4 = registerCropUnlock(flower_4, getFlowerCost(4), berry_10, function(){return !!state.upgrades[flowerunlock_3].count;});
var flowerunlock_5 = registerCropUnlock(flower_5, getFlowerCost(5), berry_12, function(){return !!state.upgrades[flowerunlock_4].count;});
var flowerunlock_6 = registerCropUnlock(flower_6, getFlowerCost(6), berry_14, function(){return !!state.upgrades[flowerunlock_5].count;});

upgrade_register_id = 100;
var nettleunlock_0 = registerCropUnlock(nettle_0, getNettleCost(0), undefined, function() {
  // prev_crop is mush_1, but also unlock once higher level berries available, in case player skips placing this mushroom
  if(state.fullgrowncropcount[mush_1]) return true;
  if(state.fullgrowncropcount[berry_4]) return true; // the berry after mush_1
  //if(state.upgrades[berryunlock_4].count) return true; // the berry after mush_1
  return false;
});

upgrade_register_id = 110;
var mistletoeunlock_0 = registerCropUnlock(mistletoe_0, getMushroomCost(0).mulr(2), undefined, function() {
  if(!(state.g_numresets > 0 && state.upgrades2[upgrade2_mistletoe].count)) return false;

  if(state.upgrades2[upgrade2_blueberrysecret].count && state.upgrades[berryunlock_1].count) return true;

  // prev_crop is berry_1, but also unlock once higher level berries available, in case player skips placing this berry
  if(state.fullgrowncropcount[berry_1]) return true;
  return false;
});

upgrade_register_id = 120;
var beeunlock_0 = registerCropUnlock(bee_0, getBeehiveCost(0), undefined, function() {
  if(!state.challenges[challenge_bees].completed) return false;

  // prev_crop is flower_2, but also unlock once higher level berries available, in case player skips placing this flower
  if(state.fullgrowncropcount[flower_2]) return true;
  if(state.fullgrowncropcount[berry_7]) return true; // the berry after flower_2
  //if(state.upgrades[berryunlock_7].count) return true; // the berry after flower_2

  return false;
});

//shortunlock_0 does not exist, you start with that berry type already unlocked

////////////////////////////////////////////////////////////////////////////////

// power increase for crop production (not flower boost) by basic upgrades
var berry_upgrade_power_increase = 1.25; // multiplicative
var mushroom_upgrade_power_increase = 1.25; // multiplicative
// cost increase for crop production (not flower boost) by basic upgrades
var basic_upgrade_cost_increase = 1.65;

// how much more expensive than the base cost of the crop is the upgrade cost
var basic_upgrade_initial_cost = 10;

var flower_upgrade_power_increase = 0.5;
var flower_upgrade_cost_increase = 2.5;
var flower_upgrade_initial_cost = 15;

var nettle_upgrade_power_exponent = 1.05;

var beehive_upgrade_power_increase = 0.5; // additive
var beehive_upgrade_cost_increase = 5;
var beehive_upgrade_power_exponent = 1.05;

upgrade_register_id = 125;
var berrymul_0 = registerCropMultiplier(berry_0, getBerryCost(0).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_0);
var berrymul_1 = registerCropMultiplier(berry_1, getBerryCost(1).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_1);
var berrymul_2 = registerCropMultiplier(berry_2, getBerryCost(2).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_2);
var berrymul_3 = registerCropMultiplier(berry_3, getBerryCost(3).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_3);
var berrymul_4 = registerCropMultiplier(berry_4, getBerryCost(4).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_4);
var berrymul_5 = registerCropMultiplier(berry_5, getBerryCost(5).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_5);
var berrymul_6 = registerCropMultiplier(berry_6, getBerryCost(6).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_6);
var berrymul_7 = registerCropMultiplier(berry_7, getBerryCost(7).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_7);
var berrymul_8 = registerCropMultiplier(berry_8, getBerryCost(8).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_8);
var berrymul_9 = registerCropMultiplier(berry_9, getBerryCost(9).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_9);
var berrymul_10 = registerCropMultiplier(berry_10, getBerryCost(10).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_10);
var berrymul_11 = registerCropMultiplier(berry_11, getBerryCost(11).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_11);
var berrymul_12 = registerCropMultiplier(berry_12, getBerryCost(12).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_12);
var berrymul_13 = registerCropMultiplier(berry_13, getBerryCost(13).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_13);
var berrymul_14 = registerCropMultiplier(berry_14, getBerryCost(14).mulr(basic_upgrade_initial_cost), berry_upgrade_power_increase, 1, berryunlock_14);

upgrade_register_id = 150;
var mushmul_0 = registerCropMultiplier(mush_0, getMushroomCost(0).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_0);
var mushmul_1 = registerCropMultiplier(mush_1, getMushroomCost(1).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_1);
var mushmul_2 = registerCropMultiplier(mush_2, getMushroomCost(2).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_2);
var mushmul_3 = registerCropMultiplier(mush_3, getMushroomCost(3).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_3);
var mushmul_4 = registerCropMultiplier(mush_4, getMushroomCost(4).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_4);
var mushmul_5 = registerCropMultiplier(mush_5, getMushroomCost(5).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_5);
var mushmul_6 = registerCropMultiplier(mush_6, getMushroomCost(6).mulr(basic_upgrade_initial_cost), mushroom_upgrade_power_increase, 1, mushunlock_6);

upgrade_register_id = 175;
var flowermul_0 = registerBoostMultiplier(flower_0, getFlowerCost(0).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_0, flower_upgrade_cost_increase);
var flowermul_1 = registerBoostMultiplier(flower_1, getFlowerCost(1).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_1, flower_upgrade_cost_increase);
var flowermul_2 = registerBoostMultiplier(flower_2, getFlowerCost(2).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_2, flower_upgrade_cost_increase);
var flowermul_3 = registerBoostMultiplier(flower_3, getFlowerCost(3).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_3, flower_upgrade_cost_increase);
var flowermul_4 = registerBoostMultiplier(flower_4, getFlowerCost(4).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_4, flower_upgrade_cost_increase);
var flowermul_5 = registerBoostMultiplier(flower_5, getFlowerCost(5).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_5, flower_upgrade_cost_increase);
var flowermul_6 = registerBoostMultiplier(flower_6, getFlowerCost(6).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, flowerunlock_6, flower_upgrade_cost_increase);

upgrade_register_id = 200;
var nettlemul_0 = registerBoostMultiplier(nettle_0, getNettleCost(0).mulr(10), flower_upgrade_power_increase, 1, nettleunlock_0, flower_upgrade_cost_increase);

upgrade_register_id = 205;
var shortmul_0 = registerShortCropTimeIncrease(short_0, Res({seeds:100}), 0.2, 1, undefined, function(){
  return (state.c_numplanted >= 1 || state.c_numplantedshort >= 5) && (state.c_numplantedshort >= 1);
});

upgrade_register_id = 215;
var beemul_0 = registerBoostMultiplier(bee_0, crops[bee_0].cost.mulr(10), beehive_upgrade_power_increase, 1, beeunlock_0, beehive_upgrade_cost_increase);



upgrade_register_id = 250;
var upgrade_mistunlock = registerUpgrade('mist ability', treeLevelReqBase(4).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 4) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_mistunlock].unlocked = true;
    state.upgrades[upgrade_mistunlock].count = 1;
    return true;
  }
  return false;
}, 1, 'While enabled, mist temporarily decreases mushroom seed consumption while increasing spore production of mushrooms. In addition, mushrooms are then not affected by winter. This active ability is enabled using its icon button at the top or the "2" key.', '#fff', '#88f', image_mist, undefined);
upgrades[upgrade_mistunlock].istreebasedupgrade = true;

var upgrade_sununlock = registerUpgrade('sun ability', treeLevelReqBase(2).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 2) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_sununlock].unlocked = true;
    state.upgrades[upgrade_sununlock].count = 1;
    return true;
  }
  return false;
}, 1, 'While enabled, the sun temporarily increases berry seed production. In addition, berries are then not affected by winter. This active ability is enabled using its icon button at the top or the "1" key.', '#ccf', '#88f', image_sun, undefined);
upgrades[upgrade_sununlock].istreebasedupgrade = true;

var upgrade_rainbowunlock = registerUpgrade('rainbow ability', treeLevelReqBase(6).mulr(0.05 * 0), function() {
  // nothing to do here, the fact that this upgrade's count is changed to 1 already enables it
}, function() {
  if(state.treelevel >= 6) {
    // auto apply this upgrade already for convenience. Cost ignored. It was too annoying to have to indirectly have this extra step of applying the upgrade.
    state.upgrades[upgrade_rainbowunlock].unlocked = true;
    state.upgrades[upgrade_rainbowunlock].count = 1;
    return true;
  }
  return false;
}, 1, 'While enabled, flowers get a boost, and in addition are not affected by winter. This active ability is enabled using its icon button at the top or the "3" key.', '#ccf', '#00f', image_rainbow, undefined);
upgrades[upgrade_rainbowunlock].istreebasedupgrade = true;


var choice_text = 'CHOICE upgrade. Disables the other matching choice, choose wisely. ';

upgrade_register_id = 275;

var fern_choice0_a_minutes = 7;
var fern_choice0_b_bonus = 0.25;

var fern_choice0 = registerChoiceUpgrade('fern choice',
  function() {
    return state.treelevel >= 3;
  }, function() {
  },
 'Slower ferns', 'Richer ferns',
 'Ferns take ' + (fern_wait_minutes + fern_choice0_a_minutes) + ' instead of ' + fern_wait_minutes + ' minutes to appear, but contain enough resources to make up the difference exactly. This allows to collect more fern resources during idle play, but has no effect on the overall fern income during active play. This starts taking effect only for the next fern that appears.',
 'Ferns contain on average ' + (fern_choice0_b_bonus * 100) + '% more resources, but they\'ll appear as often as before so this benefits active play more than idle play. This starts taking effect only for the next fern that appears.',
 '#000', '#fff', images_fern[0], undefined);
upgrades[fern_choice0].istreebasedupgrade = true;

// pre version 0.1.15
var fern_choice0_b = registerDeprecatedUpgrade();



// pre version 0.1.6
var mist_choice0_a = registerDeprecatedUpgrade();
var mist_choice0_b = registerDeprecatedUpgrade();
var sun_choice0_a = registerDeprecatedUpgrade();
var sun_choice0_b = registerDeprecatedUpgrade();
var rainbow_choice0_a = registerDeprecatedUpgrade();
var rainbow_choice0_b = registerDeprecatedUpgrade();

var active_choice0_b_bonus = 0.25;

var active_choice0 = registerChoiceUpgrade('weather choice',
  function() {
    return state.treelevel >= 8;
  }, function() {
    if(state.upgrades[active_choice0].count == 1) {
      // compensate for the doubling of their duration, avoid that doing this upgrade causes suddenly having weather abilities that looked available, be non-available
      if(state.time - state.suntime > sun_duration) state.suntime -= sun_wait;
      if(state.time - state.misttime > mist_duration) state.misttime -= mist_wait;
      if(state.time - state.rainbowtime > rainbow_duration) state.rainbowtime -= rainbow_wait;
    }
  },
 'Long weather', 'Strong weather',
 'Makes the active weather abilities run twice as long, but also twice as long to recharge. This benefits idle play, but gives on average no benefit for active play.',
 'Increases all active ability weather effects by ' + (active_choice0_b_bonus * 100) + '%. The active abilities recharge time remains the same so this benefits active play more than idle play.',
 '#000', '#fff', image_sun, undefined);
upgrades[active_choice0].istreebasedupgrade = true;

// pre version 0.1.15
var active_choice0_b = registerDeprecatedUpgrade();



upgrade_register_id = 400;

var challengeflowermul_0 = registerBoostMultiplier(challengeflower_0, Res({seeds:1000}).mulr(flower_upgrade_initial_cost), flower_upgrade_power_increase, 1, undefined, flower_upgrade_cost_increase); // aster flower for bee challenge

var challengecropmul_0 = registerBoostMultiplier(challengecrop_0, crops[challengecrop_0].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_0].description = 'boosts the worker bee boost ' + upgrades[challengecropmul_0].bonus.toPercentString() +  ' (additive)';

var challengecropmul_1 = registerBoostMultiplier(challengecrop_1, crops[challengecrop_1].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_1].description = 'boosts the queen bee boost ' + upgrades[challengecropmul_1].bonus.toPercentString() +  ' (additive)';

var challengecropmul_2 = registerBoostMultiplier(challengecrop_2, crops[challengecrop_2].cost.mulr(10), Num(0.5), 1, undefined, 10); // worker bee
upgrades[challengecropmul_2].description = 'boosts the beehive boost ' + upgrades[challengecropmul_2].bonus.toPercentString() +  ' (additive)';

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// @constructor
// aka achievement
function Medal() {
  this.name = 'a';
  this.conditionfun = undefined;

  // production multiplier given by this medal, additively added to the global medal-multiplier, e.g. 0.01 for 1%
  this.prodmul = Num(0);

  this.hint = undefined; // if the medal with id hint is unlocked, then reveals the existance of this medal in the UI (but does not unlock it)

  this.icon = undefined;

  this.index = 0; // its index in registered_medals
  this.order = 0; // its index in medals_order
};

// Tier for achievement images if no specific one given, maps to zinc, copper, silver, electrum, gold, etc..., see images_medals.js
Medal.prototype.getTier = function() {
  var percent = this.prodmul.mulr(100);
  if(percent.ltr(1)) return 0;
  if(percent.ltr(3)) return 1;
  if(percent.ltr(7.5)) return 2;
  if(percent.ltr(15)) return 3;
  if(percent.ltr(30)) return 4;
  if(percent.ltr(75)) return 5;
  if(percent.ltr(150)) return 6;
  if(percent.ltr(300)) return 7;
  if(percent.ltr(750)) return 8;
  if(percent.ltr(1500)) return 9;
  return 10;
};

var registered_medals = []; // indexed consecutively, gives the index to medal
var medals = []; // indexed by medal index (not necessarily consectuive)
var medals_order = []; // display order of the medals, contains the indexes in medals array

var medal_register_id = -1;

// where = index of medal to put this one behind in display order
function changeMedalDisplayOrder(index, where) {
  if(where > index) throw 'can only move order backward for now';
  var a = medals[where];
  var b = medals[index];

  var from = a.order + 1;
  var to = b.order;
  for(var i = to; i > from; i--) {
    medals_order[i] = medals_order[i - 1];
  }
  medals_order[from] = index;
  b.order = from;
}

function registerMedal(name, description, icon, conditionfun, prodmul) {
  if(medals[medal_register_id] || medal_register_id < 0 || medal_register_id > 65535) throw 'medal id already exists or is invalid!';

  var medal = new Medal();
  medal.index = medal_register_id++;
  medals[medal.index] = medal;
  registered_medals.push(medal.index);

  medal.name = name;
  medal.description = description;
  medal.icon = icon;
  medal.conditionfun = conditionfun;
  medal.prodmul = prodmul;

  medal.order = medals_order.length;
  medals_order[medal.order] = medal.index;

  if(!icon) medal.icon = medalgeneric[medal.getTier()];

  return medal.index;
}

var genericicon = undefined; // use default generic medal icon. value is undefined, just given a name here.

medal_register_id = 0;
var medal_crowded_id = registerMedal('crowded', 'planted something on every single field cell. Time to delete crops when more room is needed!', genericicon, function() {
  if(state.numemptyfields != 0) return false;
  // why - 4: 2 are for the tree. And the other 3: allow having two temporary crops and yet still be valid for getting this achievement. The "numemptyfields" check above ensures there's at least something present on those two remaining non-full-permanent-plant spots.
  // why allowing 3 short-lived crops: this achievement is supposed to come somewhat early and has a tutorial function (explain delete), so ensure it doesn't accidently come way too late when someone is using short-lived crops for their boost continuously.
  return state.numfullpermanentcropfields >= state.numw * state.numh - 5;
}, Num(0.02));
registerMedal('fern 100', 'clicked 100 ferns', images_fern[0], function() { return state.g_numferns >= 100; }, Num(0.01));
registerMedal('fern 1000', 'clicked 1000 ferns', images_fern[0], function() { return state.g_numferns >= 1000; }, Num(0.05));
registerMedal('fern 10000', 'clicked 10000 ferns', images_fern[0], function() { return state.g_numferns >= 10000; }, Num(0.2));

var prevmedal;

medal_register_id = 4;
var seeds_achievement_values =            [1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e36, 1e42, 1e48, 1e54, 1e60, 1e72];
var seeds_achievement_bonuses_percent =   [0.1, 0.3, 0.5,    1,    2,    3,   4,     5,    6,    7,    8,   10,   12,   15,   30,   50];
for(var i = 0; i < seeds_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(seeds_achievement_values[i]);
  var full = getLatinSuffixFullNameForNumber(num.mulr(1.1)); // the mulr is to avoid numerical imprecision causing the exponent to be 1 lower and hence the wrong name
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = full + ' seeds';
  var id = registerMedal(name, 'have over ' + s0 + ' (' + s1 + ') seeds', image_seed,
      bind(function(num) { return state.res.seeds.gt(num); }, num),
      Num(seeds_achievement_bonuses_percent[i]).mulr(0.01));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}


medal_register_id = 39;
var planted_achievement_values =  [   5,   50,  100,  200,  500,  1000,  1500, 2000, 5000];
var planted_achievement_bonuses = [0.01, 0.01, 0.02, 0.02, 0.05,  0.05,   0.1,  0.1,  0.2];
for(var i = 0; i < planted_achievement_values.length; i++) {
  var a = planted_achievement_values[i];
  var b = planted_achievement_bonuses[i];
  var name = 'planted ' + a;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series, ' + name + ', unlocks at ' + a + ' planted.';
  var id = registerMedal(name, 'Planted ' + a + ' or more permanent plants over the course of the game', blackberry[0],
      bind(function(a) { return state.g_numfullgrown >= a; }, a),
      Num(b));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}
medal_register_id += 20; // a few spares for this one

// TODO: have more tree level medals here. But decide this when the game is such that those levels are actually reachable to know what are good values
var level_achievement_values =    [   5,   10,   15,   20,  25,  30,  35,  40,  45,  50,  60,  70,  80,  90,  100,  150];
var level_achievement_bonueses =  [0.02, 0.03, 0.05,  0.1, 0.2, 0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.7, 0.8, 0.9,    1,  1.5];
for(var i = 0; i < level_achievement_values.length; i++) {
  var level = Num(level_achievement_values[i]);
  var bonus = level.divr(200);
  var s = level.toString(5, Num.N_FULL);
  var name = 'tree level ' + s;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + s + '.';
  var id = registerMedal(name, 'Reached tree level ' + s, tree_images[treeLevelIndex(level)][1][1],
      bind(function(level) { return level.lter(state.treelevel); }, level),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

// TODO: from now on, clearly define the value of a new medal series right before it, rather than the "+= 20" system from above, to prevent no accidental changing of all achievement IDs
medal_register_id = 104;
var season_medal = registerMedal('four seasons', 'reached winter and seen all seasons', field_winter[0], function() { return getSeason() == 3; }, Num(0.05));

medal_register_id = 110;
registerMedal('watercress', 'plant the entire field full of watercress', watercress[4], function() {
  return state.croptypecount[CROPTYPE_SHORT] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('berries', 'plant the entire field full of berries', blackberry[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_BERRY] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('flowers', 'plant the entire field full of flowers. Pretty, at least that\'s something', clover[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_FLOWER] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('mushrooms', 'plant the entire field full of mushrooms. I, for one, respect our new fungus overlords.', champignon[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_MUSH] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('stingy situation', 'plant the entire field full of nettles', nettle[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_NETTLE] == state.numw * state.numh - 2;
}, Num(0.01));
registerMedal('mistletoes', 'plant the entire field full of mistletoes. You know they only work next to the tree, right?', mistletoe[4], function() {
  return state.fullgrowncroptypecount[CROPTYPE_MISTLETOE] == state.numw * state.numh - 2;
}, Num(0.05));
registerMedal('not the bees', 'build the entire field full of beehives.', images_beehive[0], function() {
  return state.fullgrowncroptypecount[CROPTYPE_BEE] == state.numw * state.numh - 2;
}, Num(0.1));
registerMedal('unbeelievable', 'fill the entire field with bees and/or beehives during the bees challenge.', images_workerbee[4], function() {
  var num = state.fullgrowncropcount[challengecrop_0] + state.fullgrowncropcount[challengecrop_1] + state.fullgrowncropcount[challengecrop_2];
  return num == state.numw * state.numh - 2;
}, Num(0.2));
registerMedal('buzzy', 'fill the entire field with worker bees during the bees challenge.', images_workerbee[4], function() {
  return state.fullgrowncropcount[challengecrop_0] == state.numw * state.numh - 2;
}, Num(0.3));
registerMedal('royal buzz', 'fill the entire field with queen bees during the bees challenge.', images_queenbee[4], function() {
  return state.fullgrowncropcount[challengecrop_1] == state.numw * state.numh - 2;
}, Num(0.4));
registerMedal('unbeetable', 'fill the entire field with beehives during the bees challenge.', images_beehive[4], function() {
  return state.fullgrowncropcount[challengecrop_2] == state.numw * state.numh - 2;
}, Num(0.5));

medal_register_id = 125;
var numreset_achievement_values =   [   1,    5,   10,   20,   50,  100,  200,  500, 1000];
var numreset_achievement_bonuses =  [ 0.1,  0.2,  0.25,  0.3,  0.5,   1,    2,    3,    4];
for(var i = 0; i < numreset_achievement_values.length; i++) {
  var level = numreset_achievement_values[i];
  var bonus = Num(numreset_achievement_bonuses[i]);
  var name = 'transcend ' + level;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + level + '.';
  var id = registerMedal(name, 'Transcended ' + level + ' times', image_medaltranscend,
      bind(function(level) { return state.g_numresets >= level; }, level),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

function registerPlantTypeMedal(cropid, num) {
  var c = crops[cropid];
  var tier = c.tier;
  if(c.type == CROPTYPE_MUSH) tier = tier * 2 + 1;
  if(c.type == CROPTYPE_FLOWER) tier = tier * 2 + 2;
  if(c.type == CROPTYPE_NETTLE) tier = 3;
  if(c.type == CROPTYPE_MISTLETOE) tier = 4;
  if(c.type == CROPTYPE_BEE) tier = 6;
  var num2 = (Math.floor(num / 10) + 1);
  var t = Math.ceil((tier + 1) * Math.log(tier + 1.5));
  var mul = t * num2 / 100 * 0.25;
  return registerMedal(c.name + ' ' + num, 'have ' + num + ' fullgrown ' + c.name, c.image[4], function() {
    return state.fullgrowncropcount[cropid] >= num;
  }, Num(mul));
};

function registerPlantTypeMedals(cropid) {
  var id0 = registerPlantTypeMedal(cropid, 1);
  var id1 = registerPlantTypeMedal(cropid, 10); // easy to get for most crops, harder for flowers due to multiplier
  var id2 = registerPlantTypeMedal(cropid, 20);
  var id3 = registerPlantTypeMedal(cropid, 30); // requires bigger field
  medal_register_id += 1; // for possible future expansion...

  medals[id1].hint = id0;
  medals[id2].hint = id1;
  medals[id3].hint = id2;
};
medal_register_id = 149;
registerPlantTypeMedals(berry_0);
registerPlantTypeMedals(berry_1);
registerPlantTypeMedals(berry_2);
registerPlantTypeMedals(berry_3);
registerPlantTypeMedals(berry_4);
registerPlantTypeMedals(berry_5);
registerPlantTypeMedals(berry_6);
registerPlantTypeMedals(berry_7);
registerPlantTypeMedals(berry_8);
registerPlantTypeMedals(berry_9);
registerPlantTypeMedals(berry_10);
registerPlantTypeMedals(berry_11);
registerPlantTypeMedals(berry_12);
registerPlantTypeMedals(berry_13);
registerPlantTypeMedals(berry_14);
medal_register_id = 249;
registerPlantTypeMedals(mush_0);
registerPlantTypeMedals(mush_1);
registerPlantTypeMedals(mush_2);
registerPlantTypeMedals(mush_3);
registerPlantTypeMedals(mush_4);
registerPlantTypeMedals(mush_5);
registerPlantTypeMedals(mush_6);
medal_register_id = 299;
registerPlantTypeMedals(flower_0);
registerPlantTypeMedals(flower_1);
registerPlantTypeMedals(flower_2);
registerPlantTypeMedals(flower_3);
registerPlantTypeMedals(flower_4);
registerPlantTypeMedals(flower_5);
registerPlantTypeMedals(flower_6);
medal_register_id = 349;
registerPlantTypeMedals(nettle_0);
medal_register_id = 359;
registerPlantTypeMedals(mistletoe_0);
medal_register_id = 369;
registerPlantTypeMedals(bee_0);


medal_register_id = 400;
registerMedal('5 ethereal crops', 'Have 5 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 5;
}, Num(0.02));
registerMedal('10 ethereal crops', 'Have 10 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 10;
}, Num(0.05));
registerMedal('20 ethereal crops', 'Have 20 ethereal crops', undefined, function() {
  return state.numfullgrowncropfields2 >= 20;
}, Num(0.1));

medal_register_id = 500;
var fruit_achievement_values =   [   5,   10,   20,   50,  100,  200,  500, 1000, 2000, 5000, 10000];
var fruit_achievement_bonuses =  [0.02, 0.05, 0.05, 0.05,  0.1,  0.1,  0.2,  0.5,  0.5,    1,     1];
var fruit_achievement_images =   [   0,    1,    2,    3,    4,    5,    6,    7,    8,    9,    10];
for(var i = 0; i < fruit_achievement_values.length; i++) {
  var num = fruit_achievement_values[i];
  var bonus = Num(fruit_achievement_bonuses[i]);
  var name = 'fruits ' + num;
  var id = registerMedal(name, 'Found ' + num + ' fruits', images_apple[fruit_achievement_images[i]],
      bind(function(num) { return state.g_numfruits >= num; }, num),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

medal_register_id = 600;

// those higher values like 500 are probably never reachable unless something fundamental is changed to the game design in the future, but that's ok,
// not all medals that are in the code must be reachable.
var level2_achievement_values =  [1, 2, 3, 4, 5, 7, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500];
for(var i = 0; i < level_achievement_values.length; i++) {
  var level = Num(level2_achievement_values[i]);
  var bonus = level.divr(20);
  var s = level.toString(5, Num.N_FULL);
  var name = 'ethereal tree level ' + s;
  //if(i > 0) medals[prevmedal].description += '. Next achievement in this series unlocks at level ' + s + '.';
  var id = registerMedal(name, 'Reached ethereal tree level ' + s, tree_images[treeLevelIndex(level)][1][4],
      bind(function(level) { return level.lter(state.treelevel2); }, level),
      bonus);
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

medal_register_id = 700;

var resin_achievement_values =           [10,1e2,1e3,1e4,1e5,1e6,1e7,1e8,1e9,1e12,1e15,1e18,1e21,1e24,1e27];
var resin_achievement_bonuses_percent =  [ 1,  2,  5, 10, 15, 20, 25, 30, 40,  50,  60,  70,  80,  90, 100];
for(var i = 0; i < resin_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var num = Num(resin_achievement_values[i]);
  var full = getLatinSuffixFullNameForNumber(num.mulr(1.1)); // the mulr is to avoid numerical imprecision causing the exponent to be 1 lower and hence the wrong name
  var s0 = num.toString(3, Num.N_LATIN);
  var s1 = num.toString(3, Num.N_SCI);
  var name = full + ' resin ';
  var name2 = (num.ltr(900)) ? (s0) : (s0 + ' (' + s1 + ')');
  var id = registerMedal(name, 'earned over ' + name2 + ' resin in total', image_resin,
      bind(function(num) { return state.g_res.resin.gt(num); }, num),
      Num(resin_achievement_bonuses_percent[i]).mulr(0.01));
  if(i > 0) medals[id].hint = prevmedal;
  prevmedal = id;
}

medal_register_id = 800;

registerMedal('help', 'viewed the main help dialog', undefined, function() {
  return showing_help == true;
}, Num(0.01));

registerMedal('changelog', 'viewed the changelog', undefined, function() {
  return showing_changelog == true;
}, Num(0.01));

registerMedal('stats', 'viewed the player stats', undefined, function() {
  return showing_stats == true;
}, Num(0.01));

medal_register_id = 810;

var gametime_achievement_values =           [1,  7, 30];
var gametime_achievement_bonuses_percent =  [1, 5, 10];
for(var i = 0; i < gametime_achievement_values.length; i++) {
  // have a good spread of this medal, more than exponential growth for its requirement
  var days = gametime_achievement_values[i];
  var name = days + ' ' + (days == 1 ? 'day' : 'days');
  var id = registerMedal(name, 'played for ' + days + ' days', undefined,
      bind(function(days) {
        var play = (state.time - state.g_starttime) / (24 * 3600);
        return play >= days;
      }, days),
      Num(gametime_achievement_bonuses_percent[i]).mulr(0.01));
}

medal_register_id = 820;

registerMedal('higher transcension', 'performed transcension at exactly twice the initial transcenscion level', undefined, function() {
  // This is a bit of a hacky way to check this, but the goal is that you get the medal when
  // you transcended (so tree level is definitely smaller than 20) and have had at least the
  // tree level 20 to do so. Since this medal was only added to the game at a later point in time,
  // this method of checking also allows players who did transcenscion II in the past but not
  // during the current run to receive it
  return state.g_treelevel >= 20 && state.treelevel < 20;
}, Num(0.1));

medal_register_id = 900;

registerMedal('the bees knees', 'completed the bees challenge', images_queenbee[4], function() {
  return !!state.challenges[challenge_bees].completed;
}, Num(0.1));

var medal_rock0 = registerMedal('on the rocks', 'completed the rocks challenge', images_rock[1], function() {
  return !!state.challenges[challenge_rocks].completed;
}, Num(0.05));

registerMedal('undeleted', 'completed the undeletable challenge', undefined, function() {
  return !!state.challenges[challenge_nodelete].completed;
}, Num(0.25));

registerMedal('upgraded', 'completed the no upgrades challenge', upgrade_arrow, function() {
  return state.challenges[challenge_noupgrades].completed >= 1;
}, Num(0.25));

registerMedal('upgradeder', 'completed the no upgrades challenge stage 2', upgrade_arrow, function() {
  return state.challenges[challenge_noupgrades].completed >= 2;
}, Num(0.5));

registerMedal('withering', 'completed the wither challenge', undefined, function() {
  return state.challenges[challenge_wither].completed >= 1;
}, Num(0.35));

registerMedal('withered', 'completed the wither challenge stage 2', undefined, function() {
  return state.challenges[challenge_wither].completed >= 2;
}, Num(0.7));

registerMedal('berry basic', 'completed the blackberry challenge', blackberry[4], function() {
  return state.challenges[challenge_blackberry].completed >= 1;
}, Num(1.0));

registerMedal('B', 'place a beehive during the blackberry challenge', images_beehive[4], function() {
  return state.challenge == challenge_blackberry && state.fullgrowncropcount[bee_0] > 0;
}, Num(1.5));

var medal_rock1 = registerMedal('rock lobster', 'completed the rocks challenge stage 2', images_rock[2], function() {
  return state.challenges[challenge_rocks].completed >= 2;
}, Num(0.15));
changeMedalDisplayOrder(medal_rock1, medal_rock0);

var medal_rock2 = registerMedal('this rocks!', 'completed the rocks challenge stage 3', images_rock[3], function() {
  return state.challenges[challenge_rocks].completed >= 3;
}, Num(0.45));
changeMedalDisplayOrder(medal_rock2, medal_rock1);

medal_register_id = 920;

registerMedal('rock solid', 'completed the rockier challenge', images_rock[0], function() {
  return state.challenges[challenge_rockier].completed;
}, Num(2));

registerMedal('rock solid II', 'completed the rockier challenge map 2', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 2;
}, Num(2.5));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid III', 'completed the rockier challenge map 3', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 3;
}, Num(3));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid IV', 'completed the rockier challenge map 4', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 4;
}, Num(3.5));
medals[medal_register_id - 1].hint = medal_register_id - 2;

registerMedal('rock solid V', 'completed the rockier challenge map 5 (final)', images_rock[0], function() {
  return state.challenges[challenge_rockier].num_completed >= 5;
}, Num(4));
medals[medal_register_id - 1].hint = medal_register_id - 2;

medal_register_id = 930;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// @constructor
function Challenge() {
  this.name = 'a';
  this.description = 'a';
  this.rewarddescription = ['a'];
  this.unlockdescription = 'a';
  this.index = 0;

  // whether during this challenge, resin/twigs/fruit is given out or not
  // should be "false" for challenges that can have a benefit (even if it doesn't appear they do, like the bees challenge: it is much harder than main game, but has its own special bee crops that could theoretically give an advantage, so do not let such challenge farm resin)
  // can be true for challenges that are strictly harder than main game, e.g. "rocks" challenge where everything is the same except rocks that give no advantage, only guaranteed disadvantage
  // NOTE:
  // only can gain the resin if at least level 10 reached, to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also cannot gain resin if you reach higher level than highest level in main game: this in case a challenge is accidently broken, super easy, and allows gaining resin too easy that way
  this.allowsresin = false;
  // NOTE:
  // don't give out the lvl 5 fruit (or give it only at 10), to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also don't give out fruit if reaching higher level than with a regular run
  this.allowsfruits = false;
  // NOTE:
  // doesn't give out twigs before level 10, to be similar to regular game (since challenges can be quit early which would allow quick farming)
  // also don't give out fruit if reaching higher level than with a regular run
  this.allowstwigs = false;
  // for any of the above things: whether they're also allowed above the highest level of tree ever reached in regular game
  // this serves as a protection in case a challenge turns out to be too easy and makes farming easier than the main game
  // but for something like the rock challenge, this can be enabled
  // To be clear: you can still go beyond the highest level with this challenge if this is false. It just won't drop the above things.
  this.allowbeyondhighestlevel = false;

  this.targetlevel = [0];

  // how much does this challenge contribute to the global challenge bonus pool, per level
  // e.g. at 0.1, this challenge provides +10% production bonus per tree level reached during this challenge
  // this is additive for all challenges together.
  this.bonus = Num(0);

  this.prefun = function() {
    return false;
  };
  this.rewardfun = [function() {
  }];

  this.numCompleted = function(opt_include_current_run) {
    var completed = state.challenges[this.index].completed;
    if(opt_include_current_run && state.challenge == this.index && completed < this.targetlevel.length && state.treelevel >= this.targetlevel[completed]) completed++;
    return completed;
  };

  // use numCompleted to check if any stage at all was completed, or fullyCompleted to check all stages are completed
  this.fullyCompleted = function(opt_include_current_run) {
    return this.numCompleted(opt_include_current_run) >= this.targetlevel.length;
  };

  // returns either the reward level of the next stage, or if fully completed, that of the last stage
  this.nextTargetLevel = function(opt_include_current_run) {
    if(this.fullyCompleted(opt_include_current_run)) return this.targetlevel[this.targetlevel.length - 1];
    return this.targetlevel[this.numCompleted(opt_include_current_run)];
  };

  this.finalTargetLevel = function() {
    return this.targetlevel[this.targetlevel.length - 1];
  };

  // actual implementation of the challenge is not here, but depends on currently active state.challenge
};

var registered_challenges = []; // indexed consecutively, gives the index to medal
var challenges = []; // indexed by medal index (not necessarily consectuive

// 0 means no challenge
var challenge_register_id = 1;

// prefun = precondition to unlock the challenge
// rewardfun = for completing the challenge the first time. This function may be ran only once.
// allowflags: 1=resin, 2=fruits, 3=twigs, 8=beyond highest level
// rulesdescription must be a list of bullet points
function registerChallenge(name, targetlevel, bonus, description, rulesdescription, rewarddescription, unlockdescription, prefun, rewardfun, allowflags) {
  if(challenges[challenge_register_id] || challenge_register_id < 0 || challenge_register_id > 65535) throw 'challenge id already exists or is invalid!';

  if(!Array.isArray(targetlevel)) targetlevel = [targetlevel];
  if(!Array.isArray(rewarddescription)) rewarddescription = [rewarddescription];
  if(!Array.isArray(rewardfun)) rewardfun = [rewardfun];

  var challenge = new Challenge();
  challenge.index = challenge_register_id++;
  challenges[challenge.index] = challenge;
  registered_challenges.push(challenge.index);

  challenge.name = name;
  challenge.description = description;
  challenge.rulesdescription = rulesdescription;
  challenge.rewarddescription = rewarddescription;
  challenge.unlockdescription = unlockdescription;
  challenge.targetlevel = targetlevel;
  challenge.bonus = bonus;
  challenge.prefun = prefun;
  challenge.rewardfun = rewardfun;

  challenge.allowsresin = !!(allowflags & 1);
  challenge.allowsfruits = !!(allowflags & 2);
  challenge.allowstwigs = !!(allowflags & 4);
  challenge.allowbeyondhighestlevel = !!(allowflags & 8);

  return challenge.index;
}


// 1
var challenge_bees = registerChallenge('bee challenge', 10, Num(0.05),
'Grow bees during this challenge! This has different gameplay than the regular game. The bee types of this challenge don\'t exist in the main game and the beehive in the main game works very differently than the one in this challenge.',
`
• The only types of crop available are 1 berry type, 1 mushroom type, 1 flower type and 3 types of bee/beehive. They\'re all available from the beginning, and no others unlock.<br>
• Beehives boost neighboring queen bees<br>
• Queen bees boost neighboring worker bees.<br>
• Worker bees boost the global ecosystem: berries, mushrooms and flowers (so effectively cubic scaling). No neighboring require for this.<br>
• Worker bees must be next to a flower for their boost to apply, being next to a queen for the queen boost is optional but recommended.<br>
• "Neighbor" and "next to" mean the 4-neighborhood, so orthogonally touching.<br>
`,
'Beehives available in the regular game from now on after planting daisies. In the main game, beehives boost flowers.',
'having grown a daisy.',
function() {
  return state.fullgrowncropcount[flower_2] >= 1;
}, function() {
  // nothing here: the reward is unlocked indirectly by having this challenge marked complete
}, 0);

// 2
var challenge_rocks = registerChallenge('rocks challenge', [15, 45, 75], Num(0.03),
`The field has rocks on which you can't plant. The rock pattern is determined at the start of the challenge, and is generated with a 3-hour UTC time interval as pseudorandom seed, so you can get a new pattern every 3 hours.
`,
`
• All regular crops, upgrades, ... are available and work as usual<br>
• There are randomized unremovable rocks on the field, blocking the planting of crops<br>
`,
['one extra storage slot for fruits','one extra storage slot for fruits','one extra storage slot for fruits'],
'reaching tree level 15',
function() { return state.treelevel >= 15; },
[
function() { state.fruit_slots++; },
function() { state.fruit_slots++; },
function() { state.fruit_slots++; }
]
, 15);


// 3
var challenge_nodelete = registerChallenge('undeletable challenge', 25, Num(0.07),
`
During this challenge, no crops can be removed, only added. Ensure to leave spots open for future crops!
`,
`
• All regular crops, upgrades, ... are available and work as usual<br>
• No crops can be deleted, except watercress<br>
`,
'get and store 50% more ethereal deletion tokens',
'reaching tree level 27',
function() {
  return state.treelevel >= 27;
}, function() {
  // nothing here: the reward is unlocked indirectly by having this challenge marked complete
}, 15);
// idea: a harder version of this challenge that takes place on a fixed size field (5x5)


// 4
// reason why watercress upgrade is still present: otherwise it disappears after a minute, requiring too much manual work when one wants to upkeep the watercress
var challenge_noupgrades = registerChallenge('no upgrades challenge', [21, 25], Num(0.1),
`
During this challenge, crops cannot be upgraded.
`,
`
• Crops cannot be upgraded, except watercress<br>
• Ethereal upgrades, achievement boost, etc..., still apply as normal<br>
`,
['unlock the auto-upgrade ability of the automaton' ,'add more options to the auto-upgrade ability of the automaton'],
'reaching ethereal tree level 2 and having automaton',
function() {
  return state.treelevel2 >= 2 && haveAutomaton();
},
[
function() {
  state.automaton_unlocked[1] = Math.max(1, state.automaton_unlocked[1] || 0);
  showRegisteredHelpDialog(29);
  showMessage('Auto-upgrade unlocked!', C_AUTOMATON, 1067714398);
},
function() {
  state.automaton_unlocked[1] = Math.max(2, state.automaton_unlocked[1] || 0);
  for(var i = 1; i < state.automaton_autoupgrade_fraction.length; i++) {
    state.automaton_autoupgrade_fraction[i] = state.automaton_autoupgrade_fraction[0];
  }
  showRegisteredHelpDialog(30);
  showMessage('Auto-upgrade extra options unlocked!', C_AUTOMATON, 1067714398);
}
], 15);

// is an upgrade not available during challenge_noupgrades
// that is all crop upgrades, except watercress
function isNoUpgrade(u) {
  return u.iscropupgrade && u.index != shortmul_0;
}


// 5
// This challenge does not give resin, twigs or fruits. This challenge plants crops immediately, so it's easier to reach higher level faster while manually present
// If this challenge would hand out resin, it'd be possible to farm resin very fast at the cost of a lot of manual action, and this game tries to avoid that
// The reason for the no deletion rule is: crops produce less and less over time, so one could continuously replant crops to have the full production bar, but this too
// would be too much manual work, the no delete rule requires waiting for them to run out. But allowing to upgrade crops to better versions allows to enjoy a fast unlock->next crop cycle
var challenge_wither = registerChallenge('wither challenge', [30, 35], Num(0.1),
`
During this challenge, crops wither and must be replanted.
`,
`
• Planted crops are fullgrown immediately<br>
• Planted crops wither and disappear after 2 minutes<br>
• Crops gradually produce less and less as they wither<br>
• Cannot delete crops, they'll disappear over time instead, but you can replace crops immediately by more expensive crops of the same type.<br>
`,
['unlock the auto-plant ability of the automaton' ,'add more options to the auto-plant ability of the automaton'],
'reaching ethereal tree level 3 and having automaton with autoupgrade',
function() {
  return state.treelevel2 >= 3 && haveAutomaton() && state.automaton_unlocked[1];
},
[
function() {
  state.automaton_unlocked[2] = Math.max(1, state.automaton_unlocked[2] || 0);
  showRegisteredHelpDialog(31);
  showMessage('Auto-plant unlocked!', C_AUTOMATON, 1067714398);
},
function() {
  state.automaton_unlocked[2] = Math.max(2, state.automaton_unlocked[2] || 0);
  for(var i = 1; i < state.automaton_autoplant_fraction.length; i++) {
    state.automaton_autoplant_fraction[i] = state.automaton_autoplant_fraction[0];
  }
  showRegisteredHelpDialog(32);
  showMessage('Auto-plant extra options unlocked!', C_AUTOMATON, 1067714398);
}
], 0);

function witherDuration() {
  return 120;
  //return crops[short_0].getPlantTime();
}

// t must be in range 0-1 (1 representing full grown)
function witherCurve(t) {
  if(t < 0) return 0;
  if(t > 1) return 1;
  // make it not linear, but such that the wither gives a bit higher production in the beginning than linear dropoff would give
  // sqrt feels a bit to easy, so using a slightly higher power than 0.5
  return Math.pow(t, 0.66);
}

// 6
var challenge_blackberry = registerChallenge('blackberry challenge', [18], Num(0.1),
`
During this challenge, only the first tier of each crop type is available.
`,
`
• Only blackberries, champignons, clovers, nettle, beehives, watercress and mistletoe are available, from the beginning<br>
• Everything else works as normal<br>
`,
['unlock the auto-unlock ability of the automaton'],
'reaching ethereal tree level 4 and having automaton with auto-plant',
function() {
  return state.treelevel2 >= 4 && haveAutomaton() && state.automaton_unlocked[1] && state.automaton_unlocked[2];
},
[
function() {
  state.automaton_unlocked[3] = Math.max(1, state.automaton_unlocked[3] || 0);
  showMessage('Auto-unlock unlocked!', C_AUTOMATON, 1067714398);
  showRegisteredHelpDialog(33);
},
], 15);


// 7
var challenge_rockier = registerChallenge('rockier challenge', [40], Num(0.15),
`A harder version of the rocks challenge. The field has a difficult predetermined rock pattern. Beating the challenge the first time gives a new type of passive bonus. The patterns are very restrictive and don\'t benefit from field size above 5x5. This challenge is not a cakewalk, especially later patterns.
`,
`
• All regular crops, upgrades, ... are available and work as usual<br>
• There are unremovable rocks on the field, blocking the planting of crops<br>
• The rock pattern is predetermined, every time you beat the challenge it cycles to a next, harder, pattern<br>
• There are 5 patterns in total, each gives an achievement<br>
`,
'multiplicity for berries and mushrooms',
'reaching tree level 45',
function() {
  return state.treelevel >= 45;
}, function() {
  showRegisteredHelpDialog(34);
}, 15);

var rockier_layouts = [
  '0001000010100001001100011', '1001010000010011110101000', '0000010001000110100101000', '0100100001000011000011000', '0000000001000011100100000'
  // the following one is too difficult and omitted: 1101000000100001001000010
];

// the register order is not suitable for display order, so use different array
// this should be roughly the order challenges are unlocked in the game
var challenges_order = [challenge_rocks, challenge_rockier, challenge_bees, challenge_nodelete, challenge_noupgrades, challenge_wither, challenge_blackberry];


if(challenges_order.length != registered_challenges.length) {
  throw 'challenges order not same length as challenges!';
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// @constructor
function Crop2() {
  this.name = 'a';
  this.cost = Res();
  this.prod = Res(); // unused for ethereal crops...
  this.effect = Num(0); // amount of boost to basic field this crop gives, if any, for the relevant crop type
  this.index = 0;
  this.planttime = 0;
  this.boost = Num(0);
  this.tagline = '';
  this.image = undefined;
  this.treelevel2 = 0; // minimum treelevel2 to unlock this crop, this is for display purposes

  this.istemplate = false; // if true, is a placeholder template
};


Crop2.prototype.getCost = function(opt_adjust_count) {
  var mul = sameTypeCostMultiplier2;
  if(this.type == CROPTYPE_LOTUS) mul = sameTypeCostMultiplier_Lotus2;
  if(this.type == CROPTYPE_FERN2) mul = sameTypeCostMultiplier_Fern2;
  var countfactor = Math.pow(mul, state.crop2count[this.index] + (opt_adjust_count || 0));
  return this.cost.mulr(countfactor);
};


Crop2.prototype.getRecoup = function() {
  return this.getCost(-1).mulr(cropRecoup2);
};


Crop2.prototype.getPlantTime = function() {
  return this.planttime;
};


// for lotuses
Crop2.prototype.getEtherealBoost = function(f, breakdown) {
  var result = this.boost.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);

  return result;
};


var automatonboost = Num(0.25);

// boost to basic field
Crop2.prototype.getBasicBoost = function(f, breakdown) {
  var result = this.effect.clone();
  if(breakdown) breakdown.push(['base', true, Num(0), result.clone()]);



  // lotuses
  if(f) {
    var lotusmul = Num(1);
    var num = 0;

    for(var dir = 0; dir < 4; dir++) { // get the neighbors N,E,S,W
      var x2 = f.x + (dir == 1 ? 1 : (dir == 3 ? -1 : 0));
      var y2 = f.y + (dir == 2 ? 1 : (dir == 0 ? -1 : 0));
      if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
      var n = state.field2[y2][x2];
      if(n.hasCrop() && n.isFullGrown() && crops2[n.cropIndex()].type == CROPTYPE_LOTUS) {
        var boost = crops2[n.cropIndex()].getEtherealBoost(n);
        if(boost.neqr(0)) {
          lotusmul.addInPlace(boost);
          num++;
        }
      }
    }
    if(num) {
      result.mulInPlace(lotusmul);
      if(breakdown) breakdown.push(['lotuses (' + num + ')', true, lotusmul, result.clone()]);
    }
  }

  // automaton
  if(f) {
    var automatonmul = Num(1);
    var num = 0;

    for(var dir = 0; dir < 8; dir++) { // get the neighbors N,E,S,W,NE,SE,SW,NW
      var x2 = f.x + ((dir == 1 || dir == 4 || dir == 5) ? 1 : ((dir == 3 || dir == 6 || dir == 7) ? -1 : 0));
      var y2 = f.y + ((dir == 0 || dir == 4 || dir == 7) ? -1 : ((dir == 2 || dir == 5 || dir == 6) ? 1 : 0));
      if(x2 < 0 || x2 >= state.numw2 || y2 < 0 || y2 >= state.numh2) continue;
      var n = state.field2[y2][x2];
      if(n.hasCrop() && n.isFullGrown() && crops2[n.cropIndex()].type == CROPTYPE_AUTOMATON) {
        automatonmul.addInPlace(automatonboost);
        num++;
      }
    }
    if(num) {
      result.mulInPlace(automatonmul);
      if(breakdown) breakdown.push(['automaton', true, automatonmul, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_BERRY) {
    var u = state.upgrades2[upgrade2_berry];
    var u2 = upgrades2[upgrade2_berry];
    if(u.count > 0) {
      var mul_upgrade = Num(1).add(upgrade2_berry_bonus.mulr(u.count));
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  if(this.type == CROPTYPE_MUSH) {
    var u = state.upgrades2[upgrade2_mush];
    var u2 = upgrades2[upgrade2_mush];
    if(u.count > 0) {
      var mul_upgrade = Num(1).add(upgrade2_mush_bonus.mulr(u.count));
      result.mulInPlace(mul_upgrade);
      if(breakdown) breakdown.push(['upgrades (' + u.count + ')', true, mul_upgrade, result.clone()]);
    }
  }

  return result;
};

var registered_crops2 = []; // indexed consecutively, gives the index to crops2
var crops2 = []; // indexed by crop index
var crops2ByName = {};

var croptype2_tiers = [];

// 16-bit ID, auto incremented with registerCrop2, but you can also set it to a value yourself, to ensure consistent IDs for various crops2 (between savegames) in case of future upgrades
var crop2_register_id = -1;

function registerCrop2(name, treelevel2, cost, prod, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline, opt_croptype, opt_tier) {
  if(!image) image = missingplant;
  if(crops2[crop2_register_id] || crop2_register_id < 0 || crop2_register_id > 65535) throw 'crop2 id already exists or is invalid!';
  var crop = new Crop2();
  crop.index = crop2_register_id++;
  crops2[crop.index] = crop;
  crops2ByName[name] = crop;
  registered_crops2.push(crop.index);

  crop.name = name;
  crop.cost = cost;
  crop.prod = prod;
  crop.effect_description_short = effect_description_short;
  crop.effect_description_long = effect_description_long;
  crop.planttime = planttime;
  crop.image = image;
  crop.tagline = opt_tagline || '';

  // this boost is for lotuses only, that is, for crops that boost neighboring ethereal crops, not for crops that boost basic fields crops
  crop.boost = boost;

  crop.treelevel2 = treelevel2;


  crop.tier = opt_tier;
  crop.type = opt_croptype;

  if(opt_croptype != undefined && opt_tier != undefined) {
    if(!croptype2_tiers[opt_croptype]) croptype2_tiers[opt_croptype] = [];
    croptype2_tiers[opt_croptype][opt_tier] = crop;
  }

  return crop.index;
}

function registerBerry2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_BERRY, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerMushroom2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_MUSH, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerFlower2(name, treelevel2, tier, cost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_FLOWER, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerNettle2(name, treelevel2, tier, cost, boost, planttime, effect, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_NETTLE, tier);
  var crop = crops2[index];
  crop.effect = effect;
  return index;
}

function registerLotus2(name, treelevel2, tier, cost, boost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(boost), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_LOTUS, tier);
  var crop = crops2[index];
  return index;
}

function registerAutomaton2(name, treelevel2,  tier, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_AUTOMATON, tier);
  var crop = crops2[index];
  return index;
}

function registerFern2(name, treelevel2, tier, cost, planttime, effect_description_short, effect_description_long, image, opt_tagline) {
  var index = registerCrop2(name, treelevel2, cost, Res({}), Num(0), planttime, effect_description_short, effect_description_long, image, opt_tagline, CROPTYPE_FERN2, tier);
  var crop = crops2[index];
  return index;
}


crop2_register_id = 0;
var fern2_0 = registerFern2('fern', 0, 0, Res({resin:10}), 1.5, 'gives 100 * n^3 starter seeds', 'gives 100 * n^3 starter seeds after every transcension and also immediately now, with n the amount of ethereal ferns. First one gives 100, with two you get 800, three gives 2700, four gives 6400, and so on.', image_fern_as_crop);
var fern2_1 = registerFern2('fern II', 2, 1, Res({resin:200}), 1.5, 'gives 1000 * n^3 starter seeds', 'gives 1000 * n^3 starter seeds after every transcension and also immediately now, with n the amount of ethereal ferns. First one gives 1000, with two you get 8000, three gives 27000, four gives 64000, and so on.', image_fern_as_crop2);

crop2_register_id = 10;
var automaton2_0 = registerAutomaton2('automaton', 1, 0, Res({resin:10}), 1.5, 'Automates things', 'Automates things and unlocks crop templates. Can have max 1. The higher your ethereal tree level, the more it can automate and the more challenges it unlocks. See automaton tab.', images_automaton);

// berries2
crop2_register_id = 25;
var berry2_0 = registerBerry2('blackberry', 0, 0, Res({resin:10}), 60, Num(0.25), undefined, 'boosts berries in the basic field (additive)', blackberry);
var berry2_1 = registerBerry2('blueberry', 1, 1, Res({resin:100}), 120, Num(1), undefined, 'boosts berries in the basic field (additive)', blueberry);
var berry2_2 = registerBerry2('cranberry', 4, 2, Res({resin:100000}), 180, Num(4), undefined, 'boosts berries in the basic field (additive)', cranberry);

// mushrooms2
crop2_register_id = 50;
var mush2_0 = registerMushroom2('champignon', 0, 0, Res({resin:20}), 120, Num(0.25), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', champignon);
var mush2_1 = registerMushroom2('matsutake', 3, 1, Res({resin:20000}), 180, Num(1), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', matsutake);
var mush2_2 = registerMushroom2('morel', 5, 2, Res({resin:500e3}), 240, Num(4), undefined, 'boosts mushrooms spore production and consumption in the basic field (additive)', morel);

// flowers2
crop2_register_id = 75;
var flower2_0 = registerFlower2('clover', 0, 0, Res({resin:50}), 120, Num(0.25), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', clover);
var flower2_1 = registerFlower2('cornflower', 3, 1, Res({resin:25000}), 180, Num(1), undefined, 'boosts the boosting effect of flowers in the basic field (additive). No effect on ethereal neighbors here, but on the basic field instead.', cornflower);


crop2_register_id = 100;
var nettle2_0 = registerNettle2('nettle', 2, 0, Res({resin:200}), 0.25, 60, Num(0.35), undefined, 'boosts nettles in the basic field (additive).', nettle);

crop2_register_id = 150;
var lotus2_0 = registerLotus2('white lotus', 0, 0, Res({resin:50}), 0.5, 180, undefined, 'boosts the bonus effect of ethereal neighbors of type berry, mushroom, flower and nettle. No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', whitelotus);
var lotus2_1 = registerLotus2('pink lotus', 4, 1, Res({resin:250000}), 4, 240, undefined, 'boosts the bonus effect of ethereal neighbors of type berry, mushroom, flower and nettle. No effect if no appropriate neighbors. This crop boosts neighboring plants in the ethereal field, rather than boosting the basic field directly.', pinklotus);




// templates

function makeTemplate2(crop_id) {
  crops2[crop_id].istemplate = true;
  crops2[crop_id].cost = Res(0);
  return crop_id;
}

crop2_register_id = 300;
var berry2_template = makeTemplate2(registerBerry2('berry template', 0, -1, Res(), 0, Num(0), undefined, '', images_berrytemplate));
var mush2_template = makeTemplate2(registerMushroom2('mushroom template', 0, -1, Res(), 0, Num(0), undefined, '', images_mushtemplate));
var flower2_template = makeTemplate2(registerFlower2('flower template', 0, -1, Res(), 0, Num(0), undefined, '', images_flowertemplate));
var nettle2_template = makeTemplate2(registerNettle2('nettle template', 0, -1, Res(), 0, 0, Num(0), undefined, '', images_nettletemplate));
var lotus2_template = makeTemplate2(registerLotus2('lotus template', 0, -1, Res(), 0, 0, undefined, '', images_lotustemplate));
var fern2_template = makeTemplate2(registerFern2('fern template', 0, -1, Res(), 0, undefined, '', images_ferntemplate));
var automaton2_template = makeTemplate2(registerAutomaton2('automaton template', 0, -1, Res(), 0, undefined, '', images_automatontemplate));

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var registered_upgrades2 = []; // indexed consecutively, gives the index to upgrades
var upgrades2 = []; // indexed by upgrade index
var upgrades2ByName = {};


// same comment as crop_register_id
var upgrade2_register_id = -1;

// @constructor
function Upgrade2() {
  this.name = 'a';
  this.description = undefined; // longer description than the name, with details, shown if not undefined

  // function that applies the upgrade. takes argument n, integer, if > 1,
  // must have same effect as calling n times with 1.
  this.fun = undefined;

  this.index = 0; // index in the upgrades array

  this.maxcount = 1; // how many times can this upgrade be done in total (typical 1, some upgrades have many series, 0 for infinity)

  this.cost = Res();

  // style related, for the upgrade chip in upgrade UI
  this.bgcolor = '#8cf';
  this.bordercolor = '#ff0';
  this.image0 = undefined; // bg image, e.g. a plant
  this.image1 = undefined; // fg image, e.g. a level-up arrow in front of the plant

  // how much the cost of this upgrade increases when doing next one
  this.cost_increase = Num(1);

  this.deprecated = false; // no longer existing upgrade from earlier game version

  this.treelevel2 = 0; // minimum treelevel2 to unlock this upgrade, also can be considered the tier of the set the upgrade is in

  // gets the name, taking stage into account if it has stages
  this.getName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 1) name += ' ' + util.toRoman((state.upgrades2[this.index].count));
    return name;
  };

  // name of next instance of this upgrade, if multi-staged
  this.getNextName = function() {
    var name = this.name;
    if(state.upgrades2[this.index].count > 0) name += ' ' + util.toRoman((state.upgrades2[this.index].count + 1));
    return name;
  };

  // max amount of upgrades done, fully researched
  this.isExhausted = function() {
    if(this.maxcount == 0) return false; // can be done infinite times
    return state.upgrades2[this.index].count >= this.maxcount;
  };

  // can upgrade (ignoring resources needed), that is, it should be shown in the UI as a pressable button for upgrade that can be done noe
  this.canUpgrade = function() {
    return state.upgrades2[this.index].unlocked && !this.isExhausted();
  };
}

Upgrade2.prototype.getCost = function(opt_adjust_count) {
  var countfactor = Num.powr(this.cost_increase, state.upgrades2[this.index].count + (opt_adjust_count || 0));
  return this.cost.mul(countfactor);
};

// maxcount should be 1 for an upgrade that can only be done once (e.g. an unlock), or 0 for infinity
function registerUpgrade2(name, treelevel2, cost, cost_increase, fun, pre, maxcount, description, bgcolor, bordercolor, image0, image1) {
  if(upgrades2[upgrade2_register_id] || upgrade2_register_id < 0 || upgrade2_register_id > 65535) throw 'upgrades2 id already exists or is invalid!';
  var upgrade = new Upgrade2();
  upgrade.index = upgrade2_register_id++;
  upgrades2[upgrade.index] = upgrade;
  upgrades2ByName[name] = upgrade;
  registered_upgrades2.push(upgrade.index);


  upgrade.name = name;
  upgrade.cost = cost;
  upgrade.maxcount = maxcount;
  upgrade.cost_increase = Num(cost_increase);

  if(bgcolor) upgrade.bgcolor = bgcolor;
  if(bordercolor) upgrade.bordercolor = bordercolor;
  if(image0) upgrade.image0 = image0;
  if(image1) upgrade.image1 = image1;

  upgrade.fun = function() {
    state.upgrades2[this.index].count++;
    fun();
  };

  upgrade.pre = function() {
    if(!state.g_numresets) return false
    if(state.treelevel2 < treelevel2) return false;
    if(pre && !pre()) return false;
    return true;
  };

  upgrade.treelevel2 = treelevel2;

  upgrade.description = description;

  return upgrade.index;
}


// register an upgrade that was removed from the game so it's marked as invalid to not display it and remove from new saves
function registerDeprecatedUpgrade2() {
  var result = registerUpgrade2('<deprecated>', 99, Res(), 0, function(){}, function(){return false;}, 1, '<deprecated>');
  var u = upgrades2[result];
  u.deprecated = true;
  return result;
}


upgrade2_register_id = 10;
// deprecated for v0.1.9, but some may come back in a later version
registerDeprecatedUpgrade2(); // old upgrade2_seeds
registerDeprecatedUpgrade2(); // old upgrade2_spores
registerDeprecatedUpgrade2(); // old upgrade2_starting0
registerDeprecatedUpgrade2(); // old upgrade2_starting1
registerDeprecatedUpgrade2(); // old upgrade2_season[0]
registerDeprecatedUpgrade2(); // old upgrade2_season[1]
registerDeprecatedUpgrade2(); // old upgrade2_season[2]
registerDeprecatedUpgrade2(); // old upgrade2_season[3]
registerDeprecatedUpgrade2(); // old upgrade2_field6x6

upgrade2_register_id = 20;

var upgrade2_season_bonus = [0.25, 0.25, 0.25, 0.25];

var upgrade2_season = [];

// TODO: now limited to 2 times, allow more when the balancing shows it works out

upgrade2_season[0] = registerUpgrade2('improve spring', 0, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve spring effect ' + (upgrade2_season_bonus[0] * 100) + '% (scales by n^1.25). Spring boosts flowers.', undefined, undefined, tree_images[3][1][0]);

upgrade2_season[1] = registerUpgrade2('improve summer', 0, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve summer effect ' + (upgrade2_season_bonus[1] * 100) + '% (scales by n^1.25). Summer boosts berry production, this ethereal upgrade additionally slightly boosts mushrooms.', undefined, undefined, tree_images[3][1][1]);

upgrade2_season[2] = registerUpgrade2('improve autumn', 0, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'improve autumn effect ' + (upgrade2_season_bonus[2] * 100) + '% (scales by n^1.25). Autumn boosts mushroom production, this ethereal upgrade additionally slightly boosts berries.', undefined, undefined, tree_images[3][1][2]);

upgrade2_season[3] = registerUpgrade2('winter hardening', 0, Res({resin:10}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase winter tree warmth effect ' + (upgrade2_season_bonus[3] * 100) + '% (scales by n^1.25).', undefined, undefined, tree_images[3][1][3]);


// bases of exponentiation for treeLevelResin, depending on ethereal upgrade
var resin_base = 1.2;
var resin_base_resin_extraction = 1.25;
var resin_global_mul = 0.25;
var resin_global_add = 0.5; // this exists to tweak the resin income such that when reaching level 10 the first time, you get 10 resin, to be able to buy the first ethereal crop at first transcend
var resin_global_quad = 2; // this is tuned to make new resin_base a not too big nerve for levels around 20, 30, ... in the v0.1.64 change

// bases of exponentiation for treeLevelTwigs, depending on ethereal upgrade
var twigs_base = 1.25;
var twigs_base_twigs_extraction = 1.3;
var twigs_global_mul = 0.02;
var twigs_global_add = 0.55;
var twigs_global_quad = 1; // this is tuned to make new twigs_base a not too big nerve for levels around 20, 30, ... in the v0.1.64 change

var LEVEL2 = 0; // variable used for the required treelevel2 for groups of upgrades below

var upgrade2_time_reduce_0_amount = 90;

upgrade2_register_id = 25;
var upgrade2_time_reduce_0 = registerUpgrade2('growth speed', LEVEL2, Res({resin:25}), 2, function() {
}, function(){return true}, 0, 'basic plants grow up to ' + upgrade2_time_reduce_0_amount + ' seconds per upgrade level faster. This is soft-capped for already fast plants, a plant that already only takes ' + upgrade2_time_reduce_0_amount + ' seconds, will not get much faster. This improves the higher level slower plants more.', undefined, undefined, blackberry[0]);

var upgrade2_basic_tree_bonus = Num(0.02);
var treeboost_exponent_1 = 1.05; // basic
var treeboost_exponent_2 = 1.2; // from ethereal upgrade

var upgrade2_basic_tree = registerUpgrade2('basic tree boost bonus', LEVEL2, Res({resin:10}), 1.5, function() {
}, function(){return true}, 0, 'add ' + upgrade2_basic_tree_bonus.toPercentString() + ' to the basic tree production bonus per level (scales by n^' + treeboost_exponent_2 +  ').', undefined, undefined, tree_images[10][1][1]);

var upgrade2_extra_fruit_slot = registerUpgrade2('extra fruit slot', 0, Res({resin:50,essence:25}), 2, function() {
  state.fruit_slots++;
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[1]);


upgrade2_register_id = 50;
var upgrade2_field6x6 = registerUpgrade2('larger field 6x6', LEVEL2, Res({resin:100}), 1, function() {
  var numw = Math.max(6, state.numw);
  var numh = Math.max(6, state.numh);
  changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 5 && state.numh >= 5}, 1, 'increase basic field size to 6x6 tiles', undefined, undefined, field_summer[0]);


upgrade2_register_id = 99;
var upgrade2_mistletoe = registerUpgrade2('unlock mistletoe', LEVEL2, Res({resin:25}), 1, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true}, 1, 'Unlock mistletoe crop in the basic field. This crop will allow leveling up the ethereal tree through a basic field mechanic giving twigs, and the ethereal tree levels then allow to get next sets of ethereal upgrades and crops. The mistletoe will become available in the basic field when mushrooms become available and then needs to then be unlocked with a regular upgrade first as usual. Then it can be planted next to the basic tree to start getting twigs. This ethereal upgrade is the first step in that process, and this is ultimately required to progress to next stages of the game.', undefined, undefined, mistletoe[4]);

///////////////////////////
LEVEL2 = 1;

upgrade2_register_id = 100;

var upgrade2_resin_bonus = Num(0.25);
var upgrade2_resin = registerUpgrade2('resin gain', LEVEL2, Res({resin:50}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase resin gain from tree by ' + (upgrade2_resin_bonus * 100) + '% (additive).', undefined, undefined, image_resin);

function applyBlackberrySecret() {
  if(!state.upgrades[berryunlock_0].count) upgrades[berryunlock_0].fun();
  state.upgrades[shortmul_0].unlocked = true; // also let the watercress behave like others and have its upgrade already visible, since the upgrade tab already exists now from the start anyway
}

var upgrade2_blackberrysecret = registerUpgrade2('blackberry secret', LEVEL2, Res({resin:100}), 2, function() {
  applyBlackberrySecret();
}, function(){return true;}, 1,
'blackberry is unlocked immediately after a transcension, the upgrade to unlock it is no longer needed and given for free',
undefined, undefined, blackberry[4]);

var upgrade2_diagonal = registerUpgrade2('diagonal winter warmth', LEVEL2, Res({resin:150}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 1, 'the winter warmth effect of the tree works also diagonally, adding 4 more possible neighbor spots for this effect.', undefined, undefined, tree_images[5][1][3]);


var upgrade2_automaton = registerUpgrade2('unlock automaton', LEVEL2, Res({resin:100}), 2, function() {
  unlockEtherealCrop(automaton2_0);
  showRegisteredHelpDialog(28);
}, function(){return true;}, 1, 'the automaton can be placed in the ethereal field, and when placed, unlocks the automaton tab, allows to automate things, and allows to place crop templates', undefined, undefined, images_automaton[4]);


var upgrade2_twigs_bonus = Num(0.25);
var upgrade2_twigs = registerUpgrade2('twigs gain', LEVEL2, Res({resin:100}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase twigs gain from tree by ' + (upgrade2_twigs_bonus * 100) + '% (additive).',
undefined, undefined, mistletoe[1]);



///////////////////////////
LEVEL2 = 2;

upgrade2_register_id = 120;

var upgrade2_field2_6x6 = registerUpgrade2('ethereal field 6x6', LEVEL2, Res({resin:2000, twigs:2000}), 1, function() {
  var numw2 = Math.max(6, state.numw2);
  var numh2 = Math.max(6, state.numh2);
  changeField2Size(state, numw2, numh2);
  initField2UI();
}, function(){return state.numw2 >= 5 && state.numh2 >= 5}, 1, 'increase ethereal field size to 6x6 tiles', undefined, undefined, field_ethereal[0]);

var upgrade2_twigs_extraction = registerUpgrade2('twigs extraction', LEVEL2, Res({resin:10000}), 1, function() {
}, function(){return true;}, 1, 'increase the multiplier per level for twigs, giving exponentially more twigs at higher tree levels: base of exponentiation before: ' + twigs_base + ', after: ' + twigs_base_twigs_extraction,
undefined, undefined, mistletoe[1]);

var upgrade2_blueberrysecret = registerUpgrade2('blueberry secret', LEVEL2, Res({resin:1000}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){
  return state.upgrades2[upgrade2_blackberrysecret].count;
}, 1,
'blueberry\'s unlock is available from the start, and champignon\'s and mistletoe\'s unlock is available as soon as blueberry is unlocked, rather than after a blueberry has fullgrown',
undefined, undefined, blueberry[4]);



///////////////////////////
LEVEL2 = 3;

upgrade2_register_id = 140;

// NOTE: this upgrade is way too cheap for being at ethereal tree level 2 (and already upped it from 1000 to 5000 in v0.1.65). But too late to fix it since it's already been bought. It could be seen as a nice bonus for reaching ethereal tree level 3.
var upgrade2_extra_fruit_slot2 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:5000,essence:250}), 2, function() {
  state.fruit_slots++;
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[2]);




var upgrade2_resin_extraction = registerUpgrade2('resin extraction', LEVEL2, Res({resin:50e3}), 1, function() {
}, function(){return true;}, 1, 'increase the multiplier per level for resin, giving exponentially more resin at higher tree levels: base of exponentiation before: ' + resin_base + ', after: ' + resin_base_resin_extraction, undefined, undefined, image_resin);

var upgrade2_diagonal_mistletoes = registerUpgrade2('diagonal mistletoes', LEVEL2, Res({resin:75e3}), 1, function() {
}, function(){return true;}, 1, 'mistletoes also work diagonally to the tree (10 instead of 6 possible spots)', undefined, undefined, mistletoe[4]);


upgrade2_register_id = 145;
var upgrade2_field7x6 = registerUpgrade2('larger field 7x6', LEVEL2, Res({resin:100e3}), 1, function() {
  var numw = Math.max(7, state.numw);
  var numh = Math.max(6, state.numh);
  changeFieldSize(state, numw, numh);
}, function(){return state.numw >= 6 && state.numh >= 6}, 1, 'increase basic field size to 7x6 tiles', undefined, undefined, field_summer[0]);

// NOTE: further "secret" upgrades beyond this one are not needed, because at ethereal tree level 4, auto-unlock from the automaton becomes available, removing the need to manually wait for crops to unluck. The "secret" upgrades are a feature to slightly improve quality of the time before auto-unlock exists, but are not intended to speed up runs once auto-unlock exists, runs must have a certain long enough useful duration to avoid too manual gameplay
var upgrade2_cranberrysecret = registerUpgrade2('cranberry secret', LEVEL2, Res({resin:10000}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){
  return state.upgrades2[upgrade2_blueberrysecret].count;
}, 1,
'cranberry\'s unlock is available as soon as blueberry is unlocked, rather than after a blueberry has fullgrown, and clover\'s unlock is available as soon as cranberry is unlocked, rather than after a cranberry has fullgrown',
undefined, undefined, cranberry[4]);


///////////////////////////
LEVEL2 = 4;
upgrade2_register_id = 160;

var upgrade2_berry_bonus = Num(0.25);
var upgrade2_berry = registerUpgrade2('ethereal berries', LEVEL2, Res({resin:500e3}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal berries by ' + upgrade2_berry_bonus.toPercentString() + ' (additive).', undefined, undefined, cranberry[4]);

var upgrade2_mush_bonus = Num(0.25);
var upgrade2_mush = registerUpgrade2('ethereal mushrooms', LEVEL2, Res({resin:500e3}), 2, function() {
  // nothing to do, upgrade count causes the effect elsewhere
}, function(){return true;}, 0, 'increase bonus of all ethereal mushrooms by ' + upgrade2_berry_bonus.toPercentString() + ' (additive).', undefined, undefined, matsutake[4]);



///////////////////////////
LEVEL2 = 5;
upgrade2_register_id = 180;

var upgrade2_field2_7x6 = registerUpgrade2('ethereal field 7x6', LEVEL2, Res({resin:5e6, twigs:5e6}), 1, function() {
  var numw2 = Math.max(7, state.numw2);
  var numh2 = Math.max(6, state.numh2);
  changeField2Size(state, numw2, numh2);
  initField2UI();
}, function(){return state.numw2 >= 6 && state.numh2 >= 6}, 1, 'increase ethereal field size to 7x6 tiles', undefined, undefined, field_ethereal[0]);



var upgrade2_extra_fruit_slot3 = registerUpgrade2('extra fruit slot', LEVEL2, Res({resin:2e6,essence:10000}), 2, function() {
  state.fruit_slots++;
}, function(){return true;}, 1, 'gain an extra storage slot for fruits', undefined, undefined, images_apple[3]);



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// a function that starts at 0, and for x going towards infinity, outputs values towards 1 (horizontal asymptote at 1)
// this for e.g. effects of upgrades with diminishing returns
// h = when (for which x) should 50% (0.5) be reached
function towards1(x, h) {
  // some options for this:
  // *) atan(x) / (pi/2)
  // *) tanh(x)
  // *) erf(x): goes too fast to 1 and too horizontal once 1 reached
  // *) x / sqrt(x * x + 1)
  if(h == 0) return 1;
  x *= 0.57735 / h; // 0.57735 is the value such that towards1(h, h) returns 0.5
  return x / Math.sqrt(x * x + 1);
}


// fruit abilities
var fruit_index = 0;
var FRUIT_NONE = fruit_index++; // 0 means no ability
var firstFruitAbility = fruit_index;
var FRUIT_BERRYBOOST = fruit_index++; // boosts seed production of berries
var FRUIT_MUSHBOOST = fruit_index++; // boosts muchrooms spore production but also seed consumption
var FRUIT_MUSHEFF = fruit_index++; // decreases seed consumption of mushroom (but same spore production output) (mushroom ecomony)
var FRUIT_FLOWERBOOST = fruit_index++;
var FRUIT_WATERCRESS = fruit_index++; // watercress copying
var FRUIT_GROWSPEED = fruit_index++; // this one can be swapped when planting something. It's ok to have a few fruit types that require situational swapping
var FRUIT_WEATHER = fruit_index++; // idem
var FRUIT_NETTLEBOOST = fruit_index++;
// These seasonal abilities only exist for the appropriate seasonal fruit and do not take up a regular slot
var FRUIT_SPRING = fruit_index++;
var FRUIT_SUMMER = fruit_index++;
var FRUIT_AUTUMN = fruit_index++;
var FRUIT_WINTER = fruit_index++;
// BEWARE: only add new ones at the end, since the numeric index values are saved in savegames!
var numFruitAbilities = fruit_index - 1; // minus one because FRUIT_NONE doesn't count
// NOT TODO: one that extends lifetime of watercress --> do not do this: too much manual work required with swapping fruits when active playing with watercress then
// NOT TODO: one affecting ferns: same issue: causes too much manual work during active playing and counting on fern spawn times
// NOT TODO: one decreasing cost: would cause an annoying technique where you have to swap fruits all the time before planting anything
// NOT TODO, unless method of tracking resin multiplier over time is added: one increasing resin gain (or tree spore consumption), since then one can swap it right before tree levels
// TODO: one that boosts nettles; can be for later tier fruits with 3+ slots only, since it's similar to mushboost and musheff, but would be its own separate multiplier so in combination can be really powerful
// TODO: one that improves beehives, but only higher level fruits when it's very likely one already finished bee challenge

// returns the amount of boost of the ability, when relevant, for a given ability level in the fruit and the fruit tier
function getFruitBoost(ability, level, tier) {
  var base = Math.pow(getFruitTierCost(tier), 0.75) * 0.05;

  if(ability == FRUIT_BERRYBOOST) {
    return Num(base * level);
  }
  if(ability == FRUIT_MUSHBOOST) {
    return Num(base * level);
  }
  if(ability == FRUIT_MUSHEFF) {
    // this is a worse version of FRUIT_NETTLE, but not all fruits should have an awesome ability plus for later fruits with many slots this one still combines well together with FRUIT_NETTLE.
    var amount = towards1(level, 5);
    var max = 0.4 * (1 + 0.6 * tier / 11);
    return Num(max * amount);
  }
  if(ability == FRUIT_FLOWERBOOST) {
    return Num(base * level);
  }
  if(ability == FRUIT_WATERCRESS) {
    /*var amount = towards1(level, 10);
    var max = 1 + tier * 0.2;
    return Num(max * amount);*/
    return Num(base * 1.5 * level);
  }
  if(ability == FRUIT_GROWSPEED) {
    var amount = towards1(level, 5);
    var max = 0.4 * (1 + 0.6 * tier / 11);
    return Num(max * amount);
  }
  if(ability == FRUIT_WEATHER) {
    return Num(base * 1.5 * level);
  }
  if(ability == FRUIT_NETTLEBOOST) {
    // this is a better version of FRUIT_MUSHBOOST, so make its multiplier less strong than that one
    return Num(base * 0.33 * level);
  }
  if(ability == FRUIT_SPRING) {
    return Num(0.25); // not upgradeable
  }
  if(ability == FRUIT_SUMMER) {
    return Num(0.25); // not upgradeable
  }
  if(ability == FRUIT_AUTUMN) {
    return Num(0.25); // not upgradeable
  }
  if(ability == FRUIT_WINTER) {
    return Num(0.25); // not upgradeable
  }

  return Num(0.1);
}

// Is an ability that doesn't take up a regular fruit ability slot, but comes in addition
// Such ability cannot be upgraded
function isInherentAbility(ability) {
  if(ability == FRUIT_SPRING) return true;
  if(ability == FRUIT_SUMMER) return true;
  if(ability == FRUIT_AUTUMN) return true;
  if(ability == FRUIT_WINTER) return true;
  return false;
}

// cost for next level if ability is at this level
function getFruitAbilityCost(ability, level, tier) {
  var result = Num(1.5).powr(level);
  result = result.mulr(getFruitTierCost(tier));

  return Res({essence:result});
}

function getFruitSacrifice(f) {
  var result = getFruitTierCost(f.tier) * 10;

  if(f.type > 0) result *= 1.25;

  return Res({essence:result});
}

function getFruitTierCost(tier) {
  // half-exponential progression
  switch(tier) {
    case 0: return 1;
    case 1: return 4;
    case 2: return 12;
    case 3: return 30;
    case 4: return 45;
    case 5: return 65;
    case 6: return 100;
    case 7: return 120;
    case 8: return 160;
    case 9: return 240;
    case 10: return 300;
  }
  return Infinity;
}

// get fruit tier given random roll and tree level
function getNewFruitTier(roll, treelevel) {
  var tier = 0;

  // normally doesn't happen
  if(treelevel < 5) {
    return 0;
  }

  // level 5: zinc and bronze introduced
  if(treelevel >= 5 && treelevel <= 14) {
    return (roll > 0.25) ? 0 : 1;
  }

  // level 15: silver introduced
  if(treelevel >= 15 && treelevel <= 24) {
    return (roll < 0.25) ? 0 : ((roll < 0.75) ? 1 : 2);
  }

  // level 25
  if(treelevel >= 25 && treelevel <= 34) {
    return (roll > 0.75) ? 1 : 2;
  }

  // level 35: electrum introduced
  if(treelevel >= 35 && treelevel <= 44) {
    return (roll > 0.25) ? 2 : 3;
  }

  // level 45
  if(treelevel >= 45 && treelevel <= 54) {
    return (roll > 0.75) ? 2 : 3;
  }

  // level 55: gold introduced
  if(treelevel >= 55 && treelevel <= 64) {
    return (roll > 0.25) ? 3 : 4;
  }

  // level 65
  if(treelevel >= 65 && treelevel <= 74) {
    return (roll > 0.75) ? 3 : 4;
  }

  // Higher tree levels are not yet implemented for the fruits
  return 4;
}

// how many abilities should a fruit of this tier have (excluding any seasonal ability)
function getNumFruitAbilities(tier) {
  var num_abilities = 1;
  if(tier >= 1) num_abilities = 2;
  if(tier >= 3) num_abilities = 3;
  // These are not yet supported, this is preliminary
  if(tier >= 5) num_abilities = 4;
  if(tier >= 7) num_abilities = 5;
  return num_abilities;
}

// whether a fruit reached max charge of all skills, and is seasonal, and cannot be used anymore for fusing
// the reason is: otherwise you could keep using the fruit to fuse forever, transfering its abilities to seasonal fruit of choice permanently
function fruitReachedFuseMax(f) {
  if(f.type == 0) return false; // only seasonal fruits can have reached max
  // last charge is the seasonal ability, that one is not checked as it never increases
  for(var i = 0; i + 1 < f.charge.length; i++) {
    if(f.charge[i] < 2) return false;
  }
  return true;
}

/*
Chooses the start_level of a fruit ability, based on the two start_levels of two matching abilities of the two input fruits
*/
function fuseFruitStartLevel(a, b) {
  var min = Math.min(a, b);
  var max = Math.max(a, b);
  return Math.ceil(min * 0.75 + max * 0.25);
}

// opt_message: an array with a single string inside of it, that will be set to a message if there's a reason why fusing can't work
function fuseFruit(a, b, opt_message) {
  if(!a || !b) return null;
  if(a == b) return null;
  if(a.tier != b.tier) return null;

  // disabled, now that mixing seasonal types produces an apple there's no benefit from doing this
  /*if(fruitReachedFuseMax(a) || fruitReachedFuseMax(b)) {
    if(opt_message) opt_message[0] = 'One of the fruits reached the final form, seasonal fruit with all abilities at max, and cannot be fused any further.';
    return null;
  }*/

  var n = getNumFruitAbilities(a.tier);
  var na = a.abilities.length;
  var nb = b.abilities.length;

  var f = new Fruit();
  f.tier = a.tier;

  // the result becomes an apple if input types are mixed, or the exact type if they're the same
  f.type = (a.type == b.type) ? a.type : 0;

  // the seasonal ability
  if(f.type != 0) {
    f.abilities[n] = a.abilities[n];
    f.levels[n] = a.levels[n];
    f.starting_levels[n] = a.starting_levels[n];
    f.charge[n] = a.charge[n];
  }

  f.fuses = a.fuses + b.fuses + 1;

  f.name = a.name || b.name;
  f.mark = a.mark || b.mark;

  for(var i = 0; i < n; i++) {
    f.abilities[i] = a.abilities[i];
    f.charge[i] = a.charge[i];
  }

  var skip = {FRUIT_NONE:true, FRUIT_SPRING:true, FRUIT_SUMMER:true, FRUIT_AUTUMN:true, FRUIT_WINTER:true};

  var arr;

  var m = {};

  var ma = {};
  for(var i = 0; i < na; i++) {
    if(skip[a.abilities[i]]) continue;
    ma[a.abilities[i]] = a.charge[i];
    m[a.abilities[i]] = a.starting_levels[i];
  }

  var mb = {};
  for(var i = 0; i < nb; i++) {
    if(skip[b.abilities[i]]) continue;
    mb[b.abilities[i]] = b.charge[i];
    m[b.abilities[i]] = (m[b.abilities[i]] == undefined) ? b.starting_levels[i] : (fuseFruitStartLevel(m[b.abilities[i]], b.starting_levels[i]));
  }


  // charge up duplicate abilities

  for(var i = 0; i < n; i++) {
    var ability = f.abilities[i];
    if(skip[ability]) continue;
    if(mb[ability] == undefined) continue; // not duplicate

    var charge = ma[ability] + mb[ability] + 1;
    if(charge > 2) charge = 2;
    f.charge[i] = charge;
  }

  // transfer fusible abilities

  arr = [];
  // first add all fusible abilities of b to the array
  for(var i = 0; i < nb; i++) {
    if(b.charge[i] != 2) continue;
    arr.push([b.abilities[i], 2]);
  }
  // now append the old non-fusible abilities to the end of the array
  for(var i = 0; i < n; i++) {
    if(mb[f.abilities[i]] == 2) continue; // already in the array, prevent duplicates
    arr.push([f.abilities[i], f.charge[i]]);
  }
  for(var i = 0; i < arr.length; i++) {
    if(i >= n) break;
    f.abilities[i] = arr[i][0];
    f.charge[i] = arr[i][1];
  }

  // set up starting levels
  for(var i = 0; i < n; i++) {
    var level = m[f.abilities[i]];
    f.levels[i] = level;
    f.starting_levels[i] = level;
  }

  var worse = true;
  for(var i = 0; i < n; i++) {
    if(f.abilities[i] != a.abilities[i] || f.charge[i] > a.charge[i] || f.levels[i] > a.levels[i]) {
      worse = false;
      break;
    }
  }
  // this check is not done for b: for example, if b has 3 [**] abilities and is not seasonal, and a is seasonal, then this is a legit change.

  if(worse) {
    if(opt_message) {
      opt_message[0] = 'No fuse done: this fuse results in the same fruit as the original or worse. Try fusing with a different fruit, or swapping the fuse order.';
    }
    return null;
  }

  return f;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


var min_transcension_level = 10;

var treeboost = Num(0.05); // additive production boost per tree level

function getTreeBoost() {
  var result = Num(treeboost);

  var n = state.upgrades2[upgrade2_basic_tree].count;
  n = Math.pow(n, treeboost_exponent_2);
  result.addInPlace(upgrade2_basic_tree_bonus.mulr(n));

  var l = state.treelevel;
  l = Math.pow(l, treeboost_exponent_1);
  result.mulrInPlace(l);

  return result;
}


// outputs the minimum spores required for the tree to go to the given level
function treeLevelReqBase(level) {
  var res = new Res();
  res.spores = Num.rpow(9, Num(level - 1)).mulr(6.666666);
  return res;
}

// for tree spores requirement
function getMistletoeLeech() {
  if(state.mistletoes <= 1) return Num(1); // the first mistletoe doesn't affect leveling spores requirement
  return Num((state.mistletoes - 1) * 0.5 + 1);
}

// including effects like mistletoe
function treeLevelReq(level) {
  var res = treeLevelReqBase(level);
  res.mulInPlace(getMistletoeLeech());
  return res;
}

// returns an index in the tree_images array for the given tree level
// several levels reuse the same image (and string name in there), so the result will
// be an index that is <= level, and also always < tree_images.length
// NOTE: must be such that at 10, the first time the name "adult tree" is used to fit the storyline
function treeLevelIndex(level) {
  var result = 0;
  if(!level || level < 0) return 0;
  // 0-9: one image for each level
  if(level < 10) result = level;
  // 10-45: one image per 5 levels
  else if(level < 50) result = 10 + Math.floor((level - 10) / 5);
  //50-...: 1 image per 10 levels
  else result = 18 + Math.floor((level - 50) / 10);
  if(result >= tree_images.length) result = tree_images.length - 1;
  return result;
}


var mistletoe_resin_malus = Num(0.15);

var treelevel2_resin_bonus = Num(0.05);

// amount with bonuses etc...
function treeLevelResin(level, breakdown) {
  if(level <= 0) return Num(0);
  level--;

  var base = resin_base;
  if(state.upgrades2[upgrade2_resin_extraction].count) base = resin_base_resin_extraction;
  var resin = Num.rpow(base, Num(level)).mulr(resin_global_mul).addr(resin_global_add);
  if(level > 15) resin.addrInPlace(resin_global_quad * (level - 15));

  if(breakdown) breakdown.push(['base (per tree level roughly x' + base + ')', true, Num(0), resin.clone()]);

  if(getSeason() == 3) {
    var bonus = getWinterTreeResinBonus();
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['winter bonus', true, bonus, resin.clone()]);
  }

  var count = state.upgrades2[upgrade2_resin].count;
  if(count) {
    var bonus = upgrade2_resin_bonus.mulr(count).addr(1);
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal upgrades', true, bonus, resin.clone()]);
  }

  if(state.treelevel2) {
    var bonus = treelevel2_resin_bonus.mulr(state.treelevel2).addr(1);
    resin.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal tree level', true, bonus, resin.clone()]);
  }


  count = state.mistletoes;
  if(count > 1) {
    var malus = Num(1).sub(mistletoe_resin_malus).powr(count - 1); // the first mistletoe doesn't affect resin income
    resin.mulInPlace(malus);
    if(breakdown) breakdown.push(['mistletoe malus (' + count + ')', true, malus, resin.clone()]);
  }

  return resin;
}

function currentTreeLevelResin(breakdown) {
  return treeLevelResin(state.treelevel, breakdown);
}

function nextTreeLevelResin(breakdown) {
  return treeLevelResin(state.treelevel + 1, breakdown);
}


// get twig drop at tree going to this level from mistletoes
function treeLevelTwigs(level, breakdown) {
  if(level <= 0) return Res({twigs:0});
  level--;

  var res = new Res();
  res.twigs = Num(twigs_global_mul);
  var base = twigs_base;
  if(state.upgrades2[upgrade2_twigs_extraction].count) base = twigs_base_twigs_extraction;
  res.twigs.mulInPlace(Num(base).powr(level));
  res.twigs.addrInPlace(twigs_global_add);
  if(level > 10) res.twigs.addrInPlace(twigs_global_quad * (level - 10));

  if(breakdown) breakdown.push(['base (per tree level roughly x' + base + ')', true, Num(0), res.clone()]);

  var multi = Num(Math.log2(state.mistletoes + 1));
  res.twigs.mulInPlace(multi);
  if(breakdown && state.mistletoes != 1) breakdown.push(['#mistletoes (' + state.mistletoes + ')', true, multi, res.clone()]);

  if(getSeason() == 2) {
    var bonus = getAutumnMistletoeBonus();
    res.twigs.mulInPlace(bonus);
    if(breakdown) breakdown.push(['autumn bonus', true, bonus, res.clone()]);
  }

  var count = state.upgrades2[upgrade2_twigs].count;
  if(count) {
    var bonus = upgrade2_twigs_bonus.mulr(count).addr(1);
    res.twigs.mulInPlace(bonus);
    if(breakdown) breakdown.push(['ethereal upgrades', true, bonus, res.clone()]);
  }


  return res;
}

function nextTwigs(breakdown) {
  return treeLevelTwigs(state.treelevel + 1, breakdown);
}

function treeLevel2ReqBase(level) {
  var res = new Res();
  res.twigs = Num.rpow(12, Num(level - 1)).mulr(144);
  return res;
}

// including effects, if any
function treeLevel2Req(level) {
  var res = treeLevel2ReqBase(level);
  return res;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


// opt_add_type and opt_sub_type: when adding or removing one of that type
function getStarterResources(opt_add_type, opt_sub_type) {
  var count;
  var ethereal_seeds = 0;

  count = state.fullgrowncrop2count[fern2_0];
  if(opt_add_type == fern2_0) count++;
  if(opt_sub_type == fern2_0) count--;
  ethereal_seeds += count * count * count * 100;

  count = state.fullgrowncrop2count[fern2_1];
  if(opt_add_type == fern2_1) count++;
  if(opt_sub_type == fern2_1) count--;
  ethereal_seeds += count * count * count * 1000;

  return Res({seeds:ethereal_seeds});
}

function getUnusedResinBonusFor(resin){
  return Num(Num.log10(resin.addr(1))).mulr(0.1).addr(1);
}

function getUnusedResinBonus() {
  return getUnusedResinBonusFor(state.res.resin);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


/*
The plants benefitting most of each season are roughly:
spring: flowers
summer: berries
autumn: mushrooms
winter: tree
*/

// multipliers, e.g. 2 means +100%
var bonus_season_flower_spring = 1.5;
var bonus_season_summer_berry = 2.5;
var bonus_season_autumn_mushroom = 2.5;
var bonus_season_autumn_mistletoe = 1.5;
var malus_season_winter = 0.75;
var bonus_season_winter_tree = 2.5;
var bonus_season_winter_resin = 1.5;
var season_ethereal_upgrade_exponent = 1.25;

// multiplier of the corresponding berry / mushroom bonus of the season
var bonus_season_summer_mushroom = 0.5; // with ethereal upgrades only
var bonus_season_autumn_berry = 0.5; // with ethereal upgrades only

function getSpringFlowerBonus() {
  var bonus = Num(bonus_season_flower_spring);

  var ethereal_season = state.upgrades2[upgrade2_season[0]].count;
  if(ethereal_season) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[0]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[0]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var level = getFruitAbility(FRUIT_SPRING);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_SPRING, level, getFruitTier()));
    bonus.mulInPlace(mul);
  }

  return bonus;
}

function getSummerBerryBonus() {
  var bonus = Num(bonus_season_summer_berry);

  var ethereal_season = state.upgrades2[upgrade2_season[1]].count;
  if(ethereal_season > 0) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[1]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[1]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var level = getFruitAbility(FRUIT_SUMMER);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_SUMMER, level, getFruitTier()));
    bonus.mulInPlace(mul);
  }

  return bonus;
}

function getSummerMushroomBonus() {
  return getSummerBerryBonus().subr(bonus_season_summer_berry).mulr(bonus_season_summer_mushroom).addr(1);
}

function getAutumnMushroomBonus() {
  var bonus = Num(bonus_season_autumn_mushroom);

  var ethereal_season = state.upgrades2[upgrade2_season[2]].count;
  if(ethereal_season > 0) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[2]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[2]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var level = getFruitAbility(FRUIT_AUTUMN);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_AUTUMN, level, getFruitTier()));
    bonus.mulInPlace(mul);
  }

  return bonus;
}

function getAutumnBerryBonus() {
  return getAutumnMushroomBonus().subr(bonus_season_autumn_mushroom).mulr(bonus_season_autumn_berry).addr(1);
}

function getAutumnMistletoeBonus() {
  var bonus = Num(bonus_season_autumn_mistletoe);

  var ethereal_season = state.upgrades2[upgrade2_season[2]].count;
  if(ethereal_season) {
    var t = towards1(ethereal_season, 10) * 0.5;
    bonus.addrInPlace(t);
  }
  return bonus;
}

function getWinterMalus() {
  var malus = Num(malus_season_winter);
  return malus;
}

function getWinterTreeWarmth() {
  var bonus = Num(bonus_season_winter_tree);

  var ethereal_season = state.upgrades2[upgrade2_season[3]].count;
  if(ethereal_season) {
    //var ethereal_season_bonus = Num(ethereal_season).mulr(upgrade2_season_bonus[3]).addr(1);
    var p = Num(ethereal_season).powr(season_ethereal_upgrade_exponent);
    var ethereal_season_bonus = p.mulr(upgrade2_season_bonus[3]).addr(1);
    bonus = bonus.mul(ethereal_season_bonus);
  }

  var level = getFruitAbility(FRUIT_WINTER);
  if(level > 0) {
    var mul = Num(1).add(getFruitBoost(FRUIT_WINTER, level, getFruitTier()));
    bonus.mulInPlace(mul);
  }


  return bonus;
}

function getWinterTreeResinBonus() {
  var result = Num(bonus_season_winter_resin);
  var ethereal_season = state.upgrades2[upgrade2_season[3]].count;
  if(ethereal_season) {
    var t = towards1(ethereal_season, 10) * 0.5;
    result.addrInPlace(t);
  }
  return result;
}



////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function getSunSeedsBoost() {
  var bonus_sun = Num(0.5);
  bonus_sun.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2) bonus_sun.mulrInPlace(1 + active_choice0_b_bonus);
  bonus_sun.addrInPlace(1);
  return bonus_sun;
}

// a seed consumption reduction, so a boost
function getMistSeedsBoost() {
  var bonus_mist0 = Num(0.75);
  // weather boost not applied to the less seeds effect, it's a multiplier intended for things that increase something plus would make it doubly-powerful
  if(state.upgrades[active_choice0].count == 2) bonus_mist0.divrInPlace(1 + active_choice0_b_bonus);
  return bonus_mist0;
}

function getMistSporesBoost() {
  var bonus_mist1 = Num(1);
  bonus_mist1.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2) bonus_mist1.mulrInPlace(1 + active_choice0_b_bonus);
  return bonus_mist1;
}

function getRainbowFlowerBoost() {
  var bonus_rainbow = Num(0.5);
  bonus_rainbow.mulInPlace(getWeatherBoost());
  if(state.upgrades[active_choice0].count == 2) bonus_rainbow.mulrInPlace(1 + active_choice0_b_bonus);
  return bonus_rainbow;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// level = highest tree level reached with this challenge, or hypothetical other level
function getChallengeBonus(challenge_id, level) {
  var c = challenges[challenge_id];
  return c.bonus.mulr(level);
}

// only during bee challenge
function getWorkerBeeBonus() {
  return state.workerbeeboost;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function getFernWaitTime() {
  var progress = state.res.seeds;
  var mintime = 0;
  if(progress.eqr(0) && gain.empty()) mintime = (state.challenge ? 1 : 0);
  else if(progress.ltr(15)) mintime = (state.g_numresets > 0 ? 5 : 1);
  else if(progress.ltr(150)) mintime = 10;
  else if(progress.ltr(1500)) mintime = fern_wait_minutes * 60 / 2;
  else mintime = fern_wait_minutes * 60;
  if(state.upgrades[fern_choice0].count == 1) mintime += fern_choice0_a_minutes * 60;
  return mintime;
}

////////////////////////////////////////////////////////////////////////////////

function haveMultiplicity(opt_croptype) {
  if(opt_croptype == undefined || opt_croptype == CROPTYPE_BERRY || opt_croptype == CROPTYPE_MUSH) return state.challenges[challenge_rockier].completed;
  return false;
}

// the result must be multiplied by getMultiplicityNum, to get the actual intended resulting bonus
function getMultiplicityBonusBase(croptype) {
  return Num(0.25);
}

function getMultiplicityNum(crop) {
  // the multiplicity bonus is given by crops of same tier, or 1 tier lower, or 1 tier higher, but not any farther away than that
  // reason: multiplicity is intended to give a benefit from more crops in the field, since due to linear scaling more crops otherwise diminishes. But it's not intended to be a mechanic to allow quick manual hotswapping of bonus types.
  // if crops from all tiers give the bonus, then you can leave a tier 0 crop around to give the bonus, without needing to ever spend growtime on it after that, and also allows quick swapping between mushrooms and berries. But maintaining that requires manual work, which is annoying, so we don't want that mechanic
  // if only crops from exact same tier (so exact same crop) affect it, then growing a higher tier crop will be bad instead of good, and growing higher tier crops should be encouraged
  // benefitting from +1/-1 tier is just right: normally you have one tier active, and are growing 1 new next tier, so they can benefit each other.

  var croptype = crop.type;
  var tier = crop.tier;

  var below = undefined;
  if(tier > 0 && croptype_tiers[croptype]) below = croptype_tiers[croptype][tier - 1];
  if(below && below.istemplate) below = undefined;

  var above = undefined;
  if(tier != undefined && croptype_tiers[croptype]) above = croptype_tiers[croptype][tier + 1];
  if(above && above.istemplate) above = undefined;

  var num = state.growingcropcount[crop.index];
  if(below) num += state.growingcropcount[below.index];
  if(above) num += state.growingcropcount[above.index];

  num -= 1; // the current plant self is not counted (even if partial, growing, still counts as full 1)
  if(num < 0) num = 0;

  return num;
}



