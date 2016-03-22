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
      id: 'g-' + k + '_' + j + '-game',
      points: val,
    });
  }
}

// gather picks
// TODO: seed diff
var results = [];
var promises = [];
for (var i = 0; i < brackets.length; i++) {
  results[i] = {
    id: brackets[i],
    picks: {},
  };

  //var BASE = 'https://tournament.fantasysports.yahoo.com/t1/';
  // slow down - python static server is turruble
  var BASE = 'http://localhost:8000/';
  (function(x){
    setTimeout(function () {
      get(x);
    }, 100 * x);
  })(i);
}

// simulate games 1_1 -- 4_3


function futureGame(bracket) {
  var fut = [];
  for (var p in bracket.picks) {
    var pick = bracket.picks[p];
    if (pick.correct === undefined) {
      fut.push(pick);
    }
  }
  return fut;
}

function totalPoints(bracket) {
  var points = 0;
  for (var p in bracket.picks) {
    var pick = bracket.picks[p];
    if (pick.correct) {
      points += pick.points;
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
  console.log('fetching ' + x + brackets[id]);
  var req = rp(BASE + brackets[id]);
  req.then(function (htmlString) {
    var handler = new htmlparser.DefaultHandler(function (error, dom) {
      if (error) {
        console.error(error, id);
      } else {

        var form, g, gameDiv, gameLi, gamePick, gameStrong, games, gid, header;

        // figure out name of bracket
        form = htmlparser.DomUtils.getElementById('tourney-bracket-form', dom);
        header = htmlparser.DomUtils.getElementsByTagName('header', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('div', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('div', form)[0];
        header = htmlparser.DomUtils.getElementsByTagName('span', form)[0];
        console.log(header.children[0].raw);
        results[id].name = header.children[0].raw;

        // go through each pick
        for (var gi in allGames) {
          gid = allGames[gi];
          games = htmlparser.DomUtils.getElementById(gid.id, dom);
          var status = {};
          if (games.attribs.class.match(/incorrect-pick/)) {
            status.correct = false;
          } else if (games.attribs.class.match(/correct-pick/)) {
            status.correct = true;
            status.points  = gid.points;
          } else {
            // game hasn't happened yet
            status._potential_points  = gid.points;
          }
          for (g in games.children) {
            gameLi = games.children[g];
            if (gameLi.type !== 'tag') {
              continue;
            }
            gameDiv = htmlparser.DomUtils.getElements({class: className.bind(this, 'ysf-tpe-game-inner')}, gameLi);
            gameStrong = htmlparser.DomUtils.getElements({class: className.bind(this, 'ysf-tpe-user-pick')}, gameDiv[0]);
            var pick = (htmlparser.DomUtils.getElementsByTagName('b', gameStrong[0])[0].children[1].raw);
            pick = pick.replace(/^\s*/, '').replace(/\s*$/, '');
            status.pick = pick;
            status.id = gid.id.match(/\d+_\d+/)[0];
          }

          results[id].picks[gid.id] = status;
        }

        console.log(util.inspect({
          //fut: futureGame(results[id]),
          brk: results[id],
          pot: totalPoints(results[id]),
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
