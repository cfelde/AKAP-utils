pragma solidity ^0.5.0;

library BytesLib {
    function asString(bytes memory b) internal pure returns (string memory) {
        return string(b);
    }

    function asUint256(bytes memory b) internal pure returns (uint256 x) {
        if (b.length == 0) {
            x = 0;
        } else {
            assembly {
                x := mload(add(b, 0x20))
            }
        }
    }
}
