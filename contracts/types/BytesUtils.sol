// Copyright (C) 2020  Christian Felde

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

// http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

pragma solidity ^0.5.0;

import "./BytesLib.sol";

contract BytesUtils {
    using BytesLib for bytes;

    function bToString(bytes memory b) public pure returns (string memory) {
        return b.asString();
    }

    function bToUint8(bytes memory b) public pure returns (uint256) {
        return b.asUint8();
    }

    function bToUint160(bytes memory b) public pure returns (uint160) {
        return b.asUint160();
    }

    function bToUint256(bytes memory b) public pure returns (uint256) {
        return b.asUint256();
    }

    function bToBool(bytes memory b) public pure returns (bool) {
        return b.asBool();
    }
}
