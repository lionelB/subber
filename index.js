#!/usr/bin/env node

/*jshint node:true */

"use strict";
var program = require('commander');
var fs = require("fs");
var Promise = require('promise');
var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);

var DEFAULT_DELAY = 1000;

program
  .version('0.1')
  .option('-f, --forward [name]', 'forward delay value')
  .option('-r, --rewind [name]', 'rewind delay value')
  .option('-i, --input [name]', 'the srt file to process')
  .option('-o, --output [name]', 'the output filename')
  .parse(process.argv);

var hasAction = program.forward || program.rewind;


if (!program.input || program.input === true || !hasAction) {
  program.help();
  return;
}

var inputFile = program.input;
var outputFile = program.output || program.input.split(".srt").join('2.srt');
var delay = parseInt(program.forward || program.rewind || DEFAULT_DELAY, 10);

if (program.rewind) {
  delay *= -1;
}




function ts2ms(ts){
  return ( parseInt(ts[0], 10) * 3600 +
    parseInt(ts[1], 10) * 60   +
    parseInt(ts[2], 10)) * 1000 +
    parseInt(ts[3], 10);
}
function format(val){
  return val > 9 ? ""+val : "0"+val;
}

function ms2ts(ms){
  var scale = [3600*1000, 60*1000, 1000, 1 ];
  var ts = scale.map( function(val){
    var unit = parseInt(ms / val, 10);
    ms = ms % val;
    return unit;
  }).map(format);
  return ts.slice(0,3).join(":") + "," + ts[ts.length-1];
}

function parse (srt) {
  // srt  = srt.substr(0, 300);
  return srt.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, function(){
     var ms = ts2ms( [].slice.call(arguments, 1 , 5));
     ms += delay;
     return ms2ts(ms);
  });
}

readFile(inputFile, {encoding: "utf8"})
  .then( parse )
  .then( function( newSrt ) {
    return writeFile(outputFile, newSrt );
  })
  .then(function(){
    console.log('done!!');
  });