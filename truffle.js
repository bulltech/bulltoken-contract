require('dotenv').load();
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },

    bull: {
      host: "127.0.0.1",
      port: 8005,
      network_id: "671",
      gas: 6000000
    },

      rinkeby: {
        host: "localhost",
        port:8545,
        network_id: 4,
        gas: 6000000,
        from: process.env.RINKEBY_ACCOUNT
      }
  }
};
