#!/usr/bin/env node

'use strict';

var rp = require('request-promise');
var htmlparser = require("htmlparser");
var util = require('util');

var brackets = [
  "2215095",
  "221801",
  "829002",
  "2174972",
  "2158740",
  "247751",
  "1168613",
  "1208358",
  "2210500",
  "2157419",
  "2221340",
  "1176730",
];

var upsets = {
  '1_4': 0,
  '1_5': 0,
  '1_6': 0,
  '1_7': 0,
  '1_8': 0,
  '1_9': 9-8,   // conn vs col
  '1_10': 0,
  '1_11': 13-4, // hawai'i vs cal
  '1_12': 11-6, // wichita vs zona
  '1_13': 0,
  '1_14': 0,
  '1_15': 0,

  '2_4': 0,
  '2_5': 0,
  '2_6': 0,
  '2_7': 0,
  '2_8': 0,
  '2_9': 0,
  '2_10': 12-5, // yale vs baylor
  '2_11': 0,
  '2_12': 11-6, // niu vs texas
  '2_13': 0,
  '2_14': 10-7, // vcu vs osu
  '2_15': 0,

  '3_4': 0,
  '3_5': 5-4, // iu vs uk
  '3_6': 0,
  '3_7': 7-2, // wisc vs xu
  '3_8': 0,
  '3_9': 9-8, // prov vs usc
  '3_10': 0,
  '3_11': 0,
  '3_12': 0,
  '3_13': 14-3, // sfa vs wvu
  '3_14': 0,
  '3_15': 0,

  '4_4': 0,
  '4_5': 0,
  '4_6': 11-3,
  '4_7': 0,
  '4_8': 0,
  '4_9': 9-8,   // butler vs ttu
  '4_10': 12-5, // arlr vs purdue
  '4_11': 0,
  '4_12': 11-6, // zaga vs shu
  '4_13': 0,
  '4_14': 10-7, // su vs dayton
  '4_15': 15-2, // mts vs msu
};

var reaminingTeamSeeds = {
  'Kansas':      1,
  'Maryland':    5,
  'Miami (FL)':  3,
  'Villanova':   2,
  'Oregon':      1,
  'Duke':        4,
  'Texas A&M':   3,
  'Oklahoma':    2,
  'N. Carolina': 1,
  'Indiana':     5,
  'Notre Dame':  6,
  'Wisconsin':   7,
  'Virginia':    1,
  'Iowa St.':    4,
  'Gonzaga':    11,
  'Syracuse':   10,
};

var remainingRounds = [
  // round 3
  {
    '1_2': ['1_4', '1_5'],
    '1_3': ['1_6', '1_7'],
    '2_2': ['2_4', '2_5'],
    '2_3': ['2_6', '2_7'],
    '3_2': ['3_4', '3_5'],
    '3_3': ['3_6', '3_7'],
    '4_2': ['4_4', '4_5'],
    '4_3': ['4_6', '4_7'],
  },

  // round 4
  {
    '1_1': ['1_2', '1_3'],
    '2_1': ['2_2', '2_3'],
    '3_1': ['3_2', '3_3'],
    '4_1': ['4_2', '4_3'],
  },

  // round 5
  {
    '0_2': ['1_1', '2_1'],
    '0_3': ['3_1', '4_1'],
  },

  // round 6
  {
    '0_1': ['0_2', '0_3'],
  },
];

var latestGames = {
  '1_4': 'Kansas',
  '1_5': 'Maryland',
  '1_6': 'Miami (FL)',
  '1_7': 'Villanova',
  '2_4': 'Oregon',
  '2_5': 'Duke',
  '2_6': 'Texas A&M',
  '2_7': 'Oklahoma',
  '3_4': 'N. Carolina',
  '3_5': 'Indiana',
  '3_6': 'Notre Dame',
  '3_7': 'Wisconsin',
  '4_4': 'Virginia',
  '4_5': 'Iowa St.',
  '4_6': 'Gonzaga',
  '4_7': 'Syracuse',
};

