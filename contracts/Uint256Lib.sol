pragma solidity ^0.5.0;

library Uint256Lib {
    function asBytes(uint256 x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        assembly {
            mstore(add(b, 32), x)
        }
    }
}
