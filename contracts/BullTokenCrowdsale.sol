pragma solidity 0.4.18;

import "./BullToken.sol";
import "./Whitelist.sol";
import "./zeppelin_overrides/CappedCrowdsale.sol";
import "./zeppelin_overrides/RefundableCrowdsale.sol";

contract BullTokenCrowdsale is CappedCrowdsale, RefundableCrowdsale {
  using SafeMath for uint256;

  Whitelist public whitelist;
  uint256 public minimumInvestment;

  function BullTokenCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    uint256 _goal,
    uint256 _cap,
    uint256 _minimumInvestment,
    address _wallet,
    address _whitelistAddress
  ) public
    CappedCrowdsale(_cap)
    FinalizableCrowdsale()
    RefundableCrowdsale(_goal)
    BurnableCrowdsale(_startTime, _endTime, _rate, _wallet)
  {
    //As goal needs to be met for a successful crowdsale
    //the value needs to less or equal than a cap which is limit for accepted funds
    require(_goal <= _cap);

    whitelist = Whitelist(_whitelistAddress);
    minimumInvestment = _minimumInvestment;
  }

  function createTokenContract() internal returns (BurnableToken) {
    return new BullToken();
  }

  // fallback function can be used to buy tokens
  function () external payable {
    buyTokens(msg.sender);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public payable {
    require(beneficiary != address(0));
    require(whitelist.isWhitelisted(beneficiary));

    uint256 weiAmount = msg.value;
    uint256 raisedIncludingThis = weiRaised.add(weiAmount);

    if (raisedIncludingThis > cap) {
      require(hasStarted() && !hasEnded());
      uint256 toBeRefunded = raisedIncludingThis.sub(cap);
      weiAmount = cap.sub(weiRaised);
      beneficiary.transfer(toBeRefunded);
    } else {
      require(validPurchase());
    }

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    token.transfer(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);
    forwardFundsToWallet(weiAmount);
  }

  // overriding CappedCrowdsale#validPurchase to add minimum investment logic
  // @return true if investors can buy at the moment
  function validPurchase() internal view returns (bool) {
    return super.validPurchase() && aboveMinimumInvestment();
  }

  // overriding CappedCrowdsale#hasEnded to add minimum investment logic
  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    bool capReached = weiRaised.add(minimumInvestment) > cap;
    return super.hasEnded() || capReached;
  }

  // @return true if crowdsale event has ended
  function hasStarted() public constant returns (bool) {
    return now >= startTime;
  }

  function aboveMinimumInvestment() internal view returns (bool) {
    return msg.value >= minimumInvestment;
  }

  function forwardFundsToWallet(uint256 amount) internal {
    if (goalReached() && vault.balance > 0) {
      vault.close();
    }

    if (goalReached()) {
      wallet.call.value(amount)();
    } else {
      vault.deposit.value(amount)(msg.sender);
    }
  }

}
