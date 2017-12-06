const Web3          = require('web3');
const TruffleConfig = require('../truffle');

var Migrations = artifacts.require("./Migrations.sol");


module.exports = function(deployer, network, addresses) {
  // Check to make sure .env file has been loaded and
  // if the password has been changed from the placeholder text
  if (process.env.PASSWORD == undefined ||
      process.env.PASSWORD == 'insert_your_password_here') {
    throw(`
      You have either not replaced the dummy password in the
      .env file on project root, or have not created the .env
      file based on .env.sample. Please fix!
    `);
  }

  if (network !== 'development') {
    const config = TruffleConfig.networks[network];
    const web3   = new Web3(
      new Web3.providers.HttpProvider(`http://${config.host}:${config.port}`)
    );

  console.log('>> Unlocking account ' + config.from);
  console.log(web3.eth.personal);
  web3.personal.unlockAccount(config.from, process.env.PASSWORD, 0);
}

  console.log('>> Deploying migration');
  deployer.deploy(Migrations);
};
