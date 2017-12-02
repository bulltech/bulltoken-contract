// Global test setup
//
import ether from './ether';
import {advanceBlock} from './advanceToBlock';
import {increaseTimeTo, duration} from './increaseTime';
import latestTime from './latestTime';
import assertRevert from './assertRevert';
import EVMRevert from './EVMRevert';
import EVMThrow from './EVMThrow';


global.ether = ether;
global.advanceBlock = advanceBlock;
global.increaseTimeTo = increaseTimeTo;
global.duration = duration;
global.latestTime = latestTime;
global.assertRevert = assertRevert;
global.EVMRevert = EVMRevert;
global.EVMThrow = EVMThrow;

global.pry = require('pryjs');
global.BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber));

global.expect = require('chai').expect
