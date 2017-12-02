require('./helpers/spec_helper.js');
import FundDistributionHelper from './helpers/fundDistributionHelpers';

var BullToken = artifacts.require("./BullToken.sol");
var FundDistributor = artifacts.require("./FundDistributor.sol");
var Whitelist = artifacts.require("./Whitelist.sol");
var BullTokenCrowdsale = artifacts.require("./BullTokenCrowdsale.sol");
var BullTokenRefundVault = artifacts.require("./BullTokenRefundVault.sol");

// Insert
//eval(pry.it);
// anywhere in code to get debug breakpoint
// in console

contract('BullTokenCrowdsale', function([
    owner,
    developmentWallet,
    marketingWallet,
    administrationWallet,
    earlyBackersWallet,
    purchaser,
    purchaser2,
    purchaser3
  ]) {

  const minimumInvestment = new BigNumber(web3.toWei('0.01','ether'));
  const goal = new BigNumber(web3.toWei("0.1", 'ether'));
  const rate = new BigNumber(500);
  const cap = new BigNumber(web3.toWei("0.8", 'ether'));
  const validInvestment = minimumInvestment.add(new BigNumber(100000));
  const tokenAmount = minimumInvestment * rate;

  let whitelist;

  before(async function () {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock();
  });

  beforeEach(async function () {
    this.startTime = latestTime() + duration.weeks(1);
    this.endTime = this.startTime + duration.weeks(1);
    this.afterEndTime = this.endTime + duration.seconds(1);

    const fundDistributor = await FundDistributor.new(
      developmentWallet,
      marketingWallet,
      administrationWallet,
      earlyBackersWallet,
      { from: owner }
    );

    whitelist = await Whitelist.new({from: owner});

    this.crowdsale = await BullTokenCrowdsale.new(
      this.startTime,
      this.endTime,
      rate,
      goal,
      cap,
      minimumInvestment,
      fundDistributor.address,
      whitelist.address,
      {from: owner}
    );

    this.token = BullToken.at(await this.crowdsale.token());
    this.vault = BullTokenRefundVault.at(await this.crowdsale.vault());
    this.vaultAddress = await this.crowdsale.vault();

    await whitelist.addInvestor(owner, { from: owner });
    await whitelist.addInvestor(purchaser, { from: owner });
    await whitelist.addInvestor(purchaser2, { from: owner });
    await whitelist.addInvestor(purchaser3, { from: owner });
  });

  describe("crowdsale has NOT started", function () {

    it('should reject payments before start', async function () {
      try {
        await this.crowdsale.send(validInvestment);
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await this.crowdsale.buyTokens(purchaser, {from: purchaser, value: validInvestment});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should deny refunds before start', async function () {
      try {
        await this.crowdsale.claimRefund({from: purchaser});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

  });

  describe("crowdsale has started", function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime)
    });

    it("should be possible to buy tokens from owner account", async function () {
      await this.crowdsale.sendTransaction({from: owner, value: validInvestment});
      var balance = await this.token.balanceOf(owner);
      expect(balance).to.bignumber.equal(validInvestment * rate);
    });

    it("should be possible to buy tokens from a different account", async function() {
      await this.crowdsale.sendTransaction({ from: purchaser, value: validInvestment });
      var balance =  await this.token.balanceOf(purchaser);
      expect(balance).to.bignumber.equal(validInvestment * rate);
    });

    it("should be possible to buy tokens from two different accounts", async function() {
      await this.crowdsale.sendTransaction({ from: purchaser, value: validInvestment });
      await this.crowdsale.sendTransaction({ from: owner, value: validInvestment });

      var balance = await this.token.balanceOf(purchaser);
      var balance2 =  await this.token.balanceOf(owner);

      expect(balance).to.bignumber.equal(validInvestment * rate);
      expect(balance2).to.bignumber.equal(validInvestment * rate);
    });

    it("should populate vault when tokens are bought", async function() {
      await this.crowdsale.sendTransaction({ from: purchaser2, value: validInvestment });
      var depositedInVault = await this.vault.deposited(purchaser2);
      expect(depositedInVault).to.bignumber.equal(validInvestment);
    });

    it ("should increase weiRaised when tokens are bought", async function() {
      await this.crowdsale.sendTransaction({ from: owner, value: validInvestment });
      await this.crowdsale.sendTransaction({ from: purchaser, value: validInvestment });

      var weiRaised = await this.crowdsale.weiRaised();

      expect(weiRaised).to.bignumber.equal(validInvestment * 2);
    });

    it("should NOT be possible to transfer tokens ", async function () {
      await this.crowdsale.sendTransaction({ from: purchaser, value: validInvestment });
      try {
        await this.token.transfer(purchaser2, validInvestment, {from: purchaser});
        assert.fail();
      } catch(error) {
        assertRevert(error);
      }
    });

    it("total supply should be assigned on token create", async function () {
      var totalSupply = await this.token.totalSupply();
      var initialSupply = await this.token.INITIAL_SUPPLY();
      var exponent = await this.token.decimals();
      expect(totalSupply).to.bignumber.equal(initialSupply * Math.pow(10, exponent));
    });

    it('should deny refunds before end', async function () {
      try {
        await this.crowdsale.claimRefund({from: purchaser});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should NOT allow anyone who is not the owner to finalize the crowdsale', async function () {
      try {
        await this.crowdsale.finalize({from: purchaser});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await this.crowdsale.finalize({from: purchaser});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    describe("minimum investments", function () {

      it("accepts exact minimum investment", async function () {
        try {
          await this.crowdsale.sendTransaction({from: purchaser, value: minimumInvestment});
        } catch (error) {
          assert.fail();
        }
      });

      it("does not accept less than the minimum investment", async function () {
        const tooSmallInvestment = minimumInvestment.sub(new BigNumber(1));
        try {
          await this.crowdsale.sendTransaction({from: purchaser, value: tooSmallInvestment});
          assert.fail();
        } catch (error) {
          assertRevert(error);
        }
      });

      it("closes presale when remaining is less than minimum investment", async function () {
        const halfOfMinimumInvestment = minimumInvestment.mul(0.5);
        const almostCap = cap.sub(halfOfMinimumInvestment);
        await this.crowdsale.sendTransaction({from: purchaser, value: almostCap});

        expect(await this.crowdsale.hasEnded()).to.equal(true);
      });

    });

    describe("the last investment", function () {

      describe("valid", function () {
        const moreThanTxCost = new BigNumber(300000000000000000);
        let purchasersOldEthBalance;
        let vaultsOldEthBalance;

        beforeEach(async function () {
          const moreThanCap = cap.add(minimumInvestment);
          purchasersOldEthBalance = await web3.eth.getBalance(purchaser);
          vaultsOldEthBalance = await this.vault.deposited(purchaser);

          await this.crowdsale.sendTransaction({from: purchaser, value: moreThanCap});
        });

        it("ends the crowdsale", async function () {
          expect(await this.crowdsale.hasEnded()).to.equal(true);
        });

        it("set weiRaised to max", async function () {
          const weiRaised = await this.crowdsale.weiRaised();
          expect(weiRaised).to.bignumber.equal(cap);
        });

        it("returns overshooting amount to purchaser", async function () {
          const purchasersNewEthBalance = await web3.eth.getBalance(purchaser);
          let expectedNewBalance = purchasersOldEthBalance.sub(cap);

          // The below is done because a) Some wei will be deducted because of tx costs, and b) Mocha doesn't have a between matcher
          expect(purchasersNewEthBalance).to.bignumber.above(expectedNewBalance.sub(moreThanTxCost));
          expect(purchasersNewEthBalance).to.bignumber.below(expectedNewBalance.add(moreThanTxCost));
        });

        it("gives the purchaser the corresponding amount of BULL", async function () {
          const purchasersBullBalance = await this.token.balanceOf(purchaser);
          const totalSupply = await this.crowdsale.cap();
          expect(purchasersBullBalance).to.bignumber.equal(totalSupply * rate);
        });
      });

      describe("below minimum investment", function () {

        beforeEach(async function () {
          const almostCap = cap.sub(new BigNumber(1));
          await this.crowdsale.sendTransaction({from: purchaser, value: almostCap});
        });

        it("rejects the investment", async function () {
          const lessThanMinimumInvestmentButCrossesCap = minimumInvestment.mul(0.5);
          try {
            await this.crowdsale.sendTransaction({from: purchaser2, value: lessThanMinimumInvestmentButCrossesCap});
            assert.fail();
          } catch (error) {
            assertRevert(error);
          }
        });
      });
    });

  });


  describe("goal is NOT reached, and crowdsale ends", async function () {

    let lessThanGoal;

    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
      lessThanGoal = goal * 0.9;
      await this.crowdsale.sendTransaction({ from: purchaser, value: lessThanGoal });
      await increaseTimeTo(this.afterEndTime);
    });

    it("should refund ETH to buyers", async function () {
      await this.crowdsale.finalize({from: owner});
      var prevEthBalance = web3.fromWei(web3.eth.getBalance(purchaser), "ether");
      await this.crowdsale.claimRefund({from: purchaser});
      var depositedInVault = await this.vault.deposited(purchaser);
      expect(depositedInVault).to.bignumber.equal(0);
      var ethBalance = web3.fromWei(web3.eth.getBalance(purchaser), "ether");
      expect((ethBalance + lessThanGoal)).to.be.bignumber.above(prevEthBalance);
    });
  });

  describe("goal is reached, crowdsale not yet ended", async function () {
    // Helper imported in top of file
    let fundHelper = new FundDistributionHelper(
      developmentWallet,
      administrationWallet,
      marketingWallet,
      earlyBackersWallet
    );

    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
    });

    it("should transfer funds directly into the four wallets", async function () {
      // The goal is passed
      const moreThanGoal = goal.mul(1.4);
      await this.crowdsale.sendTransaction({ from: purchaser, value: moreThanGoal });

      const before = await fundHelper.getBalances();
      await this.crowdsale.sendTransaction({ from: purchaser2, value: minimumInvestment });
      const after = await fundHelper.getBalances();

      expect(after.development).to.be.bignumber.greaterThan(before.development);
      expect(after.administration).to.be.bignumber.greaterThan(before.administration);
      expect(after.marketing).to.be.bignumber.greaterThan(before.marketing);
      expect(after.earlyBackers).to.be.bignumber.greaterThan(before.earlyBackers);
    });

    it("should empty the vault when goal is reached", async function () {
      // First purchase goes into vault
      await this.crowdsale.sendTransaction({ from: purchaser2, value: minimumInvestment });

      // Check to make sure vault is not empty
      expect(await web3.eth.getBalance(this.vaultAddress)).to.be.bignumber.equal(minimumInvestment);

      // Second purchase passes the goal and triggers the vault transfer
      await this.crowdsale.sendTransaction({ from: purchaser3, value: goal });

      // Check if vault has been emptied
      expect(await web3.eth.getBalance(this.vaultAddress)).to.be.bignumber.equal(new BigNumber(0));
    });

    it("should transfer the vault balance into the four wallets on the purchase where we reach the goal", async function () {
      const before = await fundHelper.getBalances();

      // First purchase goes into vault
      await this.crowdsale.sendTransaction({ from: purchaser2, value: minimumInvestment });

      // Second purchase passes the goal and triggers the vault transfer
      await this.crowdsale.sendTransaction({ from: purchaser3, value: goal });

      const after = await fundHelper.getBalances();
      const expectedGains = fundHelper.expectedFundDistribution(goal.add(minimumInvestment));

      // We expect the account balances to have been increased by goal + minimumInvestment
      // where each have been splitted into their respective cuts and the rest value ends up
      // in marketing
      expect(before.development.add(expectedGains.development))
             .to.be.bignumber.equal(after.development);
      expect(before.administration.add(expectedGains.administration))
             .to.be.bignumber.equal(after.administration);
      expect(before.marketing.add(expectedGains.marketing))
             .to.be.bignumber.equal(after.marketing);
      expect(before.earlyBackers.add(expectedGains.earlyBackers))
             .to.be.bignumber.equal(after.earlyBackers);
    });
  });

  describe("goal is reached, then crowdsale ends", async function () {

    beforeEach(async function () {
      await increaseTimeTo(this.startTime);
      const moreThanGoal = goal * 1.4;
      await this.crowdsale.sendTransaction({from: purchaser, value: moreThanGoal});
      await increaseTimeTo(this.afterEndTime);
    });

    it('should deny refunds', async function () {
      try {
        await this.crowdsale.claimRefund({from: purchaser});
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });
  });
});
