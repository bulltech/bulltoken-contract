pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/crowdsale/RefundVault.sol';

contract BullTokenRefundVault is RefundVault {

  function BullTokenRefundVault(address _wallet) public RefundVault(_wallet) {}

  // We override the close function from zeppelin
  function close() onlyOwner public {
    require(state == State.Active);
    state = State.Closed;
    Closed();
    // Instead of transfer we use call to include more gas
    // in the transaction
    wallet.call.value(this.balance)();
  }
}
