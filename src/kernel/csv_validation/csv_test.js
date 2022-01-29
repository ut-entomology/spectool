"use strict";
exports.__esModule = true;
var os_1 = require("os");
var parse_1 = require("@fast-csv/parse");
var CSV_STRING = ['a,null,c', 'a1,b1,c1', 'a2,b2,'].join(os_1.EOL);
var stream = (0, parse_1.parse)({ headers: transformHeaders })
    .on('error', function (error) { return console.error(error); })
    .on('data', function (row) { return console.log(row); })
    .on('end', function (rowCount) { return console.log("Parsed " + rowCount + " rows"); });
stream.write(CSV_STRING);
stream.end();
function transformHeaders(headers) {
    console.log(headers);
    return headers;
}