var allGames = [];
var pointSpread = [];
var values = [0, 8, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
var valuesFF = [0, 16, 12, 12];
for (var k = 0; k < 5; k++) {
  var maxJ = k === 0 ? 4 : 16;
  for (var j = 1; j < maxJ; j++) {
    var val;
    if (k === 0) {
      val = valuesFF[j];
    } else {
      val = values[j];
    }
    allGames.push({
      //id: 'g-' + k + '_' + j + '-game',
      id: k + '_' + j,
      points: val,
    });
  }
}

// gather picks
// TODO: seed diff
var results = [];
var promises = [];
//for (var i = 1; i < 2; i++) {
for (var i = 0; i < brackets.length; i++) {
  results[i] = {
    id: brackets[i],
    picks: {},
  };

  //var BASE = 'https://tournament.fantasysports.yahoo.com/t1/';
  var BASE = 'http://localhost:8000/';
  (function(x){
    // slow down - python static server is turruble
    setTimeout(function () {
      get(x);
    }, 100 * x);
  })(i);
}

// simulate remaining games
function simulateRest() {
  remainingRounds.forEach(function (round) {
    console.log(' ...> ', round);
  });
}

function futureGame(bracket) {
  var fut = [];
  for (var p in bracket.picks) {
    var pick = bracket.picks[p];
    if (pick.good === undefined) {
      fut.push(pick);
    }
  }
  return fut;
}

function totalPoints(bracket) {
  var points = 0;
  for (var p in bracket.picks) {
    var pick = bracket.picks[p];
    if (pick.good) {
      points += pick.pts;
      points += upsets[p];
    }
  }
  return points;
}

function className(name, value) {
  if (!value || !name) { return false; }
  var values = value.split(' ');
  for (var v in values) {
    if (values[v] === name) {
      return true;
    }
  }
  return false;
}

function get(id){
  var x = 'https://tournament.fantasysports.yahoo.com/t1/';
  //console.log('fetching ' + x + brackets[id]);
  var req = rp(BASE + brackets[id]);
  req.then(function (htmlString) {
    var handler = new htmlparser.DefaultHandler(function (error, dom) {
      if (error) {
        console.error(error, id);
      } else {

        var form, g, gameDiv, gameLi, gamePick, gameStrong, games, gid, header, name;

        // figure out name of bracket
        form = htmlparser.DomUtils.getElementById('tourney-bracket-form', dom);
        header = htmlparser.DomUtils.getElementsByTagName('header', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('div', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('div', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('span', form)[0];
        name = header.children[0].raw;
        results[id].name = header.children[0].raw;

        // go through each pick
        for (var gi in allGames) {
          gid = allGames[gi];
          var idid = 'g-' + gid.id + '-game';
          games = htmlparser.DomUtils.getElementById(idid, dom);
          var status = {};
          if (games.attribs.class.match(/incorrect-pick/)) {
            status.good = false;
          } else if (games.attribs.class.match(/correct-pick/)) {
            status.good = true;
            status.pts = gid.points;
          } else {
            // game hasn't happened yet
            status._pot_pts = gid.points;
          }
          for (g in games.children) {
            gameLi = games.children[g];
            if (gameLi.type !== 'tag') {
              continue;
            }
            gameDiv = htmlparser.DomUtils.getElements({class: className.bind(this, 'ysf-tpe-game-inner')}, gameLi);
            gameStrong = htmlparser.DomUtils.getElements({class: className.bind(this, 'ysf-tpe-user-pick')}, gameDiv[0]);
            var pick = htmlparser.DomUtils.getElementsByTagName('b', gameStrong[0])[0];
            var seed = Number(pick.children[0].children[0].raw);
            pick = pick.children[1].raw.replace(/^\s*/, '').replace(/\s*$/, '');
            status.seed = seed;
            status.pick = pick;
            status.id = gid.id
          }

          results[id].picks[gid.id] = status;
        }

        console.log(util.inspect({
          fut: futureGame(results[id]),
          //brk: results[id],
          pot: totalPoints(results[id]),
          name: name,
        }, false, null));
      }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(htmlString);
  })
  .catch(function (err) {
    console.error(err);
  });
}
