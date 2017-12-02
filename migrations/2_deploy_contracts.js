var BullTokenCrowdsale = artifacts.require("BullTokenCrowdsale");
var Whitelist = artifacts.require("Whitelist");
var FundDistributor = artifacts.require("FundDistributor");

module.exports = function(deployer, network, accounts) {
  const start = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 90;
  const end = start + (86400 * 30); // 30 days
  const rate = new web3.BigNumber(500);
  const minimumInvestment = new web3.BigNumber(web3.toWei("1", 'ether'));
  const goal = new web3.BigNumber(web3.toWei("2513", "ether"));
  const cap = new web3.BigNumber(web3.toWei("204117", "ether"));

  const developmentWallet = process.env.DEVELOPMENT_WALLET;
  const marketingWallet = process.env.MARKETING_WALLET;
  const administrationWallet = process.env.ADMINISTRATION_WALLET;
  const earlyBackersWallet = process.env.EARLYBACKERS_WALLET;

  deployer.deploy(
    FundDistributor,
    developmentWallet,
    marketingWallet,
    administrationWallet,
    earlyBackersWallet
  ).then(function() {
    deployer.deploy(Whitelist).then(function() {
      deployer.deploy(
        BullTokenCrowdsale,
        start,
        end,
        rate,
        goal,
        cap,
        minimumInvestment,
        FundDistributor.address,
        Whitelist.address
      );
    });
  });
};
