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



var fern_spring_header = '#l0:#844 l1:#d66 hg:#2f0';
var fern_summer_header = '#hg:#0f4';
var fern_autumn_header = '#q:#a30 g:#f70';
var fern_winter_header = '#q:#88f g:#aaf G:#ccf Q:#eef';
var fern_ethereal_header = '#q:#ff8 g:#ffa G:#ffc Q:#ffe';

var fern_base_image = `
................
....g...........
....q.qg........
..gqqqg..g......
.....qgggqg.....
..gqqqqqqg......
.gqgggqgg.......
.....gq.ggg.....
..ggqqqqqqqgg...
.gqqgg.qgggqqg..
..gg.g.q.g.gg...
...gggqqqqggg...
..ggqq..qgqqgg..
.gqqgg..qgggqqg.
..gg....q..ggg..
................
`;

var fern_base_image2 = `
....$...........
...$g$$$........
..$$q$qg$$......
.$gqqqg$$g$.....
..$$$qgggqg$....
.$gqqqqqqg$.....
$gqgggqgg$$.....
.$$$$gq$ggg$$...
.$ggqqqqqqqgg$..
$gqqgg$qgggqqg$.
.$gg$g$q$g$gg$..
..$gggqqqqggg$..
.$ggqq$$qgqqgg$.
$gqqgg$$qgggqqg$
.$gg$$$$q$$ggg$.
..$$....$..$$$..
`;

var images_fern = [
  generateImageCanvas(fern_spring_header + fern_base_image),
  generateImageCanvas(fern_summer_header + fern_base_image),
  generateImageCanvas(fern_autumn_header + fern_base_image),
  generateImageCanvas(fern_winter_header + fern_base_image),
  generateImageCanvas(fern_ethereal_header + fern_base_image),
];

var images_fern2 = [
  generateImageCanvas(fern_spring_header + fern_base_image2),
  generateImageCanvas(fern_summer_header + fern_base_image2),
  generateImageCanvas(fern_autumn_header + fern_base_image2),
  generateImageCanvas(fern_winter_header + fern_base_image2),
  generateImageCanvas(fern_ethereal_header + fern_base_image2),
];

// default header is: '#l0:#400 l1:#822 l2:#a55 l3:#faa'

// less saturated than the default for fields
var fieldimageheader = '#l0:#622 l1:#966 l2:#a88 l3:#fcc';
// a header with much higher saturation, for fruits and flowers
var fruitimageheader = '#l0:#800 l1:#c22 l2:#f44 l3:#f88';
// a header for green plants, the difference with standard palette is that it has less shadow, so you can make subtler shades
var subtleplantimageheader = '#l0:#600 l1:#822 l2:#a55 l3:#faa';



var fieldheader_spring = '#+:#dbecc8 -:#b5d571';
var fieldheader_summer = '#+:#c3e4bc -:#c9bb9d';
var fieldheader_autumn = '#+:#d3be9c -:#cea78b';
var fieldheader_winter = '#+:#fff -:#eef';
var fieldheader_ethereal = '#+:#9df -:#ffd';

var field0 = `
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++--++++++++++++
++++-++--+-++--+
++++++++++++++++
++++++++++++++++
+++-+--+--+--+++
++++++++++++++++
++++++++++++++++
++++++++++++++++
+++++++++++---++
+---+-+---++++++
++++++++++++++++
++++++++++++++++
`;

var field1 = `
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
+++--++-+---++++
++++++++-+++++++
++++++++++++++++
++++++++++++++++
++----++++----++
+++++++++++++++-
++++++++++++++++
++++++++++++-+++
+---+---++-+++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
`;

var field2 = `
++++++++++++++++
++++++++++++++++
++++++++++++++++
+---++++++++---+
+++++--+-++-++++
++++++++++++++++
+-++++++++++++++
++---+++++++++++
+++++++---+--+++
++++++++++++++++
++++++++++++++++
++++++++++++++++
+----+++----++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
`;

