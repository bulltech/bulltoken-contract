require('./helpers/spec_helper.js');
import FundDistributionHelper from './helpers/fundDistributionHelpers';

var FundDistributor = artifacts.require("./FundDistributor.sol");

contract('FundDistributor', function ([
  developmentWallet,
  marketingWallet,
  administrationWallet,
  earlyBackersWallet,
  wallet
]) {

  let distributor;
  let fundHelper = new FundDistributionHelper(
    developmentWallet,
    administrationWallet,
    marketingWallet,
    earlyBackersWallet
  );
  let value = new BigNumber('239829387492837');

  beforeEach(async function () {
    distributor = await FundDistributor.new(
      developmentWallet,
      marketingWallet,
      administrationWallet,
      earlyBackersWallet
    );
  });

  it('should forward funds to multiple wallets', async function () {
    const before = await fundHelper.getBalances();
    await distributor.sendTransaction({ from: wallet, value: value });
    const after = await fundHelper.getBalances();

    expect(after.development).to.be.bignumber.greaterThan(before.development);
    expect(after.administration).to.be.bignumber.greaterThan(before.administration);
    expect(after.marketing).to.be.bignumber.greaterThan(before.marketing);
    expect(after.earlyBackers).to.be.bignumber.greaterThan(before.earlyBackers);
  });

  describe('repeated tests with multiple different values', function () {
    // Amount of wei to be used for testing
    const values = [
      new BigNumber(web3.toWei('1', 'ether')),
      new BigNumber(329083741923),
      new BigNumber(7262181)
    ];

    values.forEach(function (value) {
      it(`should calculate and forward the correct amount to each account when balance is ${value.toString()}`, async function () {
        const before = await fundHelper.getBalances();
        await distributor.sendTransaction({ from: wallet, value: value });
        const after = await fundHelper.getBalances();

        const expectedGains = fundHelper.expectedFundDistribution(value);

        expect(before.development.add(expectedGains.development))
               .to.be.bignumber.equal(after.development);
        expect(before.administration.add(expectedGains.administration))
               .to.be.bignumber.equal(after.administration);
        expect(before.marketing.add(expectedGains.marketing))
               .to.be.bignumber.equal(after.marketing);
        expect(before.earlyBackers.add(expectedGains.earlyBackers))
               .to.be.bignumber.equal(after.earlyBackers);
      });

      it(`should completely empty the contract of funds when balance is ${value.toString()}`, async function () {
        const before = await fundHelper.getBalances();
        await distributor.sendTransaction({ from: wallet, value: value });
        const after = await fundHelper.getBalances();

        const bal = await web3.eth.getBalance(distributor.address);
        expect(bal).to.be.bignumber.equal(new BigNumber(0));
      });
    });
  });
});
