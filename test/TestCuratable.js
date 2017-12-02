require('./helpers/spec_helper.js');

const Curatable = artifacts.require("./Curatable.sol");

const NULL_ADDRESS = "0x0";

// Insert eval(pry.it); anywhere in code to get debug breakpoint
// in console

contract('Curatable', function([owner, otherAccount]) {

  let curatable;

  beforeEach(async function () {
    this.acc = await web3.eth.accounts[0].toString();
    this.acc2 = await web3.eth.accounts[1].toString();

    curatable = await Curatable.new();
  });


  it('has curator set to owner when newly created', async function () {
    let curator = await curatable.curator();
    let owner = await curatable.owner();

    expect(curator).to.equal(owner);
  });


  it('transfers curation rights to address when called by owner', async function () {
    await curatable.transferCurationRights(otherAccount);
    let curator = await curatable.curator();

    expect(curator).to.equal(otherAccount);
  });


  it('cannot transfer curatorship when other user than owner', async function () {
    try {
      await curatable.transferCurationRights(otherAccount, { from: otherAccount });
      assert.fail();
    } catch(error) {
      assertRevert(error);
    }
  });


  it('cannot transfer curatorship to null address', async function () {
    try {
      await curatable.transferCurationRights(NULL_ADDRESS);
      assert.fail();
    } catch(error) {
      assertRevert(error);
    }
  });

});