var field3 = `
++++++++++++++++
++++++++++++++++
+-+----+-+++++++
+++++++++-----++
++++++++++++++++
++++++++++++++++
++++++++++++++++
+---++--++++++++
++++++++++-----+
++++++++++++++++
++++++++++++++++
++++++++-+++++++
++-----++----+++
++++++++++++++++
++++++++++++++++
++++++++++++++++
`;

var field_empty = `
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
++++++++++++++++
`;



// field array must have 5 values: 4 similar but slightly different patterns, and a patternless one for under tree

var field_spring = [
generateImageCanvas(fieldheader_spring + field0),
generateImageCanvas(fieldheader_spring + field1),
generateImageCanvas(fieldheader_spring + field2),
generateImageCanvas(fieldheader_spring + field3),
generateImageCanvas(fieldheader_spring + field_empty),
];

var field_summer = [
generateImageCanvas(fieldheader_summer + field0),
generateImageCanvas(fieldheader_summer + field1),
generateImageCanvas(fieldheader_summer + field2),
generateImageCanvas(fieldheader_summer + field3),
generateImageCanvas(fieldheader_summer + field_empty),
];

var field_autumn = [
generateImageCanvas(fieldheader_autumn + field0),
generateImageCanvas(fieldheader_autumn + field1),
generateImageCanvas(fieldheader_autumn + field2),
generateImageCanvas(fieldheader_autumn + field3),
generateImageCanvas(fieldheader_autumn + field_empty),
];

var field_winter = [
generateImageCanvas(fieldheader_winter + field0),
generateImageCanvas(fieldheader_winter + field1),
generateImageCanvas(fieldheader_winter + field2),
generateImageCanvas(fieldheader_winter + field3),
generateImageCanvas(fieldheader_winter + field_empty),
];

var field_ethereal = [
generateImageCanvas(fieldheader_ethereal + field0),
generateImageCanvas(fieldheader_ethereal + field1),
generateImageCanvas(fieldheader_ethereal + field2),
generateImageCanvas(fieldheader_ethereal + field3),
generateImageCanvas(fieldheader_ethereal + field_empty),
];

var images_field = [
  field_spring,
  field_summer,
  field_autumn,
  field_winter,
  field_ethereal,
];



var empty = generateImageCanvas(`
................
................
................
................
................
................
................
................
................
................
................
................
................
................
................
................
`);

var gray = generateImageCanvas(`
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
5555555555555555
`);



var exclamation = generateImageCanvas(`
................
.....000000.....
...00------00...
..0----------0..
..0----00----0..
.0-----00-----0.
.0-----00-----0.
.0-----00-----0.
.0-----00-----0.
.0------------0.
.0-----00-----0.
..0----00----0..
..0----------0..
...00------00...
.....000000.....
................
`);





var upgrade_arrow = generateImageCanvas(`
...........0....
..........0-0...
.........0---0..
........0-----0.
.......0000-0000
..........0-0...
..........0-0...
..........0-0...
..........000...
................
................
................
................
................
................
................
`);



var image_seed = generateImageCanvas(`
................
................
................
................
........X.......
.......XOO......
.......XOO......
......XOOOo.....
.......OOo......
.......OOo......
........o.......
................
................
................
................
................
`);

var image_starting_seeds = generateImageCanvas(`
................
................
................
................
................
................
................
................
...OOoo...OOoo..
..Ooooxx.Ooooxx.
...oxxx...oxxx..
................
......OOoo......
.....Ooooxx.....
......oxxx......
................
`);

var image_spore = generateImageCanvas(`
................
................
................
................
................
................
.......22.......
......2110......
......2100......
.......00.......
................
................
................
................
................
................
`);

var image_spores = generateImageCanvas(`
................
................
................
................
...22...........
..2110....22....
..2100...2110...
...00....2100...
..........00....
......22........
.....2110.......
.....2100.......
......00........
................
................
................
`);
