#!/usr/bin/env node
const yargs = require('yargs');
const checkjson = require('./command/commandcheckjson.js');
yargs
    .command(checkjson)
    .help('h')
    .argv
