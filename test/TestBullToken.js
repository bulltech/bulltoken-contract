require('./helpers/spec_helper.js');

// Insert eval(pry.it); anywhere in code to get debug breakpoint
var BullToken = artifacts.require("./BullToken.sol");

contract('BullToken', function ([owner, acc]) {
  let token;
  let ownerTokenBalance;
  let amount = 100;

  beforeEach(async function () {
    token = await BullToken.new({from: owner});
  });

  describe("burnable", function () {
    let expectedTokenSupply;
    let burnAmount = new BigNumber(web3.toWei('5000000', 'ether'));

    beforeEach(async function () {
      let totalSupply = await token.totalSupply();

      ownerTokenBalance = await token.balanceOf(owner);
      expectedTokenSupply = totalSupply.sub(burnAmount);
    });

    it('owner should be able to burn tokens', async function () {
      const {logs} = await token.burn(burnAmount, {from: owner});

      const balance = await token.balanceOf(owner);
      expect(balance).to.be.bignumber.equal(expectedTokenSupply);

      const totalSupply = await token.totalSupply();
      expect(totalSupply).to.be.bignumber.equal(expectedTokenSupply);

      const event = logs.find(e => e.event === 'Burn');
      expect(event).to.exist;
    });

    it('cannot burn more tokens than your balance', async function () {
      let tooMuchBurn = ownerTokenBalance.add(1);
      try {
        await token.burn(tooMuchBurn, {from: owner})
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });
  });

  describe("pausable", function () {
    it('should return paused false after construction', async function () {
      let paused = await token.paused();

      expect(paused).to.equal(false);
    });

    it('should return paused true after pause', async function () {
      await token.pause();
      let paused = await token.paused();

      expect(paused).to.equal(true);
    });

    it('should return paused false after pause and unpause', async function () {
      await token.pause();
      await token.unpause();
      let paused = await token.paused();

      expect(paused).to.equal(false);
    });

    it('should be able to transfer if transfers are unpaused', async function () {
      await token.approve(owner, amount);
      let balance0 = await token.balanceOf(owner);
      await token.transferFrom(owner, acc, amount);
      let balance0AfterTransfer = await token.balanceOf(owner);
      expect(balance0AfterTransfer).to.bignumber.equal(balance0.sub(amount));

      let balance1 = await token.balanceOf(acc);
      expect(balance1).to.bignumber.equal(amount);
    });

    it('should be able to transfer after transfers are paused and unpaused', async function () {
      await token.pause();
      await token.unpause();

      let balance0 = await token.balanceOf(owner);

      await token.transfer(acc, amount);

      let balance0AfterTransfer = await token.balanceOf(owner);

      expect(balance0AfterTransfer).to.bignumber.equal(balance0.sub(amount));

      let balance1 = await token.balanceOf(acc);
      expect(balance1).to.bignumber.equal(amount);
    });

    it('should throw an error trying to transfer while transactions are paused', async function () {
      await token.pause();
      try {
        await token.transfer(acc, amount);
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should throw an error trying to transfer from another account while transactions are paused', async function () {
      await token.pause();
      try {
        await token.transferFrom(owner, acc, amount);
        assert.fail('should have thrown before');
      } catch (error) {
        assertRevert(error);
      }
    });

    describe("transferrable", function () {

      it('should be non transferrable by default', async function () {
        expect(await token.transferEnabled()).to.equal(false);

        try {
          await token.transferFrom(owner, acc, amount);
          assert.fail('should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('should become transferrable when transfers enabled by owner', async function () {
        await token.enableTransfers({from: owner});
        expect(await token.transferEnabled()).to.equal(true);
      });

      it('should become non-transferrable when transfers disabled by owner', async function () {
        await token.enableTransfers({from: owner});
        await token.disableTransfers({from: owner});
        expect(await token.transferEnabled()).to.equal(false);

        try {
          await token.transferFrom(owner, acc, amount);
          assert.fail('should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('should not be possible to enable transfers as other than owner', async function () {
        try {
          await token.enableTransfers({from: acc});
          assert.fail('should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

      it('should not be possible to disable transfers as other than owner', async function () {
        await token.enableTransfers({from: owner});

        try {
          await token.disableTransfers({from: acc});
          assert.fail('should have thrown before');
        } catch (error) {
          assertRevert(error);
        }
      });

    });

  });

  describe("holdable", async function () {

    it('should add holder on transfer', async function () {
      await token.transfer(acc, amount);
      let holder = await token.holders(0);
      let isHolderStatus = await token.isHolder(acc);
      expect(holder).to.equal(acc);
      expect(isHolderStatus).to.equal(true);
    });

    it('should add holder on transferFrom', async function () {
      await token.approve(owner, amount);
      await token.transferFrom(owner, acc, amount);
      let holder = await token.holders(0);
      let isHolderStatus = await token.isHolder(acc);
      expect(holder).to.equal(acc);
      expect(isHolderStatus).to.equal(true);
    });

  });


});
