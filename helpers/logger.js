var fs = require("fs");
var Logger = (exports.Logger = {});

const curDate = new Date();
var filePrefix = curDate.getDate().toString().padStart(2,"0") + (curDate.getMonth() + 1).toString().padStart(2,"0") + curDate.getFullYear().toString();

const infoFilePath = "logs/" + filePrefix + "info.txt";
const debugFilePath = "logs/" + filePrefix + "debug.txt";
const errorFilePath = "logs/" + filePrefix + "error.txt";

var infoStream = fs.createWriteStream(infoFilePath, {flags: 'a'});
var errorStream = fs.createWriteStream(errorFilePath, {flags: 'a'});
// var debugStream = fs.createWriteStream(debugFilePath, {flags: 'a'});

Logger.Info = function(msg) {
  var message = new Date().toISOString() + " : " + msg + "\n";
  infoStream.write(message);
};

// Logger.Debug = function(msg) {
//   var message = new Date().toISOString() + " : " + msg + "\n";
//   debugStream.write(message);
// };

Logger.Error = function(msg) {
  var message = new Date().toISOString() + " : " + msg + "\n";
  errorStream.write(message);
};