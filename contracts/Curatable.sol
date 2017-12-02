pragma solidity 0.4.18;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Curatable
 * @dev The Curatable contract has an curator address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions". This is heavily based on
 * the Ownable contract
 */
contract Curatable is Ownable {
  address public curator;


  event CurationRightsTransferred(address indexed previousCurator, address indexed newCurator);


  /**
   * @dev The Curatable constructor sets the original `curator` of the contract to the sender
   * account.
   */
  function Curatable() public {
    owner = msg.sender;
    curator = owner;
  }


  /**
   * @dev Throws if called by any account other than the curator.
   */
  modifier onlyCurator() {
    require(msg.sender == curator);
    _;
  }


  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newCurator The address to transfer ownership to.
   */
  function transferCurationRights(address newCurator) public onlyOwner {
    require(newCurator != address(0));
    CurationRightsTransferred(curator, newCurator);
    curator = newCurator;
  }

}
