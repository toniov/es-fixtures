#!/usr/bin/env node

'use strict';
const esFixtures = require('../src/');
const help = require('./help');
const argv = require('minimist')(process.argv.slice(2));
const path = require('path');

const command = argv._[0];

/**
 * Get absolute path
 * @param {string} rawPath
 */
const getLoader = (index, type) => {
  return esFixtures.bootstrap(index, type, {
    host: argv.host || argv.h,
    log: argv.log || argv.l || 'info'
  });
};

/**
 * Require data file (.js or .json)
 * @param {string} rawPath
 */
const requireDataFile = (rawPath) => {
  if (!rawPath) {
    return;
  }
  if (path.isAbsolute(rawPath)) {
    return require(rawPath);
  } else {
    return require(path.join(process.cwd(), rawPath));
  }
};

switch (command) {
  case 'load': {
    const index = argv._[1];
    const type = argv._[2];
    const data = requireDataFile(argv._[3]);
    const incremental = argv.incremental || argv.i;
    const refresh = argv.refresh || argv.r;
    const loader = getLoader(index, type);
    loader.load(data, { incremental, noRefresh: !refresh }).catch(console.error);
    break;
  }
  case 'clear': {
    const index = argv._[1];
    const type = argv._[2];
    const refresh = argv.refresh || argv.r;
    const loader = getLoader(index, type);
    loader.clear({ noRefresh: !refresh }).catch(console.error);
    break;
  }
  case 'clearAndLoad': {
    const index = argv._[1];
    const type = argv._[2];
    const data = requireDataFile(argv._[3]);
    const incremental = argv.incremental || argv.i;
    const refresh = argv.refresh || argv.r;
    const loader = getLoader(index, type);
    loader.clearAndLoad(data, { incremental, noRefresh: !refresh }).catch(console.error);
    break;
  }
  case 'bulk': {
    let index;
    let type;
    let data;
    if (argv._.length === 4) {
      index = argv._[1];
      type = argv._[2];
      data = requireDataFile(argv._[3]);
    } else if (argv._.length === 3) {
      index = argv._[1];
      data = requireDataFile(argv._[2]);
    } else {
      data = requireDataFile(argv._[1]);
    }
    const refresh = argv.refresh || argv.r;
    const loader = getLoader(index, type);
    loader.bulk(data, { noRefresh: !refresh }).catch(console.error);
    break;
  }
  case 'createIndex': {
    const index = argv._[1];
    const data = requireDataFile(argv._[2]);
    const force = argv.force || argv.f;
    const loader = getLoader(index);
    loader.createIndex(data, { force }).catch(console.error);
    break;
  }
  case 'addMapping': {
    const index = argv._[1];
    const type = argv._[2];
    const data = requireDataFile(argv._[3]);
    const loader = getLoader(index, type);
    loader.addMapping(data).catch(console.error);
    break;
  }
  default: {
    console.log(help);
    break;
  }
}
