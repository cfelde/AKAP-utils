pragma solidity ^0.5.0;

import "./Uint256Lib.sol";

contract Uint256Utils {
    using Uint256Lib for uint256;

    function x2bytes(uint256 x) public pure returns (bytes memory) {
        return x.asBytes();
    }
}
