pragma solidity ^0.5.0;

library StringLib {
    function asBytes(string memory s) internal pure returns (bytes memory) {
        return bytes(s);
    }
}
