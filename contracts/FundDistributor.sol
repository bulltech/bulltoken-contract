pragma solidity 0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract FundDistributor is Ownable {
  using SafeMath for uint256;

  address private developmentWallet;
  address private marketingWallet;
  address private administrationWallet;
  address private earlyBackersWallet;

  function FundDistributor(
    address _developmentWallet,
    address _marketingWallet,
    address _administrationWallet,
    address _earlyBackersWallet
  ) public {
    require(_developmentWallet != address(0));
    require(_marketingWallet != address(0));
    require(_administrationWallet != address(0));
    require(_earlyBackersWallet != address(0));

    developmentWallet = _developmentWallet;
    marketingWallet = _marketingWallet;
    administrationWallet = _administrationWallet;
    earlyBackersWallet = _earlyBackersWallet;
  }

  // fallback function
  function () external payable {
    require(msg.value > 0);

    developmentWallet.transfer(cutForDevelopment(msg.value));
    marketingWallet.transfer(cutForMarketing(msg.value));
    administrationWallet.transfer(cutForAdministration(msg.value));
    earlyBackersWallet.transfer(cutForEarlyBackers(msg.value));

    // Transfer the remaining amount from imprecise calculation
    marketingWallet.transfer(this.balance);
  }

  function cutForDevelopment(uint256 totalBalance) internal pure returns (uint256) {
    uint8 percentageCut = 56;
    return percentage(percentageCut, totalBalance);
  }

  function cutForMarketing(uint256 totalBalance) internal pure returns (uint256) {
    uint8 percentageCut = 12;
    return percentage(percentageCut, totalBalance);
  }

  function cutForAdministration(uint256 totalBalance) internal pure returns (uint256) {
    uint8 percentageCut = 15;
    return percentage(percentageCut, totalBalance);
  }

  function cutForEarlyBackers(uint256 totalBalance) internal pure returns (uint256) {
    uint8 percentageCut = 17;
    return percentage(percentageCut, totalBalance);
  }

  function percentage(uint8 percentage, uint256 number) internal pure returns(uint256) {
    return number.div(100).mul(percentage);
  }
}
