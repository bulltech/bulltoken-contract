pragma solidity 0.4.18;

import "zeppelin-solidity/contracts/token/BurnableToken.sol";
import "zeppelin-solidity/contracts/token/PausableToken.sol";

contract BullToken is BurnableToken, PausableToken {

  string public constant name = "BullToken";
  string public constant symbol = "BULL";
  uint256 public constant decimals = 18;
  uint256 public constant INITIAL_SUPPLY = 55000000;
  bool public transferEnabled;

  mapping (address => bool) public isHolder;
  address [] public holders;

  function BullToken() public {
    totalSupply = INITIAL_SUPPLY * 10 ** uint256(decimals);
    balances[msg.sender] = totalSupply;
    transferEnabled = false;
  }

  function enableTransfers() onlyOwner public {
    transferEnabled = true;
    TransferEnabled();
  }

  function disableTransfers() onlyOwner public {
    transferEnabled = false;
    TransferDisabled();
  }

  /**
 * @dev transfer token for a specified address
 * @param to The address to transfer to.
 * @param value The amount to be transferred.
 */
  function transfer(address to, uint256 value) public returns (bool) {
    require(transferEnabled || msg.sender == owner);

    // Update the list of holders for new address
    if (!isHolder[to]) {
      holders.push(to);
      isHolder[to] = true;
    }

    return super.transfer(to, value);
  }

  /**
  * @dev Transfer tokens from one address to another
  * @param from address The address which you want to send tokens from
  * @param to address The address which you want to transfer to
  * @param value uint256 the amount of tokens to be transferred
  */
  function transferFrom(address from, address to, uint256 value) public returns (bool) {
    require(transferEnabled || from == owner);

    // Update the list of holders for new address
    if (!isHolder[to]) {
      holders.push(to);
      isHolder[to] = true;
    }

    return super.transferFrom(from, to, value);
  }

  event TransferEnabled();
  event TransferDisabled();

}
