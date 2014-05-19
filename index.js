#!/usr/bin/env node

/*jshint node:true */

"use strict";
var program = require('commander');
var fs = require("fs");
var Promise = require('promise');
var readFile = Promise.denodeify(fs.readFile);
var writeFile = Promise.denodeify(fs.writeFile);

var DEFAULT_DELAY = 1000;
process.title = "subber";
program._name = "subber";

program
  .version('1.0')
  .usage("[options] <file ...>")
  .option('-f, --forward [delay]', 'forward delay value in ms')
  .option('-r, --rewind  [delay]', 'rewind delay value in ms')
  .option('-o, --output  [name]', 'the output filename')
  .parse(process.argv);

if(program.args.length === 0) {
  program.help();
  return;
}

if (isNaN(program.rewind) && isNaN(program.forward)) {
  program.help();
  return;
}

var delay = parseInt(program.forward || program.rewind || DEFAULT_DELAY, 10);

if (program.rewind) {
  delay *= -1;
}



/**
 * Transform a strt timestamp to ms
 * @param  {String}   ts a srt timestamp hh:mm:ss,ms
 * @return {int}      number of millisecond
 */
function ts2ms(ts){
  return ( parseInt(ts[0], 10) * 3600 +
    parseInt(ts[1], 10) * 60   +
    parseInt(ts[2], 10)) * 1000 +
    parseInt(ts[3], 10);
}

/**
 * Format a number on 2 digit
 * @param  {int}      val  a number to format
 * @return {String}   the formated number
 */
function format(val){
  return val > 9 ? ""+val : "0"+val;
}

/**
 * Transform a number of millisecond into a srt timestamp
 * @param  {int}      number of millisecond
 * @return {String}   a srt timestamp hh:mm:ss,ms
 */
function ms2ts(ms){
  var scale = [3600*1000, 60*1000, 1000, 1 ];
  var ts = scale.map( function(val){
    var unit = parseInt(ms / val, 10);
    ms = ms % val;
    return unit;
  }).map(format);
  return ts.slice(0,3).join(":") + "," + ts[ts.length-1];
}

/**
 * Resync a str file with a delay
 * @param  {int}    delay a delay in ms
 * @param  {String} srt   a str file content
 * @return {String}       the resync srt content
 */
function resync (delay, srt) {
  return srt.replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, function(){
     var ms = ts2ms( [].slice.call(arguments, 1 , 5));
     ms += delay;
     return ms2ts(ms);
  });
}

program.args.forEach(function(inputFile){
  var outputFile = program.output || inputFile.split(".srt").join('.sync.srt');

  readFile(inputFile, {encoding: "utf8"})
    .then( resync.bind(null, delay) )
    .then( writeFile.bind(null, outputFile) )
    .then(function(){
      console.log(inputFile, '... done');
    });
});