pragma solidity ^0.5.0;

import "./BytesLib.sol";

contract BytesUtils {
    using BytesLib for bytes;

    function b2string(bytes memory b) public pure returns (string memory) {
        return b.asString();
    }

    function b2uint256(bytes memory b) public pure returns (uint256) {
        return b.asUint256();
    }
}
