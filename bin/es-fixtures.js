'use strict';
const esFixtures = require('../src/');
const argv = require('minimist')(process.argv.slice(2));

const commandName = argv._[0];
const index = argv._[1];
const type = argv._[2];
let data;
if (argv._[3]) {
  data = require(`${process.cwd()}/${argv._[3]}`);
}

const loader = esFixtures.bootstrap(index, type, {
  host: argv.h || argv.host,
  log: argv.l || argv.log
});

loader[commandName](data, { incremental: argv.i || argv.incremental })
  .then(() => {
    console.log(`${commandName} executed correctly.`);
  })
  .catch(err => {
    console.log(`Error happened: ${err.message}`);
  });
