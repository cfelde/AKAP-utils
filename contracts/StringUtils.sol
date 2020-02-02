pragma solidity ^0.5.0;

import "./StringLib.sol";

contract StringUtils {
    using StringLib for string;

    function s2bytes(string memory s) public pure returns (bytes memory) {
        return s.asBytes();
    }
}
