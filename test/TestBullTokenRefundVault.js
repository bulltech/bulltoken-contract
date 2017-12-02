require('./helpers/spec_helper.js');
import FundDistributionHelper from './helpers/fundDistributionHelpers';

// Insert eval(pry.it); anywhere in code to get debug breakpoint
var FundDistributor = artifacts.require("./FundDistributor.sol");
var BullTokenRefundVault = artifacts.require("./BullTokenRefundVault.sol");

contract('RefundVault', function ([
    _,
    owner,
    wallet,
    investor,
    developmentWallet,
    marketingWallet,
    administrationWallet,
    earlyBackersWallet
  ]) {

  let vault;
  const etherValue = ether(1);

  beforeEach(async function () {
    const fundDistributor = await FundDistributor.new(
      developmentWallet,
      marketingWallet,
      administrationWallet,
      earlyBackersWallet,
      { from: owner }
    );
    vault = await BullTokenRefundVault.new(fundDistributor.address, { from: owner });
  });

  it('should accept contributions', async function () {
    expect(vault.deposit(investor, {value: etherValue, from: owner})).to.eventually.be.fulfilled;
  });

  it('should not refund contribution during active state', async function () {
    await vault.deposit(investor, {value: etherValue, from: owner});

    try {
      await vault.refund(investor);
      assert.fail();
    } catch(error) {
      assertRevert(error);
    }
  });

  it('only owner can enter refund mode', async function () {
    try {
      await vault.enableRefunds({from: _})
      assert.fail();
    } catch(error) {
      assertRevert(error);
    }

    expect(vault.enableRefunds({from: owner})).to.eventually.be.fulfilled;
  });

  it('should refund contribution after entering refund mode', async function () {
    await vault.deposit(investor, {value: etherValue, from: owner});
    await vault.enableRefunds({from: owner});

    const pre = await web3.eth.getBalance(investor);
    await vault.refund(investor);
    const post = await web3.eth.getBalance(investor);

    expect(post.minus(pre)).to.be.bignumber.equal(etherValue);
  });

  it('can not close when nothing is deposited', async function () {
    try {
      await vault.close({from: owner});
    } catch(error) {
      assertRevert(error);
    }
  });

  it('only owner can close', async function () {
    await vault.deposit(investor, {value: etherValue, from: owner});

    try {
      await vault.close({from: _});
      assert.fail();
    } catch(error) {
      assertRevert(error);
    }

    expect(vault.close({from: owner})).to.eventually.be.fulfilled;
  });

  describe("wallet balances", function () {
    // Helper imported in top of file
    let fundHelper = new FundDistributionHelper(
      developmentWallet,
      administrationWallet,
      marketingWallet,
      earlyBackersWallet
    );

    it('should forward funds to multiple wallets after closing', async function () {
      await vault.deposit(investor, {value: etherValue, from: owner});

      const before = await fundHelper.getBalances();
      await vault.close({from: owner});
      const after = await fundHelper.getBalances();

      expect(after.development).to.be.bignumber.greaterThan(before.development);
      expect(after.administration).to.be.bignumber.greaterThan(before.administration);
      expect(after.marketing).to.be.bignumber.greaterThan(before.marketing);
      expect(after.earlyBackers).to.be.bignumber.greaterThan(before.earlyBackers);
    });

    describe('repeated tests with multiple different values', function () {
      // Deposit some random amounts of wei to the vault to make sure the
      // forwarding of funds will be divided like expected
      const values = [
        new BigNumber(web3.toWei('1', 'ether')),
        new BigNumber(329083741923),
        new BigNumber(7262181)
      ];

      values.forEach(function (value) {
        it(`should calculate and forward the correct amount to each account when balance is ${value.toString()}`, async function () {
          await vault.deposit(investor, {value, from: owner});

          const before = await fundHelper.getBalances();
          await vault.close({from: owner});
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

          const bal = await web3.eth.getBalance(vault.address);
          expect(bal).to.be.bignumber.equal(new BigNumber(0));
        });

        it(`should completely empty the contract of funds when balance is ${value.toString()}`, async function () {
          await vault.deposit(investor, {value, from: owner});

          const before = await fundHelper.getBalances();
          await vault.close({from: owner});
          const after = await fundHelper.getBalances();

          const bal = await web3.eth.getBalance(vault.address);
          expect(bal).to.be.bignumber.equal(new BigNumber(0));
        });
      });
    });
  });
});
