pragma solidity 0.4.18;
import "./Curatable.sol";

contract Whitelist is Curatable {
    mapping (address => bool) public whitelist;


    function Whitelist() public {
    }


    function addInvestor(address investor) external onlyCurator {
        require(investor != 0x0 && !whitelist[investor]);
        whitelist[investor] = true;
    }


    function removeInvestor(address investor) external onlyCurator {
        require(investor != 0x0 && whitelist[investor]);
        whitelist[investor] = false;
    }


    function isWhitelisted(address investor) constant external returns (bool result) {
        return whitelist[investor];
    }

}